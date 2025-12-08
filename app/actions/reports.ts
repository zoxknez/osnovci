"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { generateWeeklyReport } from "@/lib/reports/weekly-report-generator";

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

export async function getWeeklyReportsAction(
  studentId?: string,
  weekOffset: number = 0,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    // Find student(s)
    let studentIds: string[] = [];

    if (studentId) {
      // Verify access to specific student
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student || student.userId !== session.user.id) {
        // Check guardian access
        const guardianLink = await prisma.link.findFirst({
          where: {
            studentId,
            guardian: { userId: session.user.id },
            isActive: true,
          },
        });

        if (!guardianLink) {
          return { error: "Neautorizovan pristup" };
        }
      }

      studentIds = [studentId];
    } else {
      // Get all students for user
      const students = await prisma.student.findMany({
        where: { userId: session.user.id },
        select: { id: true },
      });

      studentIds = students.map((s) => s.id);
    }

    if (studentIds.length === 0) {
      return { error: "Nema pronađenih učenika" };
    }

    // Generate reports
    const reports = await Promise.all(
      studentIds.map(async (id) => {
        try {
          const report = await generateWeeklyReport(id, weekOffset);
          return report;
        } catch (error) {
          log.error("Failed to generate report", error, { studentId: id });
          return null;
        }
      }),
    );

    const successfulReports = reports.filter((r) => r !== null);

    if (successfulReports.length === 0) {
      return { error: "Greška pri generisanju izveštaja" };
    }

    return { data: { reports: successfulReports } };
  } catch (error) {
    log.error("Failed to process weekly report request", error);
    return { error: "Greška pri generisanju izveštaja" };
  }
}

export async function generateAndSendWeeklyReportAction(
  studentId: string,
  sendEmail: boolean = false,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    // Verify access
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.userId !== session.user.id) {
      return { error: "Neautorizovan pristup" };
    }

    // Generate report
    const report = await generateWeeklyReport(studentId);

    // Send email if requested
    if (sendEmail) {
      // Get guardians
      const guardians = await prisma.link.findMany({
        where: {
          studentId,
          isActive: true,
        },
        include: {
          guardian: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      // Send emails to all guardians
      const emailResults = await Promise.all(
        guardians.map(async (link) => {
          try {
            // Send weekly report email
            const { sendWeeklyReportEmail } = await import(
              "@/lib/email/templates"
            );
            await sendWeeklyReportEmail(
              link.guardian.user.email!,
              link.guardian.name || "Roditelju",
              report,
              `${process.env["NEXTAUTH_URL"]}/reports/${studentId}/weekly`,
            );

            return { email: link.guardian.user.email, success: true };
          } catch (error) {
            log.error("Failed to send weekly report email", error, {
              guardianEmail: link.guardian.user.email || "unknown",
              studentId,
            });
            return {
              email: link.guardian.user.email || "unknown",
              success: false,
            };
          }
        }),
      );

      const emailsSent = emailResults.filter((r) => r.success).length;
      const emailsFailed = emailResults.filter((r) => !r.success).length;

      return {
        data: {
          report,
          emailsSent,
          emailsFailed,
        },
      };
    }

    return { data: { report } };
  } catch (error) {
    log.error("Failed to process weekly report POST request", error);
    return { error: "Greška pri generisanju izveštaja" };
  }
}
