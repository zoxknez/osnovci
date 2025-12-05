// Upload API - File uploads (Images, PDFs, etc) - Mobile Optimized + Security Enhanced!

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { checkImageSafety } from "@/lib/safety/image-safety";
import { advancedFileScan } from "@/lib/security/advanced-file-scanner";
import { csrfMiddleware } from "@/lib/security/csrf";
import {
  sanitizeFileName,
  validateFileUpload,
} from "@/lib/security/file-upload";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { idSchema } from "@/lib/security/validators";
import { ActivityLogger } from "@/lib/tracking/activity-logger";

// Note: File size and type validation now handled by lib/security/file-upload.ts

export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate Limiting - Upload preset (5 uploads per 5 minutes)
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.upload,
      prefix: "upload",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          error: "Previše upload-a. Pokušaj ponovo za par minuta.",
          requestId,
        },
        { status: 429, headers },
      );
    }

    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Zabranjeno", message: csrfResult.error, requestId },
        { status: 403 },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    // Get student ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json(
        { error: "Student profil nije pronađen", requestId },
        { status: 404 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const homeworkId = formData.get("homeworkId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Fajl nije dostavljen", requestId },
        { status: 400 },
      );
    }

    if (!homeworkId) {
      return NextResponse.json(
        { error: "ID zadatka je obavezan", requestId },
        { status: 400 },
      );
    }

    // Validate homework ID format
    try {
      idSchema.parse(homeworkId);
    } catch {
      return NextResponse.json(
        { error: "Nevažeći format ID-a zadatka", requestId },
        { status: 400 },
      );
    }

    // ENHANCED FILE VALIDATION - Security checks
    const fileValidation = await validateFileUpload(file);
    if (!fileValidation.valid) {
      log.warn("File validation failed", {
        error: fileValidation.error,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        requestId,
      });
      return NextResponse.json(
        {
          error: "Validacija fajla nije uspela",
          message: fileValidation.error,
          requestId,
        },
        { status: 400 },
      );
    }

    // Get file buffer for further processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 🛡️ ADVANCED SECURITY SCAN - VirusTotal, EXIF removal, PDF JS detection
    const scanResult = await advancedFileScan(buffer, file.name, file.type);

    if (!scanResult.safe) {
      log.error("Security threat detected in upload", {
        fileName: file.name,
        scanType: scanResult.scanType,
        error: scanResult.error,
        details: scanResult.details,
        studentId: user.student.id,
        requestId,
      });

      // Log security incident for monitoring
      await ActivityLogger.securityIncident(
        user.student.id,
        "malicious_file_upload",
        {
          fileName: file.name,
          scanType: scanResult.scanType,
          threatNames: scanResult.details.threatNames,
          malicious: scanResult.details.malicious,
        },
        request,
      );

      return NextResponse.json(
        {
          error: "Bezbednosna pretnja detektovana",
          message:
            scanResult.error ||
            "Fajl sadrži sumnjiv sadržaj i ne može biti upload-ovan",
          requestId,
        },
        { status: 400 },
      );
    }

    // Log successful scan (important for audit trail)
    log.info("File passed security scan", {
      fileName: file.name,
      scanType: scanResult.scanType,
      exifRemoved: scanResult.details.exifRemoved,
      malicious: scanResult.details.malicious,
      totalEngines: scanResult.details.totalEngines,
    });

    // Check homework ownership
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { student: true },
    });

    if (!homework || homework.studentId !== user.student.id) {
      return NextResponse.json(
        { error: "Nemate pristup ovom zadatku", requestId },
        { status: 403 },
      );
    }

    // Buffer already created above after security scan
    let finalBuffer: Buffer = buffer;

    // Generate unique filename - SANITIZED
    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name);
    const fileName = `${timestamp}-${safeName.replace(/\.[^.]+$/, ".jpg")}`; // Always JPEG
    const thumbnailName = `${timestamp}-thumb-${safeName.replace(/\.[^.]+$/, ".jpg")}`;

    // Log file hash (for duplicate detection & security)
    log.info("File upload validated", {
      hash: fileValidation.hash,
      fileName: safeName,
      originalSize: file.size,
      sanitizedName: fileName,
    });
    // Create uploads directories (Only needed for local fallback, but good to have)
    // const uploadsDir = join(process.cwd(), "public", "uploads");
    // const thumbnailsDir = join(uploadsDir, "thumbnails");
    // await mkdir(uploadsDir, { recursive: true });
    // await mkdir(thumbnailsDir, { recursive: true });

    // Mobile Optimization: Compress images with Sharp!
    if (file.type.startsWith("image/")) {
      try {
        // Optimize image - Mobile friendly!
        const optimized = await sharp(finalBuffer)
          .resize(1920, 1080, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 85,
            progressive: true, // Better for mobile loading
            mozjpeg: true, // Better compression
          })
          .toBuffer();

        // Generate thumbnail (fast loading on mobile!)
        const thumbnail = await sharp(finalBuffer)
          .resize(400, 400, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: 75 })
          .toBuffer();

        // Save optimized versions
        finalBuffer = Buffer.from(optimized); // Replace original with optimized

        // Upload thumbnail to Storage Service
        const { StorageService } = await import(
          "@/lib/storage/storage-service"
        );
        const thumbKey = `thumbnails/${thumbnailName}`;
        await StorageService.upload(
          Buffer.from(thumbnail),
          thumbKey,
          "image/jpeg",
        );

        log.info("Image optimized for mobile", {
          originalSize: bytes.byteLength,
          optimizedSize: finalBuffer.length,
          reduction: `${(((bytes.byteLength - finalBuffer.length) / bytes.byteLength) * 100).toFixed(1)}%`,
          exifRemoved: scanResult.details.exifRemoved,
        });
      } catch (error) {
        log.warn("Image optimization failed, using original", { error });
        // Continue with original if optimization fails
      }
    }

    // Upload main file to Storage Service
    const { StorageService } = await import("@/lib/storage/storage-service");
    const uploadResult = await StorageService.upload(
      finalBuffer,
      fileName,
      file.type.startsWith("image/") ? "image/jpeg" : file.type,
    );

    log.info("File uploaded", {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      homeworkId,
      studentId: user.student.id,
      provider: uploadResult.provider,
    });

    // SAFETY CHECK - Image moderation for children!
    if (file.type.startsWith("image/")) {
      const safetyResult = await checkImageSafety(finalBuffer);
      if (!safetyResult.safe) {
        log.warn("Image flagged as potentially unsafe", {
          fileName,
          score: safetyResult.score,
          reasons: safetyResult.reasons,
          flagged: safetyResult.flaggedForReview,
        });
      }

      // Notify parent if required
      if (safetyResult.parentNotificationRequired) {
        // Get parent emails and send notification
        const student = await prisma.student.findUnique({
          where: { id: user.student.id },
          include: {
            links: {
              where: { isActive: true },
              include: {
                guardian: {
                  include: { user: { select: { email: true } } },
                },
              },
            },
          },
        });

        if (student?.links) {
          const { sendFlaggedContentEmail } = await import(
            "@/lib/email/templates"
          );
          for (const link of student.links) {
            const parentEmail = link.guardian.user.email;
            if (parentEmail) {
              await sendFlaggedContentEmail(
                parentEmail,
                fileName,
                safetyResult.reasons,
                user.student.name || "Student",
              ).catch((err) => {
                log.warn("Failed to send flagged content email", {
                  error: err,
                });
              });
            }
          }
        }
      }
    }

    // Log activity for parents (IMPORTANT - they need to know!)
    await ActivityLogger.photoUploaded(
      user.student.id,
      fileName,
      homeworkId,
      request,
    );

    // Determine attachment type
    let attachmentType: "IMAGE" | "VIDEO" | "PDF" | "AUDIO" = "IMAGE";
    if (file.type.startsWith("video/")) attachmentType = "VIDEO";
    if (file.type === "application/pdf") attachmentType = "PDF";
    if (file.type.startsWith("audio/")) attachmentType = "AUDIO";

    // Save attachment to database
    const thumbnailPath =
      attachmentType === "IMAGE"
        ? `/uploads/thumbnails/${thumbnailName}`
        : undefined;

    // Use the URL returned from StorageService
    const fileUrl = uploadResult.url;
    const thumbnailUrl = thumbnailPath
      ? uploadResult.provider === "local"
        ? thumbnailPath
        : `${process.env["STORAGE_PUBLIC_URL"] || ""}/thumbnails/${thumbnailName}`
      : undefined;

    const attachment = await prisma.attachment.create({
      data: {
        homeworkId,
        type: attachmentType,
        fileName,
        fileSize: finalBuffer.length, // Optimized size!
        mimeType: attachmentType === "IMAGE" ? "image/jpeg" : file.type,
        localUri: fileUrl, // For backward compatibility or local caching
        remoteUrl: fileUrl,
        ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: "Fajl je uspešno upload-ovan!",
        attachment: {
          id: attachment.id,
          url: fileUrl,
          type: attachmentType,
          fileName,
          fileSize: file.size,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("POST /api/upload failed", { error, requestId });
    return NextResponse.json(
      {
        error: "Greška pri upload-u fajla",
        requestId,
      },
      { status: 500 },
    );
  }
}
