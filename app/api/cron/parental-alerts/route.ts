/**
 * Cron Job: Check and send parental alerts
 * Runs every 6 hours
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkParentalAlerts, sendParentalAlert } from "@/lib/ai/parental-alerts";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env['CRON_SECRET']}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active students
    const students = await prisma.student.findMany({
      where: { accountActive: true },
      include: {
        links: {
          where: { isActive: true },
          include: {
            guardian: true,
          },
        },
      },
    });

    let totalAlerts = 0;

    for (const student of students) {
      // Check for alerts
      const alerts = await checkParentalAlerts(student.id);

      // Send alerts to all linked guardians
      for (const link of student.links) {
        for (const alert of alerts) {
          await sendParentalAlert(link.guardian.id, alert);
          totalAlerts++;
        }
      }
    }

    log.info("Parental alerts cron completed", {
      studentsChecked: students.length,
      totalAlerts,
    });

    return NextResponse.json({
      success: true,
      studentsChecked: students.length,
      totalAlerts,
    });
  } catch (error) {
    log.error("Error in parental alerts cron", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

