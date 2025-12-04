/**
 * API Route: Parental Alerts
 * Vraća automatska upozorenja za roditelje
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { checkParentalAlerts } from "@/lib/ai/parental-alerts";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "GUARDIAN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing studentId" },
        { status: 400 }
      );
    }

    // Verify guardian has access to this student
    const guardian = await prisma.guardian.findUnique({
      where: { userId: session.user.id },
      include: {
        links: {
          where: {
            studentId,
            isActive: true,
          },
        },
      },
    });

    if (!guardian || guardian.links.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for alerts
    const alerts = await checkParentalAlerts(studentId);

    log.info("Parental alerts fetched", {
      guardianId: guardian.id,
      studentId,
      alertCount: alerts.length,
    });

    return NextResponse.json({
      success: true,
      alerts: alerts.map((a) => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    log.error("Error fetching parental alerts", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

