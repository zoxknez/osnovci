import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import {
  AuthenticationError,
  handleAPIError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/handlers/errors";
import { createdResponse, successResponse } from "@/lib/api/handlers/response";
import {
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@/lib/api/schemas/profile";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * GET /api/profile
 * Dohvata profil sa statistikom
 */
export async function GET(request: NextRequest) {
  try {
    // Autentifikacija
    const session = await auth();

    if (!session?.user?.id) {
      log.warn("Profile access without session", {
        ip: request.headers.get("x-forwarded-for"),
      });
      throw new AuthenticationError();
    }

    // Dohvati korisnika sa svim relacionim podacima
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

    if (!user) {
      log.error("User not found in database", {
        userId: session.user.id,
      });
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

    if (!studentId) {
      throw new NotFoundError("Učenik");
    }

    // Dohvati kompletan student objekat sa svim poljima
    const fullStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    // Dohvati statistiku
    const homework = await prisma.homework.findMany({
      where: { studentId },
    });

    const grades = await prisma.grade.findMany({
      where: { studentId },
    });

    const schedule = await prisma.scheduleEntry.findMany({
      where: { studentId },
    });

    const completedHomework = homework.filter(
      (h) => h.status === "DONE" || h.status === "SUBMITTED",
    ).length;

    const gradeValues = grades
      .map((g) => parseFloat(g.grade))
      .filter((n) => !Number.isNaN(n));
    const averageGrade =
      gradeValues.length > 0
        ? gradeValues.reduce((a, b) => a + b) / gradeValues.length
        : 0;

    // Get gamification data
    const gamification = fullStudent
      ? await prisma.gamification.findUnique({
          where: { studentId: fullStudent.id },
          include: {
            achievements: {
              orderBy: { unlockedAt: "desc" },
              take: 10, // Get latest 10 achievements
            },
          },
        })
      : null;

    const profileData = {
      id: user.id,
      name: fullStudent?.name || user.guardian?.name || "Unknown",
      email: user.email,
      avatar: fullStudent?.avatar || user.guardian?.avatar,
      dateOfBirth: fullStudent?.birthDate,
      gender: fullStudent?.gender || undefined,
      school: fullStudent?.school,
      grade: fullStudent?.grade,
      bio: fullStudent?.bio || undefined,
      role: user.role,
      xp: gamification?.xp || 0,
      level: gamification?.level || 1,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const stats = {
      totalHomework: homework.length,
      completedHomework: completedHomework,
      averageGrade: Math.round(averageGrade * 100) / 100,
      totalClasses: schedule.length,
      attendanceRate: 95, // Placeholder - Attendance tracking to be implemented
      xpThisMonth: gamification?.totalXPEarned || 0,
      achievements: gamification?.achievements || [],
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
