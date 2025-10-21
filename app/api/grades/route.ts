import { auth } from "@/lib/auth/config";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CreateGradeSchema, QueryGradesSchema } from "@/lib/api/schemas/grades";
import {
  handleAPIError,
  AuthenticationError,
  NotFoundError,
} from "@/lib/api/handlers/errors";
import {
  successResponse,
  createdResponse,
} from "@/lib/api/handlers/response";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import { getAuthSession } from "@/lib/auth/demo-mode";

/**
 * GET /api/grades
 * Dohvata sve ocene sa statistikom i filtriranjem
 */
export async function GET(request: NextRequest) {
  try {
    // Autentifikacija (with demo mode support)
    const session = await getAuthSession(auth);
    if (!session?.user?.id) {
      throw new AuthenticationError();
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

    if (validatedQuery.subjectId) {
      where.subjectId = validatedQuery.subjectId;
    }
    if (validatedQuery.category) {
      where.category = validatedQuery.category;
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
    const average = gradeValues.length > 0 
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
      if (!Number.isNaN(numValue)) {
        subjectGrades[grade.subjectId].push(numValue);
      }
    });

    // Get subject names
    const subjectIds = Object.keys(subjectGrades);
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });

    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

    const bySubject = Object.entries(subjectGrades).map(([subjectId, values]) => ({
      subject: subjectMap.get(subjectId) || 'Unknown',
      average: values.length > 0 
        ? values.reduce((a, b) => a + b, 0) / values.length 
        : 0,
      count: values.length,
    }));

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
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    // Autentifikacija (with demo mode support)
    const session = await getAuthSession(auth);
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = CreateGradeSchema.parse(body);

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

    // Kreiraj ocjenu
    const grade = await prisma.grade.create({
      data: {
        studentId: student.id,
        subjectId: validatedData.subjectId,
        grade: validatedData.grade,
        category: validatedData.category,
        description: validatedData.description,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        weight: validatedData.weight,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    log.info("Created grade", {
      userId: session.user.id,
      gradeId: grade.id,
      subject: grade.subject.name,
      grade: grade.grade,
    });

    return createdResponse(
      {
        id: grade.id,
        subject: grade.subject,
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
