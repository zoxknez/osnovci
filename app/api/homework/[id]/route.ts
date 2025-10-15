// Individual Homework API - GET, PATCH, DELETE
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

const updateHomeworkSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).optional(),
  status: z
    .enum([
      "ASSIGNED",
      "IN_PROGRESS",
      "DONE",
      "SUBMITTED",
      "REVIEWED",
      "REVISION",
    ])
    .optional(),
  notes: z.string().max(500).optional(),
  reviewNote: z.string().max(500).optional(),
});

// GET /api/homework/[id] - Get single homework
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: true,
        student: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
        attachments: true,
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // Check ownership
    if (homework.student.user.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, homework });
  } catch (error) {
    log.error("GET /api/homework/[id] failed", { error, homeworkId: (await params).id });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH /api/homework/[id] - Update homework
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.homework.findUnique({
      where: { id },
      include: {
        student: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (existing.student.user.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate body
    const body = await request.json();
    const validated = updateHomeworkSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    // Update homework
    const updated = await prisma.homework.update({
      where: { id },
      data: {
        ...validated.data,
        dueDate: validated.data.dueDate
          ? new Date(validated.data.dueDate)
          : undefined,
        reviewedAt:
          validated.data.status === "REVIEWED" ? new Date() : undefined,
      },
      include: {
        subject: true,
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Zadatak je ažuriran!",
      homework: updated,
    });
  } catch (error) {
    log.error("PATCH /api/homework/[id] failed", { error, homeworkId: (await params).id });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE /api/homework/[id] - Delete homework
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.homework.findUnique({
      where: { id },
      include: {
        student: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (existing.student.user.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete homework (cascades to attachments)
    await prisma.homework.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Zadatak je obrisan!",
    });
  } catch (error) {
    log.error("DELETE /api/homework/[id] failed", { error, homeworkId: (await params).id });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
