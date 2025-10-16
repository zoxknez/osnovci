import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import type { QueryHomeworkInput } from "@/lib/api/schemas/homework";
import {
  CreateHomeworkSchema,
  QueryHomeworkSchema,
} from "@/lib/api/schemas/homework";
import { checkRateLimit } from "@/middleware/rate-limit";
import { log } from "@/lib/logger";
import { z } from "zod";

type ErrorResponse = {
  success: false;
  error: string;
  details?: Record<string, string[]>;
};

function badRequestResponse(
  message: string,
  details?: Record<string, string[]>,
) {
  const body: ErrorResponse = {
    success: false,
    error: message,
    ...(details ? { details } : {}),
  };

  return NextResponse.json(body, { status: 400 });
}

function unauthorizedResponse() {
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: "Unauthorized",
    },
    { status: 401 },
  );
}

function sanitizeInput(value: string | undefined) {
  if (!value) {
    return value;
  }

  return value
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/<style.*?>.*?<\/style>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

const RouteCreateHomeworkSchema = CreateHomeworkSchema.extend({
  subjectId: z.string().min(1),
});

type RouteCreateHomeworkInput = z.infer<typeof RouteCreateHomeworkSchema>;

/**
 * GET /api/homework
 * Dohvata sve domaće zadatke sa filtriranjem i paginacijom
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "10",
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? "dueDate",
      order: searchParams.get("order") ?? "asc",
    } satisfies Partial<QueryHomeworkInput>;

    const parsedQuery = QueryHomeworkSchema.safeParse(queryData);
    if (!parsedQuery.success) {
      const details = parsedQuery.error.flatten().fieldErrors;
      return badRequestResponse("Bad Request", details);
    }

    const validatedQuery = parsedQuery.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: { select: { id: true } } },
    });

    const studentId = user?.student?.id;
    if (!studentId) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: "Student Not Found",
        },
        { status: 404 },
      );
    }

    const where: Record<string, unknown> = {
      studentId,
    };

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority;
    }

    const [homework, total] = await Promise.all([
      prisma.homework.findMany({
        where,
        include: {
          subject: true,
        },
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.order,
        },
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit,
      }),
      prisma.homework.count({ where }),
    ]);

    const formatted = homework.map((hw: any) => ({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      subject: hw.subject,
      dueDate: hw.dueDate,
      priority: hw.priority,
      status: hw.status,
      attachmentsCount:
        typeof hw.attachmentsCount === "number"
          ? hw.attachmentsCount
          : Array.isArray(hw.attachments)
            ? hw.attachments.length
            : hw._count?.attachments ?? 0,
      createdAt: hw.createdAt,
      updatedAt: hw.updatedAt,
    }));

    log.info("Fetched homework", {
      userId: session.user.id,
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
      },
      { status: 200 },
    );
  } catch (error) {
    log.error("GET /api/homework failed", {
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/homework
 * Kreira novi domaći zadatak
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      return badRequestResponse("Bad Request");
    }

    const parsedBody = RouteCreateHomeworkSchema.safeParse(payload);
    if (!parsedBody.success) {
      const details = parsedBody.error.flatten().fieldErrors;
      return badRequestResponse("Bad Request", details);
    }

    const data: RouteCreateHomeworkInput = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: { select: { id: true } } },
    });

    const studentId = user?.student?.id;
    if (!studentId) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: "Student Not Found",
        },
        { status: 404 },
      );
    }

    const sanitizedTitle = sanitizeInput(data.title) ?? "";
    const sanitizedDescription = sanitizeInput(data.description);

    const homework = await prisma.homework.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        studentId,
        subjectId: data.subjectId,
        dueDate: new Date(data.dueDate),
        priority: data.priority,
        status: data.status,
      },
      include: {
        subject: true,
      },
    });

    log.info("Created homework", {
      userId: session.user.id,
      homeworkId: homework.id,
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
          attachmentsCount:
            typeof (homework as any).attachmentsCount === "number"
              ? (homework as any).attachmentsCount
              : Array.isArray((homework as any).attachments)
                ? (homework as any).attachments.length
                : 0,
          createdAt: homework.createdAt,
          updatedAt: homework.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("POST /api/homework failed", {
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
