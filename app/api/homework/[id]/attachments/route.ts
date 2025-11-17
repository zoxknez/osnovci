// Homework Attachments API - Upload fotografija za domaće zadatke

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/**
 * POST /api/homework/[id]/attachments
 * Upload attachment for homework
 */
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: homeworkId } = await context.params;

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify homework exists and get student
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        studentId: true,
        student: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 },
      );
    }

    // Check ownership
    if (homework.student.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't own this homework" },
        { status: 403 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max size: 10MB" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;

    // Upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "homework");

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filepath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Determine type based on MIME
    const type = file.type.startsWith("image/") ? "IMAGE" : "PDF";

    // Create attachment record in database
    const attachment = await prisma.attachment.create({
      data: {
        homeworkId,
        type,
        fileName: filename,
        fileSize: file.size,
        mimeType: file.type,
        remoteUrl: `/uploads/homework/${filename}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        remoteUrl: attachment.remoteUrl,
        uploadedAt: attachment.uploadedAt,
      },
    });
  } catch (error) {
    const { id: homeworkId } = await context.params;
    log.error("Failed to upload attachment", error, { homeworkId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/homework/[id]/attachments
 * Get all attachments for homework
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: homeworkId } = await context.params;

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify homework exists
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        studentId: true,
        student: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 },
      );
    }

    // Check access (owner or guardian)
    const isOwner = homework.student.userId === session.user.id;

    if (!isOwner) {
      // Check if user is guardian
      const guardianLink = await prisma.link.findFirst({
        where: {
          studentId: homework.studentId,
          guardian: {
            userId: session.user.id,
          },
        },
      });

      if (!guardianLink) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get attachments
    const attachments = await prisma.attachment.findMany({
      where: { homeworkId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        type: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        remoteUrl: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      attachments,
    });
  } catch (error) {
    const { id: homeworkId } = await context.params;
    log.error("Failed to fetch attachments", error, { homeworkId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/homework/[id]/attachments
 * Delete attachment
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: homeworkId } = await context.params;

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "Attachment ID required" },
        { status: 400 },
      );
    }

    // Find attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        homeworkId: true,
        remoteUrl: true,
        homework: {
          select: {
            student: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!attachment || attachment.homeworkId !== homeworkId) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    // Check ownership
    if (attachment.homework.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from filesystem
    if (attachment.remoteUrl) {
      const fs = await import("node:fs/promises");
      const filepath = join(process.cwd(), "public", attachment.remoteUrl);
      try {
        await fs.unlink(filepath);
      } catch (err) {
        log.warn("Failed to delete local file", { error: err, path: filepath });
        // Continue anyway - file might not exist
      }
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({
      success: true,
      message: "Attachment deleted",
    });
  } catch (error) {
    const { id: attachmentId } = await context.params;
    log.error("Failed to delete attachment", error, { attachmentId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
