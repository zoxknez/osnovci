// Upload API - File uploads (Images, PDFs, etc) - Mobile Optimized + Security Enhanced!
import { type NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { auth } from "@/lib/auth/config";
import { getAuthSession } from "@/lib/auth/demo-mode";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { ActivityLogger } from "@/lib/tracking/activity-logger";
import { checkImageSafety } from "@/lib/safety/image-safety";
import { csrfMiddleware } from "@/lib/security/csrf";
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from "@/lib/security/rate-limit";
import { validateFileUpload, sanitizeFileName, basicMalwareScan } from "@/lib/security/file-upload";
import { idSchema } from "@/lib/security/validators";

// Note: File size and type validation now handled by lib/security/file-upload.ts

export async function POST(request: NextRequest) {
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
          error: "Too Many Requests", 
          message: "Previše upload-a. Pokušaj ponovo za par minuta." 
        },
        { status: 429, headers },
      );
    }

    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const session = await getAuthSession(auth);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani" },
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
        { error: "Not Found", message: "Student profil nije pronađen" },
        { status: 404 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const homeworkId = formData.get("homeworkId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!homeworkId) {
      return NextResponse.json(
        { error: "Homework ID is required" },
        { status: 400 },
      );
    }

    // Validate homework ID format
    try {
      idSchema.parse(homeworkId);
    } catch {
      return NextResponse.json(
        { error: "Invalid homework ID format" },
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
      });
      return NextResponse.json(
        {
          error: "File validation failed",
          message: fileValidation.error,
        },
        { status: 400 },
      );
    }

    // Get file buffer for further processing
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // MALWARE SCAN - Basic heuristics
    const malwareScan = basicMalwareScan(uint8Array);
    if (!malwareScan.safe) {
      log.error("Malware detected in upload", {
        fileName: file.name,
        reason: malwareScan.reason,
        studentId: user.student.id,
      });
      return NextResponse.json(
        {
          error: "Security threat detected",
          message: "Fajl sadrži sumnjiv sadržaj i ne može biti upload-ovan",
        },
        { status: 400 },
      );
    }

    // Check homework ownership
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { student: true },
    });

    if (!homework || homework.studentId !== user.student.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "Nemate pristup ovom zadatku" },
        { status: 403 },
      );
    }

    // Convert to buffer
    let buffer: Buffer = Buffer.from(bytes);

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
    // Create uploads directories
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const thumbnailsDir = join(uploadsDir, "thumbnails");
    await mkdir(uploadsDir, { recursive: true });
    await mkdir(thumbnailsDir, { recursive: true });

    // Mobile Optimization: Compress images with Sharp!
    if (file.type.startsWith("image/")) {
      try {
        // Optimize image - Mobile friendly!
        const optimized = await sharp(buffer)
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
        const thumbnail = await sharp(buffer)
          .resize(400, 400, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: 75 })
          .toBuffer();

        // Save optimized versions
        buffer = Buffer.from(optimized); // Replace original with optimized

        const thumbnailPath = join(thumbnailsDir, thumbnailName);
        await writeFile(thumbnailPath, thumbnail);

        log.info("Image optimized for mobile", {
          originalSize: bytes.byteLength,
          optimizedSize: buffer.length,
          reduction: `${(((bytes.byteLength - buffer.length) / bytes.byteLength) * 100).toFixed(1)}%`,
        });
      } catch (error) {
        log.warn("Image optimization failed, using original", { error });
        // Continue with original if optimization fails
      }
    }

    // Save file to disk
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    log.info("File uploaded", {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      homeworkId,
      studentId: user.student.id,
    });

    // SAFETY CHECK - Image moderation for children!
    if (file.type.startsWith("image/")) {
      const safetyResult = await checkImageSafety(buffer);

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
        // TODO: Send email to parent
        log.info("Parent notification required for flagged image", {
          fileName,
        });
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
    const attachment = await prisma.attachment.create({
      data: {
        homeworkId,
        type: attachmentType,
        fileName,
        fileSize: buffer.length, // Optimized size!
        mimeType: attachmentType === "IMAGE" ? "image/jpeg" : file.type,
        localUri: `/uploads/${fileName}`,
        remoteUrl: `/uploads/${fileName}`,
        thumbnail:
          attachmentType === "IMAGE"
            ? `/uploads/thumbnails/${thumbnailName}`
            : undefined,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Fajl je uspešno upload-ovan!",
        attachment: {
          id: attachment.id,
          url: `/uploads/${fileName}`,
          type: attachmentType,
          fileName,
          fileSize: file.size,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("POST /api/upload failed", { error });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Greška pri upload-u fajla",
      },
      { status: 500 },
    );
  }
}
