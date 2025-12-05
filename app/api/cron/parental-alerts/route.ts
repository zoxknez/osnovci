/**
 * Cron Job: Check and send parental alerts
 * Runs every 6 hours
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import {
  checkParentalAlerts,
  sendParentalAlert,
} from "@/lib/ai/parental-alerts";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env["CRON_SECRET"];

    if (!cronSecret) {
      log.error("CRON_SECRET not configured", { requestId });
      return NextResponse.json(
        { error: "CRON_SECRET nije podešen", requestId },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      log.warn("Unauthorized parental-alerts cron attempt", { requestId });
      return NextResponse.json(
        { error: "Nemate pristup", requestId },
        { status: 401 },
      );
    }

    log.info("Starting parental alerts cron", { requestId });

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
      requestId,
    });

    return NextResponse.json({
      success: true,
      requestId,
      studentsChecked: students.length,
      totalAlerts,
    });
  } catch (error) {
    log.error("Error in parental alerts cron", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri proveri upozorenja", requestId },
      { status: 500 },
    );
  }
}
