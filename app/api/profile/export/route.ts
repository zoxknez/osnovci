// GDPR Data Export API - KOMPLETNO sve podatke!
// Article 20: Right to Data Portability

import { AuthenticationError, handleAPIError } from "@/lib/api/handlers/errors";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

/**
 * GET /api/profile/export
 * Exports COMPLETE user data (NO SHORTCUTS!)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;

    // Base user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthenticationError();
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

    log.info("COMPLETE data export (GDPR)", {
      userId,
      role: user.role,
      homeworkCount: studentData?.homework?.length || 0,
      gradesCount: studentData?.grades?.length || 0,
    });

    const filename = `osnovci-export-${user.id}-${Date.now()}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
