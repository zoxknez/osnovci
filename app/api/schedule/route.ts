// Schedule API - Weekly schedule management
import { type NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

const createScheduleSchema = z.object({
  subjectId: z.string().cuid(),
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format: HH:MM"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format: HH:MM"),
  room: z.string().max(50).optional(),
  notes: z.string().max(200).optional(),
  isAWeek: z.boolean().default(true),
  isBWeek: z.boolean().default(true),
});

// GET /api/schedule - Get student schedule
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get("dayOfWeek");

    const where: Prisma.ScheduleEntryWhereInput = {
      studentId: user.student.id,
    };

    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    }

    const schedule = await prisma.scheduleEntry.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      success: true,
      schedule,
      count: schedule.length,
    });
  } catch (error) {
    log.error("GET /api/schedule failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/schedule - Create schedule entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createScheduleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        studentId: user.student.id,
        ...validated.data,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Čas je dodat u raspored!",
        entry,
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("POST /api/schedule failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
