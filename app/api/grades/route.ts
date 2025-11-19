import type { NextRequest } from "next/server";
import {
  AuthenticationError,
  handleAPIError,
  NotFoundError,
} from "@/lib/api/handlers/errors";
import { createdResponse, successResponse } from "@/lib/api/handlers/response";
import {
  CreateGradeSchema,
  QueryGradesSchema,
} from "@/lib/api/schemas/grades";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { moderateContent } from "@/lib/safety/moderation-service";
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * GET /api/grades
 * Dohvata sve ocene sa statistikom i filtriranjem
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
      subjectId: searchParams.get("subjectId") || undefined,
      category: searchParams.get("category") || undefined,
      period: searchParams.get("period") || undefined,
      sortBy: searchParams.get("sortBy") || "date",
      order: searchParams.get("order") || "desc",
    };

    // Validacija query parametara
    const validatedQuery = QueryGradesSchema.parse(queryData);

    // Use student ID from session
    const studentIds: string[] = [session.user.student.id];

    // If guardian, add linked students
    if (session.user.guardian) {
      const guardian = await prisma.guardian.findUnique({
        where: { id: session.user.guardian.id },
        include: {
          links: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      });
      if (guardian?.links) {
        guardian.links.forEach((link) => {
          studentIds.push(link.studentId);
        });
      }
    }

    // Build filter
    const where: Record<string, unknown> = {
      studentId: { in: studentIds },
    };

    if (validatedQuery.subjectId) {
      where["subjectId"] = validatedQuery.subjectId;
    }
    if (validatedQuery.category) {
      where["category"] = validatedQuery.category;
    }

    // Dohvati total broj
    const total = await prisma.grade.count({ where });

    // Dohvati ocene sa paginacijom
    const grades = await prisma.grade.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.order,
      },
      skip: (validatedQuery.page - 1) * validatedQuery.limit,
      take: validatedQuery.limit,
    });

    // Kalkuliši statistiku (grade je String pa moramo da konvertujemo)
    // Dohvati sve ocene za statistiku
    const allGradesForStats = await prisma.grade.findMany({
      where,
      select: {
        grade: true,
        category: true,
        subjectId: true,
      },
    });

    // 1. Average - konvertuj string u broj
    const gradeValues = allGradesForStats
      .map((g) => parseFloat(g.grade))
      .filter((n) => !Number.isNaN(n));
    const average =
      gradeValues.length > 0
        ? gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length
        : 0;

    // 2. Count by category
    const byCategory: Record<string, number> = {};
    allGradesForStats.forEach((grade) => {
      byCategory[grade.category] = (byCategory[grade.category] || 0) + 1;
    });

    // 3. Average by subject
    const subjectGrades: Record<string, number[]> = {};
    allGradesForStats.forEach((grade) => {
      if (!subjectGrades[grade.subjectId]) {
        subjectGrades[grade.subjectId] = [];
      }
      const numValue = parseFloat(grade.grade);
      const subjectArray = subjectGrades[grade.subjectId];
      if (!Number.isNaN(numValue) && subjectArray) {
        subjectArray.push(numValue);
      }
    });

    // Get subject names
    const subjectIds = Object.keys(subjectGrades);
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });

    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

    const bySubject = Object.entries(subjectGrades).map(
      ([subjectId, values]) => ({
        subject: subjectMap.get(subjectId) || "Unknown",
        average:
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0,
        count: values.length,
      }),
    );

    // Format response
    const formatted = grades.map((grade) => ({
      id: grade.id,
      subject: grade.subject,
      grade: grade.grade,
      category: grade.category,
      description: grade.description,
      date: grade.date,
      weight: grade.weight,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
    }));

    log.info("Fetched grades", {
      userId: session.user.id,
      count: formatted.length,
      total,
      average: average.toFixed(2),
    });

    return successResponse(
      {
        data: formatted,
        stats: {
          average: Math.round(average * 100) / 100,
          total: total,
          byCategory,
          bySubject,
        },
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          pages: Math.ceil(total / validatedQuery.limit),
        },
      },
      `Pronađeno ${total} ocjena`,
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/grades
 * Kreira novu ocjenu (samo nastavnici/administratori)
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
    const validatedData = CreateGradeSchema.parse(body);

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

    const student = session.user.student;

    // 🛡️ MODERATE DESCRIPTION (if present)
    let moderatedDescription = validatedData.description;

    if (validatedData.description) {
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
      const userAgent = request.headers.get("user-agent");

      const moderationResult = await moderateContent({
        text: validatedData.description,
        contentType: "GRADE_NOTE",
        contentId: "pending",
        userId: session.user.id,
        studentId: student.id,
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
      });

      if (moderationResult.action === "block") {
        return new Response(
          JSON.stringify({
            error: "Inappropriate Content",
            message: moderationResult.blockReason || "Sadržaj sadrži neprikladne reči.",
            warnings: moderationResult.warnings,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      moderatedDescription = moderationResult.moderated;
    }

    // Kreiraj ocjenu
    const grade = await prisma.grade.create({
      data: {
        studentId: student.id,
        subjectId: validatedData.subjectId,
        grade: validatedData.grade,
        category: validatedData.category,
        ...(moderatedDescription && { description: moderatedDescription }),
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        weight: validatedData.weight,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Trigger achievement check for new grade
    const { triggerAchievementCheck } = await import(
      "@/lib/gamification/achievement-triggers"
    );
    triggerAchievementCheck(student.id, "GRADE_RECEIVED").catch((err) =>
      log.error("Achievement check failed", err)
    );

    log.info("Created grade", {
      userId: session.user.id,
      gradeId: grade.id,
      subject: grade.subject?.name,
      grade: grade.grade,
    });

    return createdResponse(
      {
        id: grade.id,
        subject: grade.subject!,
        grade: grade.grade,
        category: grade.category,
        description: grade.description,
        date: grade.date,
        weight: grade.weight,
        createdAt: grade.createdAt,
        updatedAt: grade.updatedAt,
      },
      "Ocjena je uspješno kreirana",
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
