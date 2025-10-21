// Events API - Exams, meetings, trips, competitions (Security Enhanced!)
import { type NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getAuthSession } from "@/lib/auth/demo-mode";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import { handleAPIError, AuthenticationError } from "@/lib/api/handlers/errors";

const createEventSchema = z.object({
  type: z.enum(["EXAM", "MEETING", "TRIP", "COMPETITION", "OTHER"]),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dateTime: z.string().datetime(),
  location: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  notifyAt: z.string().datetime().optional(),
});

// GET /api/events - Get all events
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(auth);

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
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Prisma.EventWhereInput = {
      studentId: user.student.id,
    };

    if (type) {
      where.type = type as
        | "EXAM"
        | "MEETING"
        | "TRIP"
        | "COMPETITION"
        | "OTHER";
    }

    if (from || to) {
      where.dateTime = {};
      if (from) {
        where.dateTime.gte = new Date(from);
      }
      if (to) {
        where.dateTime.lte = new Date(to);
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        dateTime: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    log.error("GET /api/events failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    const session = await getAuthSession(auth);

    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createEventSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const event = await prisma.event.create({
      data: {
        studentId: user.student.id,
        type: validated.data.type,
        title: validated.data.title,
        description: validated.data.description,
        dateTime: new Date(validated.data.dateTime),
        location: validated.data.location,
        notes: validated.data.notes,
        notifyAt: validated.data.notifyAt
          ? new Date(validated.data.notifyAt)
          : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Događaj je kreiran!",
        event,
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("POST /api/events failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
