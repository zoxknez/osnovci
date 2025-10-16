import { auth } from "@/lib/auth/config";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type {
  CreateScheduleInput,
  QueryScheduleInput,
} from "@/lib/api/schemas/schedule";
import {
  CreateScheduleSchema,
  QueryScheduleSchema,
  DayOfWeek,
} from "@/lib/api/schemas/schedule";
import {
  handleAPIError,
  AuthenticationError,
  NotFoundError,
} from "@/lib/api/handlers/errors";
import {
  paginatedResponse,
  createdResponse,
} from "@/lib/api/handlers/response";
import { log } from "@/lib/logger";

/**
 * GET /api/schedule
 * Dohvata sve rasporede sa filtriranjem i paginacijom
 */
export async function GET(request: NextRequest) {
  try {
    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
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

    // Dohvati korisnika i njegovu djecu
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { students: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundError("Korisnik");
    }

    const studentIds = user.students.map((s) => s.id);
    if (studentIds.length === 0) {
      // Ako je sam student, koristi njegov ID
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
      });
      if (student) {
        studentIds.push(student.id);
      }
    }

    // Build filter
    const where: Record<string, unknown> = {
      studentId: { in: studentIds },
    };

    if (validatedQuery.dayOfWeek) {
      where.dayOfWeek = validatedQuery.dayOfWeek;
    }
    if (validatedQuery.status) {
      where.status = validatedQuery.status;
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
      classroom: schedule.classroom,
      teacher: schedule.teacher,
      notes: schedule.notes,
      status: schedule.status,
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
    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = CreateScheduleSchema.parse(body);

    // Provjeri da li subjekt postoji
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      throw new NotFoundError("Predmet");
    }

    // Dohvati studentov ID
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      throw new NotFoundError("Učenik");
    }

    // Kreiraj raspored
    const schedule = await prisma.scheduleEntry.create({
      data: {
        studentId: student.id,
        subjectId: validatedData.subjectId,
        dayOfWeek: validatedData.dayOfWeek as DayOfWeek,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        classroom: validatedData.classroom,
        teacher: validatedData.teacher,
        notes: validatedData.notes,
        status: validatedData.status,
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
      subject: schedule.subject.name,
    });

    return createdResponse(
      {
        id: schedule.id,
        subject: schedule.subject,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.classroom,
        teacher: schedule.teacher,
        notes: schedule.notes,
        status: schedule.status,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      },
      "Raspored je uspješno kreiran",
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
