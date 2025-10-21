import { auth } from "@/lib/auth/config";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
} from "@/lib/api/schemas/profile";
import {
  handleAPIError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/handlers/errors";
import { successResponse, createdResponse } from "@/lib/api/handlers/response";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * GET /api/profile
 * Dohvata profil sa statistikom
 */
export async function GET(request: NextRequest) {
  try {
    // Autentifikacija (with demo mode support)
    const session = await auth();
    console.log('🔍 Session received:', JSON.stringify(session?.user, null, 2));
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID!');
      throw new AuthenticationError();
    }

    console.log('✅ Session valid, querying user with ID:', session.user.id);

    // ULTRA DEBUG: Prvo pokušaj jednostavan query bez includes
    console.log('🔎 Step 1: Trying simple findUnique...');
    const simpleUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    console.log('🔎 Simple result:', simpleUser ? `FOUND: ${simpleUser.email}` : 'NULL');

    // ULTRA DEBUG: Svi useri u bazi
    console.log('🔎 Step 2: Getting ALL users...');
    const allUsers = await prisma.user.findMany({ take: 5 });
    console.log('🔎 All users:', allUsers.map(u => ({ id: u.id, email: u.email })));

    // ULTRA DEBUG: Probaj findFirst umesto findUnique
    console.log('🔎 Step 3: Trying findFirst...');
    const firstUser = await prisma.user.findFirst({
      where: { id: session.user.id }
    });
    console.log('🔎 FindFirst result:', firstUser ? `FOUND: ${firstUser.email}` : 'NULL');

    // Dohvati korisnika
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: {
          include: {
            links: {
              where: { isActive: true },
              include: {
                student: {
                  select: { id: true, name: true, school: true, grade: true },
                },
              },
            },
          },
        },
      },
    });

    console.log('📊 Prisma result:', user ? `Found user: ${user.email}` : 'User is NULL');

    if (!user) {
      console.log('❌ User not found in database for ID:', session.user.id);
      throw new NotFoundError("Korisnik");
    }

    // Prikupi sve dostupne studente
    const students = [];
    if (user.student) {
      students.push({
        id: user.student.id,
        name: user.student.name,
        school: user.student.school,
        grade: user.student.grade,
      });
    }
    if (user.guardian?.links) {
      user.guardian.links.forEach((link) => {
        students.push(link.student);
      });
    }

    // Ako je student, dohvati njegov profil
    let studentId = students[0]?.id;
    const queryStudentId = request.nextUrl.searchParams.get("studentId");

    if (queryStudentId && students.length > 1) {
      const found = students.find((s) => s.id === queryStudentId);
      if (!found) {
        throw new NotFoundError("Učenik");
      }
      studentId = found.id;
    }

    // Dohvati kompletan student objekat sa svim poljima
    const fullStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    // Dohvati statistiku
    const homework = await prisma.homework.findMany({
      where: { studentId: studentId },
    });

    const grades = await prisma.grade.findMany({
      where: { studentId: studentId },
    });

    const schedules = await prisma.scheduleEntry.findMany({
      where: { studentId: studentId },
    });

    const completedHomework = homework.filter(
      (h) => h.status === "DONE" || h.status === "SUBMITTED",
    ).length;

    const gradeValues = grades.map((g) => parseFloat(g.grade)).filter((n) => !Number.isNaN(n));
    const averageGrade =
      gradeValues.length > 0
        ? gradeValues.reduce((a, b) => a + b) / gradeValues.length
        : 0;

    const profileData = {
      id: user.id,
      name: fullStudent?.name || user.guardian?.name || "Unknown",
      email: user.email,
      avatar: fullStudent?.avatar || user.guardian?.avatar,
      dateOfBirth: fullStudent?.birthDate,
      gender: undefined, // TODO: Add gender field to Student model
      school: fullStudent?.school,
      grade: fullStudent?.grade,
      bio: undefined, // TODO: Add bio field to Student model
      role: user.role,
      xp: 0, // TODO: Get from Gamification model
      level: 1, // TODO: Get from Gamification model
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const stats = {
      totalHomework: homework.length,
      completedHomework: completedHomework,
      averageGrade: Math.round(averageGrade * 100) / 100,
      totalClasses: schedules.length,
      attendanceRate: 95, // TODO: Implementiraj praćenje prisustva
      xpThisMonth: 0, // TODO: Get from Gamification model
      achievements: [], // TODO: Implementiraj achievement sistem
    };

    log.info("Fetched profile", {
      userId: session.user.id,
      studentId: studentId,
    });

    return successResponse({
      profile: profileData,
      stats,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PUT /api/profile
 * Ažurira profil korisnika
 */
export async function PUT(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    // Autentifikacija (with demo mode support)
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = UpdateProfileSchema.parse(body);

    // Dohvati korisnika i studenta
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true, guardian: true },
    });

    if (!user) {
      throw new NotFoundError("Korisnik");
    }

    // Ažuriraj studenta ako postoji
    if (user.student) {
      await prisma.student.update({
        where: { id: user.student.id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.avatar && { avatar: validatedData.avatar }),
          ...(validatedData.dateOfBirth && {
            birthDate: new Date(validatedData.dateOfBirth),
          }),
          ...(validatedData.school && { school: validatedData.school }),
          ...(validatedData.grade && { grade: validatedData.grade }),
        },
      });
    }

    // Ažuriraj guardian-a ako postoji
    if (user.guardian) {
      await prisma.guardian.update({
        where: { id: user.guardian.id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.avatar && { avatar: validatedData.avatar }),
        },
      });
    }

    // Refresh korisnika sa novim podacima
    const updated = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true, guardian: true },
    });

    log.info("Updated profile", {
      userId: session.user.id,
      fields: Object.keys(validatedData),
    });

    return successResponse({
      id: updated?.id,
      name: updated?.student?.name || updated?.guardian?.name,
      email: updated?.email,
      avatar: updated?.student?.avatar || updated?.guardian?.avatar,
      dateOfBirth: updated?.student?.birthDate,
      school: updated?.student?.school,
      grade: updated?.student?.grade,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/profile
 * Mijenja šifru korisnika
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    // Autentifikacija (with demo mode support)
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = ChangePasswordSchema.parse(body);

    // Dohvati korisnika
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new NotFoundError("Korisnik");
    }

    // Provjeri trenutnu šifru
    if (
      !user.password ||
      !(await bcrypt.compare(validatedData.currentPassword, user.password))
    ) {
      throw new ValidationError("Trenutna šifra nije ispravna");
    }

    // Hash novu šifru
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Ažuriraj šifru
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    log.info("Changed password", {
      userId: session.user.id,
    });

    return createdResponse({ success: true }, "Šifra je uspješno promijenjena");
  } catch (error) {
    return handleAPIError(error);
  }
}
