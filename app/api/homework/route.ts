// Homework API - CRUD operations
import { type NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { rateLimit } from "@/middleware/rate-limit";

// Validation schema
const createHomeworkSchema = z.object({
  subjectId: z.string().cuid(),
  title: z.string().min(1, "Naslov je obavezan").max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime(),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).default("NORMAL"),
});

// GET /api/homework - Get all homework for student
const getHandler = async (request: NextRequest) => {
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

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subjectId");

    // Build where clause
    const where: Prisma.HomeworkWhereInput = {
      studentId: user.student.id,
    };

    if (status) {
      where.status = status as "ASSIGNED" | "IN_PROGRESS" | "DONE" | "SUBMITTED" | "REVIEWED" | "REVISION";
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    // Fetch homework
    const homework = await prisma.homework.findMany({
      where,
      include: {
        subject: true,
        attachments: {
          select: {
            id: true,
            type: true,
            fileName: true,
            thumbnail: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // Active first
        { dueDate: "asc" }, // Closest deadline first
      ],
    });

    return NextResponse.json({
      success: true,
      homework,
      count: homework.length,
    });
  } catch (error) {
    log.error("GET /api/homework failed", { error, userId: request.headers.get("user-id") });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Greška pri učitavanju zadataka",
      },
      { status: 500 },
    );
  }
}

// POST /api/homework - Create new homework
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

    // Validate request body
    const body = await request.json();
    const validated = createHomeworkSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Nevažeći podaci",
          details: validated.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { subjectId, title, description, dueDate, priority } = validated.data;

    // Create homework
    const homework = await prisma.homework.create({
      data: {
        studentId: user.student.id,
        subjectId,
        title,
        description,
        dueDate: new Date(dueDate),
        priority,
        status: "ASSIGNED",
      },
      include: {
        subject: true,
        attachments: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Domaći zadatak je kreiran!",
        homework,
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("POST /api/homework failed", { error });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Greška pri kreiranju zadatka",
      },
      { status: 500 },
    );
  }
}
