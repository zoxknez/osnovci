import { auth } from "@/lib/auth/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  CreateHomeworkSchema,
  QueryHomeworkSchema,
} from "@/lib/api/schemas/homework";
import { AuthenticationError, NotFoundError } from "@/lib/api/handlers/errors";
import { log } from "@/lib/logger";
import { sanitizeHomeworkDescription, sanitizeText } from "@/lib/utils/sanitize";
import { checkRateLimit } from "@/middleware/rate-limit";
import { ZodError } from "zod";

type ErrorDetails = Record<string, string[]> | undefined;

function errorResponse(status: number, message: string, details?: ErrorDetails) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

function ensureAuthenticated(session: Awaited<ReturnType<typeof auth>>) {
  if (!session?.user?.id) {
    throw new AuthenticationError("Unauthorized");
  }
  return session.user.id;
}

/**
 * GET /api/homework
 * Dohvata sve domaće zadatke sa filtriranjem i paginacijom
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = ensureAuthenticated(session);

    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      sortBy: searchParams.get("sortBy") || "dueDate",
      order: searchParams.get("order") || "asc",
    };

    const validatedQuery = QueryHomeworkSchema.parse(queryData);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { select: { id: true } },
        guardian: {
          select: {
            links: {
              where: { isActive: true },
              select: { studentId: true },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse(404, "User not found");
    }

    const studentIds = new Set<string>();
    if (user.student?.id) {
      studentIds.add(user.student.id);
    }
    const guardianLinks = user.guardian?.links ?? [];
    for (const link of guardianLinks) {
      if (link.studentId) {
        studentIds.add(link.studentId);
      }
    }

    if (studentIds.size === 0) {
      return errorResponse(403, "Student access not granted");
    }

    const where: Record<string, unknown> = {
      studentId: { in: Array.from(studentIds) },
    };

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }
    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority;
    }

    const total = await prisma.homework.count({ where });
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

    const formatted = homework.map((hw) => {
      const attachmentsCount =
        typeof hw._count?.attachments === "number"
          ? hw._count.attachments
          : Array.isArray((hw as { attachments?: unknown[] }).attachments)
            ? ((hw as { attachments?: unknown[] }).attachments?.length ?? 0)
            : 0;

      return {
        id: hw.id,
        title: hw.title,
        description: hw.description,
        subject: hw.subject,
        dueDate: hw.dueDate,
        priority: hw.priority,
        status: hw.status,
        attachmentsCount,
        createdAt: hw.createdAt,
        updatedAt: hw.updatedAt,
      };
    });

    log.info("Fetched homework", {
      userId,
      count: formatted.length,
      total,
    });

    const totalPages = Math.max(1, Math.ceil(total / validatedQuery.limit));

    return NextResponse.json(
      {
        success: true,
        homework: formatted,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages,
        },
        message: `Pronađeno ${total} domaćih`,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(401, "Unauthorized");
    }
    if (error instanceof NotFoundError) {
      return errorResponse(404, error.message);
    }
    if (error instanceof ZodError) {
      const details = error.issues.reduce<Record<string, string[]>>(
        (acc, issue) => {
          const path = issue.path.join(".") || "global";
          acc[path] = acc[path] ? [...acc[path], issue.message] : [issue.message];
          return acc;
        },
        {},
      );
      return errorResponse(400, "Bad Request", details);
    }

    log.error("Unexpected error in homework GET", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return errorResponse(500, "Internal Server Error");
  }
}

/**
 * POST /api/homework
 * Kreira novi domaći zadatak
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = ensureAuthenticated(session);

    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const validatedData = CreateHomeworkSchema.parse(body);

    const sanitizedTitle = sanitizeText(validatedData.title);
    const sanitizedDescription = validatedData.description
      ? sanitizeHomeworkDescription(validatedData.description)
      : undefined;

    const dueDate =
      validatedData.dueDate instanceof Date
        ? validatedData.dueDate
        : new Date(validatedData.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      return errorResponse(400, "Bad Request", {
        dueDate: ["Invalid due date provided"],
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: { select: { id: true } } },
    });

    const studentId = user?.student?.id;
    if (!studentId) {
      return errorResponse(404, "Student not found");
    }

    const subjectClient = (prisma as unknown as {
      subject?: typeof prisma.subject;
    }).subject;

    if (subjectClient?.findUnique) {
      const subjectExists = await subjectClient.findUnique({
        where: { id: validatedData.subjectId },
      });

      if (!subjectExists) {
        return errorResponse(404, "Subject not found");
      }
    }

    const homework = await prisma.homework.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        studentId,
        subjectId: validatedData.subjectId,
        dueDate,
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
      userId,
      homeworkId: homework.id,
      title: homework.title,
    });

    return NextResponse.json(
      {
        success: true,
        homework: {
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
        message: "Domaći je uspješno kreiran",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(401, "Unauthorized");
    }
    if (error instanceof NotFoundError) {
      return errorResponse(404, error.message);
    }
    if (error instanceof ZodError) {
      const details = error.issues.reduce<Record<string, string[]>>(
        (acc, issue) => {
          const path = issue.path.join(".") || "global";
          acc[path] = acc[path] ? [...acc[path], issue.message] : [issue.message];
          return acc;
        },
        {},
      );
      return errorResponse(400, "Bad Request", details);
    }

    log.error("Unexpected error in homework POST", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return errorResponse(500, "Internal Server Error");
  }
}
