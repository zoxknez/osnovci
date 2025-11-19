import type { NextRequest } from "next/server";
import {
  AuthenticationError,
  handleAPIError,
  NotFoundError,
} from "@/lib/api/handlers/errors";
import {
  createdResponse,
  paginatedResponse,
} from "@/lib/api/handlers/response";
import {
  CreateScheduleSchema,
  type DayOfWeek,
  QueryScheduleSchema,
} from "@/lib/api/schemas/schedule";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * GET /api/schedule
 * Dohvata sve rasporede sa filtriranjem i paginacijom
 */
export async function GET(request: NextRequest) {
  try {
    // Autentifikacija (with demo mode support)
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Get student ID from session
    if (!session.user.student?.id) {
      throw new NotFoundError("Učenik");
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      dayOfWeek: searchParams.get("dayOfWeek") || undefined,
      status: searchParams.get("status") || undefined,
      sortBy: searchParams.get("sortBy") || "dayOfWeek",
      order: searchParams.get("order") || "asc",
    };

    // Validacija query parametara
    const validatedQuery = QueryScheduleSchema.parse(queryData);

    // Use student ID from session
    const studentIds: string[] = [session.user.student.id];

    // Build filter
    const where: Record<string, unknown> = {
      studentId: { in: studentIds },
    };

    if (validatedQuery.dayOfWeek) {
      where["dayOfWeek"] = validatedQuery.dayOfWeek;
    }
    if (validatedQuery.status) {
      where["status"] = validatedQuery.status;
    }

    // Dohvati total broj
    const total = await prisma.scheduleEntry.count({ where });

    // Dohvati rasporede sa paginacijom
    const schedules = await prisma.scheduleEntry.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.order,
      },
      skip: (validatedQuery.page - 1) * validatedQuery.limit,
      take: validatedQuery.limit,
    });

    // Format response
    const formatted = schedules.map((schedule) => ({
      id: schedule.id,
      subject: schedule.subject,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classroom: schedule.room,
      notes: schedule.notes,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    }));

    log.info("Fetched schedules", {
      userId: session.user.id,
      count: formatted.length,
      total,
    });

    return paginatedResponse(
      formatted,
      validatedQuery.page,
      validatedQuery.limit,
      total,
      `Pronađeno ${total} raspored`,
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/schedule
 * Kreira novi raspored
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(
        new Error(csrfResult.error || "CSRF validation failed"),
      );
    }

    // Autentifikacija (with demo mode support)
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = CreateScheduleSchema.parse(body);

    // Get student ID from session
    if (!session.user.student?.id) {
      throw new NotFoundError("Učenik");
    }

    // Provjeri da li subjekt postoji
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      throw new NotFoundError("Predmet");
    }

    // Kreiraj raspored
    const schedule = await prisma.scheduleEntry.create({
      data: {
        studentId: session.user.student.id,
        subjectId: validatedData.subjectId,
        dayOfWeek: validatedData.dayOfWeek as DayOfWeek,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        room: validatedData.classroom,
        ...(validatedData.notes && { notes: validatedData.notes }),
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    });

    log.info("Created schedule entry", {
      userId: session.user.id,
      scheduleId: schedule.id,
      subject: schedule.subject?.name,
    });

    return createdResponse(
      {
        id: schedule.id,
        subject: schedule.subject!,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.room,
        notes: schedule.notes,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      },
      "Raspored je uspješno kreiran",
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
