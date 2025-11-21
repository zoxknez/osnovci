"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { UpdateProfileSchema, ChangePasswordSchema } from "@/lib/api/schemas/profile";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

export type ActionState<T = any> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function getProfileAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true, guardian: true },
    });

    if (!user) {
      return { error: "Korisnik nije pronađen" };
    }

    // Logic from API route to get student/guardian data
    let profileData: any = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (user.student) {
      profileData = { ...profileData, ...user.student };
    } else if (user.guardian) {
      profileData = { ...profileData, ...user.guardian };
    }

    // Get gamification if student
    let stats: any = {
      totalHomework: 0,
      completedHomework: 0,
      averageGrade: 0,
      totalClasses: 0,
      attendanceRate: 0,
      xpThisMonth: 0,
      achievements: [],
    };

    if (user.student) {
      const studentId = user.student.id;
      
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

      const gamification = await prisma.gamification.findUnique({
        where: { studentId },
        include: {
          achievements: {
            orderBy: { unlockedAt: "desc" },
            take: 10,
          },
        },
      });

      stats = {
        totalHomework: homework.length,
        completedHomework: completedHomework,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalClasses: schedule.length,
        attendanceRate: 95,
        xpThisMonth: gamification?.totalXPEarned || 0,
        achievements: gamification?.achievements.map(a => a.title) || [],
      };

      profileData.xp = gamification?.xp || 0;
      profileData.level = gamification?.level || 1;
    }

    return { success: true, data: { profile: profileData, stats } };
  } catch (error) {
    console.error("Get profile error:", error);
    return { error: "Greška prilikom učitavanja profila" };
  }
}

export async function updateProfileAction(data: z.infer<typeof UpdateProfileSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = UpdateProfileSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true, guardian: true },
    });

    if (!user) {
      return { error: "Korisnik nije pronađen" };
    }

    if (user.student) {
      await prisma.student.update({
        where: { id: user.student.id },
        data: {
          ...(validated.data.name && { name: validated.data.name }),
          ...(validated.data.avatar && { avatar: validated.data.avatar }),
          ...(validated.data.dateOfBirth && { birthDate: new Date(validated.data.dateOfBirth) }),
          ...(validated.data.school && { school: validated.data.school }),
          ...(validated.data.grade && { grade: validated.data.grade }),
        },
      });
    } else if (user.guardian) {
      await prisma.guardian.update({
        where: { id: user.guardian.id },
        data: {
          ...(validated.data.name && { name: validated.data.name }),
          ...(validated.data.avatar && { avatar: validated.data.avatar }),
        },
      });
    }

    revalidatePath("/dashboard/podesavanja");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Greška prilikom ažuriranja profila" };
  }
}

export async function changePasswordAction(data: z.infer<typeof ChangePasswordSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = ChangePasswordSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user || !user.password) {
      return { error: "Korisnik nije pronađen" };
    }

    const isValid = await bcrypt.compare(validated.data.currentPassword, user.password);
    if (!isValid) {
      return { error: "Trenutna lozinka nije ispravna" };
    }

    const hashedPassword = await bcrypt.hash(validated.data.newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Greška prilikom promene lozinke" };
  }
}

export async function exportDataAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const userId = session.user.id;

  try {
    // Base user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "Korisnik nije pronađen" };
    }

    // Student data with ALL related info
    let studentData = null;
    const student = await prisma.student.findFirst({
      where: { userId },
    });

    if (student) {
      const [homework, grades, subjects, links, gamification, activityLogs] =
        await Promise.all([
          prisma.homework.findMany({
            where: { studentId: student.id },
          }),
          prisma.grade.findMany({
            where: { studentId: student.id },
          }),
          prisma.subject.findMany({
            where: {
              students: {
                some: { studentId: student.id },
              },
            },
          }),
          prisma.link.findMany({
            where: { studentId: student.id },
          }),
          prisma.gamification.findUnique({
            where: { studentId: student.id },
          }),
          prisma.activityLog.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: "desc" },
          }),
        ]);

      // Get attachments for homework
      const attachments = await prisma.attachment.findMany({
        where: {
          homeworkId: {
            in: homework.map((hw) => hw.id),
          },
        },
      });

      // Get schedule entries
      const scheduleEntries = await prisma.scheduleEntry.findMany({
        where: { studentId: student.id },
      });

      studentData = {
        profile: student,
        homework: homework,
        attachments: attachments,
        grades: grades,
        subjects: subjects,
        guardianLinks: links,
        schedule: scheduleEntries,
        gamification: gamification,
        activityLogs: activityLogs,
      };
    }

    // Guardian data with ALL related info
    let guardianData = null;
    const guardian = await prisma.guardian.findFirst({
      where: { userId },
    });

    if (guardian) {
      const links = await prisma.link.findMany({
        where: { guardianId: guardian.id },
      });

      guardianData = {
        profile: guardian,
        studentLinks: links,
      };
    }

    // Security data
    const [sessions, biometricCredentials] = await Promise.all([
      prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.biometricCredential.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // COMPLETE export package
    const exportData = {
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportVersion: "1.0.0",
        userId: user.id,
        gdprCompliance: "Article 20 - Right to Data Portability",
      },

      account: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        locale: user.locale,
        theme: user.theme,
        emailVerified: user.emailVerified,
        biometricEnabled: user.biometric,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },

      studentData: studentData,
      guardianData: guardianData,

      security: {
        sessions: sessions,
        biometricCredentials: biometricCredentials,
      },

      gdprInformation: {
        rightToErasure: "Contact podrska@osnovci.rs to request account deletion",
        rightToRectification: "Update data in app settings or contact support",
        rightToRestriction: "Contact podrska@osnovci.rs",
        dataController: "Osnovci Application",
        contactEmail: "podrska@osnovci.rs",
      },
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error("Export data error:", error);
    return { error: "Greška prilikom izvoza podataka" };
  }
}
