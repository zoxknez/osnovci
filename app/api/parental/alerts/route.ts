/**
 * API Route: Parental Alerts
 * Vraća automatska upozorenja za roditelje
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { checkParentalAlerts } from "@/lib/ai/parental-alerts";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "parental-alerts",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id || session.user.role !== "GUARDIAN") {
      return NextResponse.json(
        { error: "Niste prijavljeni kao roditelj", requestId },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Nedostaje studentId", requestId },
        { status: 400 },
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
      return NextResponse.json(
        { error: "Nemate pristup ovom učeniku", requestId },
        { status: 403 },
      );
    }

    // Check for alerts
    const alerts = await checkParentalAlerts(studentId);

    log.info("Parental alerts fetched", {
      guardianId: guardian.id,
      studentId,
      alertCount: alerts.length,
      requestId,
    });

    return NextResponse.json({
      success: true,
      requestId,
      alerts: alerts.map((a) => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    log.error("Error fetching parental alerts", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri učitavanju upozorenja", requestId },
      { status: 500 },
    );
  }
}
