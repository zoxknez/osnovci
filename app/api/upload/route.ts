// Upload API - File uploads (Images, PDFs, etc)
import { type NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

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
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    if (!homeworkId) {
      return NextResponse.json(
        { error: "Homework ID is required" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          message: `Fajl je prevelik. Maksimum je 5MB. (Trenutno: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          message: `Tip fajla nije dozvoljen. Dozvoljeno: slike, PDF, video. (Trenutno: ${file.type})`,
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedName}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

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
        fileSize: file.size,
        mimeType: file.type,
        localUri: `/uploads/${fileName}`,
        remoteUrl: `/uploads/${fileName}`, // For now, same as local
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

