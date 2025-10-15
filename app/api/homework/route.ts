// Homework API - CRUD operations
import { type NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { rateLimit } from "@/middleware/rate-limit";
import { withAuthAndRateLimit, getAuthenticatedStudent, sanitizeBody, internalError, badRequest, success } from "@/lib/api/middleware";
import { notifyHomeworkDue } from "@/lib/notifications/create";
import { ActivityLogger } from "@/lib/tracking/activity-logger";

// Validation schema
const createHomeworkSchema = z.object({
  subjectId: z.string().cuid(),
  title: z.string().min(1, "Naslov je obavezan").max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime(),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).default("NORMAL"),
});

// GET /api/homework - Get all homework for student
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const GET = withAuthAndRateLimit(async (request: NextRequest, session: any, _context: any) => {
  try {
    // Get student (helper eliminates duplicate query!)
    const student = await getAuthenticatedStudent(session.user.id);

    // Get query params for filtering and pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subjectId");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.HomeworkWhereInput = {
      studentId: student.id,
    };

    if (status) {
      where.status = status as "ASSIGNED" | "IN_PROGRESS" | "DONE" | "SUBMITTED" | "REVIEWED" | "REVISION";
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    // Fetch homework with pagination
    const [homework, total] = await Promise.all([
      prisma.homework.findMany({
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
        skip,
        take: limit,
      }),
      prisma.homework.count({ where }),
    ]);

    return success({
      homework,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    return internalError(error, "Greška pri učitavanju zadataka");
  }
});

// POST /api/homework - Create new homework
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const POST = withAuthAndRateLimit(async (request: NextRequest, session: any, _context: any) => {
  try {
    // Get student
    const student = await getAuthenticatedStudent(session.user.id);

    // Validate and sanitize request body
    const body = await request.json();
    const sanitized = sanitizeBody(body, ["title", "description"]);
    const validated = createHomeworkSchema.safeParse(sanitized);

    if (!validated.success) {
      return badRequest("Nevažeći podaci", validated.error.flatten());
    }

    const { subjectId, title, description, dueDate, priority } = validated.data;

    // Create homework
    const homework = await prisma.homework.create({
      data: {
        studentId: student.id,
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

    log.info("Homework created", { homeworkId: homework.id, studentId: student.id });

    // Log activity for parents
    await ActivityLogger.homeworkCreated(student.id, title, request);

    // Create notification if due soon
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) {
      await notifyHomeworkDue(user.id, homework.id, title, new Date(dueDate)).catch((err) => {
        log.warn("Failed to create homework notification", { error: err });
      });
    }

    return success({ message: "Domaći zadatak je kreiran!", homework }, 201);
  } catch (error) {
    return internalError(error, "Greška pri kreiranju zadatka");
  }
});
