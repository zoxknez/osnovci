/**
 * Weekly Report API Endpoint
 *
 * GET /api/reports/weekly - Generate weekly report for current user's student(s)
 * POST /api/reports/weekly - Manually trigger weekly report generation and email
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { generateWeeklyReportEmail } from "@/lib/email/templates/weekly-report";
import { log } from "@/lib/logger";
import { generateWeeklyReport } from "@/lib/reports/weekly-report-generator";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { idSchema } from "@/lib/security/validators";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (relaxed for read-only)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.relaxed);
    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      return NextResponse.json(
        { message: "Previše zahteva. Pokušajte ponovo kasnije." },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rawStudentId = searchParams.get("studentId");
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10);

    // Validate studentId if provided
    let studentId: string | null = null;
    if (rawStudentId) {
      try {
        studentId = idSchema.parse(rawStudentId);
      } catch (_error) {
        return NextResponse.json(
          { message: "Neispravan studentId format" },
          { status: 400 },
        );
      }
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
          return NextResponse.json(
            { message: "Neautorizovan pristup" },
            { status: 403 },
          );
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
      return NextResponse.json(
        { message: "Nema pronađenih učenika" },
        { status: 404 },
      );
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
      return NextResponse.json(
        { message: "Greška pri generisanju izveštaja" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      reports: successfulReports,
    });

    // Add rate limit headers
    addRateLimitHeaders(response.headers, rateLimitResult);
    return response;
  } catch (error) {
    log.error("Failed to process weekly report request", error);
    return NextResponse.json(
      { message: "Greška pri generisanju izveštaja" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (moderate for POST)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.moderate);
    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      return NextResponse.json(
        { message: "Previše zahteva. Pokušajte ponovo kasnije." },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 401 },
      );
    }

    // Validate input
    const requestSchema = z.object({
      studentId: idSchema,
      sendEmail: z.boolean().optional().default(false),
    });

    const body = await request.json();
    const validated = requestSchema.parse(body);
    const { studentId, sendEmail } = validated;

    // Verify access
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 403 },
      );
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
            // Generate email content
            const { subject, html, text } = generateWeeklyReportEmail(
              link.guardian.name || "Roditelju",
              report,
              `${process.env["NEXTAUTH_URL"]}/reports/${studentId}/weekly`,
            );

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

            log.info(
              "Weekly report email prepared (not sent - implement email service)",
              {
                guardianEmail: link.guardian.user.email,
                studentId,
                subject,
                hasHtml: html.length > 0,
                hasText: text.length > 0,
              },
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

      const response = NextResponse.json({
        report,
        emailsSent,
        emailsFailed,
      });

      // Add rate limit headers
      addRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Neispravni podaci",
          errors: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    log.error("Failed to process weekly report POST request", error);
    return NextResponse.json(
      { message: "Greška pri generisanju izveštaja" },
      { status: 500 },
    );
  }
}
