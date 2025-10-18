import { auth } from "@/lib/auth/config";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  CreateHomeworkSchema,
  QueryHomeworkSchema,
} from "@/lib/api/schemas/homework";
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
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * GET /api/homework
 * Dohvata sve domaće zadatke sa filtriranjem i paginacijom
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
      limit: searchParams.get("limit") || "10",
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      sortBy: searchParams.get("sortBy") || "dueDate",
      order: searchParams.get("order") || "asc",
    };

    // Validacija query parametara
    const validatedQuery = QueryHomeworkSchema.parse(queryData);

    // Dohvati korisnika
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: {
          include: {
            links: {
              where: { isActive: true },
              include: { student: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("Korisnik");
    }

    // Prikupi student IDs
    const studentIds: string[] = [];
    if (user.student) {
      studentIds.push(user.student.id);
    }
    if (user.guardian?.links) {
      user.guardian.links.forEach((link) => {
        studentIds.push(link.student.id);
      });
    }

    if (studentIds.length === 0) {
      throw new NotFoundError("Nema dostupnih učenika");
    }

    // Build filter
    const where: Record<string, unknown> = {
      studentId: { in: studentIds },
    };

    if (validatedQuery.status) {
      // Ako je array, koristi 'in' operator
      where.status = Array.isArray(validatedQuery.status)
        ? { in: validatedQuery.status }
        : validatedQuery.status;
    }
    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority;
    }

    // Dohvati total broj
    const total = await prisma.homework.count({ where });

    // Dohvati domaće sa paginacijom
    const homework = await prisma.homework.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { attachments: true },
        },
      },
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.order,
      },
      skip: (validatedQuery.page - 1) * validatedQuery.limit,
      take: validatedQuery.limit,
    });

    // Format response
    const formatted = homework.map((hw) => ({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      subject: hw.subject,
      dueDate: hw.dueDate,
      priority: hw.priority,
      status: hw.status,
      attachmentsCount: hw._count.attachments,
      createdAt: hw.createdAt,
      updatedAt: hw.updatedAt,
    }));

    log.info("Fetched homework", {
      userId: session.user.id,
      count: formatted.length,
      total,
    });

    return paginatedResponse(
      formatted,
      validatedQuery.page,
      validatedQuery.limit,
      total,
      `Pronađeno ${total} domaćih`,
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/homework
 * Kreira novi domaći zadatak
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = CreateHomeworkSchema.parse(body);

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

    // Kreiraj domaći
    const homework = await prisma.homework.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        studentId: student.id,
        subjectId: validatedData.subjectId,
        dueDate: new Date(validatedData.dueDate),
        priority: validatedData.priority,
        status: validatedData.status,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    log.info("Created homework", {
      userId: session.user.id,
      homeworkId: homework.id,
      title: homework.title,
    });

    return createdResponse(
      {
        id: homework.id,
        title: homework.title,
        description: homework.description,
        subject: homework.subject,
        dueDate: homework.dueDate,
        priority: homework.priority,
        status: homework.status,
        attachmentsCount: 0,
        createdAt: homework.createdAt,
        updatedAt: homework.updatedAt,
      },
      "Domaći je uspješno kreiran",
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
