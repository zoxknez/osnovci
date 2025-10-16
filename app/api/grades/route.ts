import { auth } from "@/lib/auth/config";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CreateGradeSchema, QueryGradesSchema } from "@/lib/api/schemas/grades";
import {
  handleAPIError,
  AuthenticationError,
  NotFoundError,
} from "@/lib/api/handlers/errors";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
} from "@/lib/api/handlers/response";
import { log } from "@/lib/logger";

/**
 * GET /api/grades
 * Dohvata sve ocene sa statistikom i filtriranjem
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
      subjectId: searchParams.get("subjectId") || undefined,
      category: searchParams.get("category") || undefined,
      period: searchParams.get("period") || undefined,
      sortBy: searchParams.get("sortBy") || "date",
      order: searchParams.get("order") || "desc",
    };

    // Validacija query parametara
    const validatedQuery = QueryGradesSchema.parse(queryData);

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
    const where: any = {
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

    // Kalkuliši statistiku
    const allGrades = await prisma.grade.findMany({
      where,
      include: { subject: { select: { name: true } } },
    });

    const gradeValues = allGrades.map((g) => parseInt(g.grade));
    const average =
      gradeValues.length > 0
        ? gradeValues.reduce((a, b) => a + b) / gradeValues.length
        : 0;

    const byCategory: Record<string, number> = {};
    allGrades.forEach((g) => {
      byCategory[g.category] = (byCategory[g.category] || 0) + 1;
    });

    const bySubject = Object.entries(
      allGrades.reduce(
        (acc, g) => {
          if (!acc[g.subject.name]) {
            acc[g.subject.name] = [];
          }
          acc[g.subject.name].push(parseInt(g.grade));
          return acc;
        },
        {} as Record<string, number[]>,
      ),
    ).map(([name, values]) => ({
      subject: name,
      average: values.reduce((a, b) => a + b) / values.length,
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
    // Autentifikacija
    const session = await auth();
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
