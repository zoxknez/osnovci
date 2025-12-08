/**
 * Cron Job - Reset Weekly/Monthly XP
 *
 * Resets weekly XP every Monday
 * Resets monthly XP on 1st of each month
 *
 * Run: Daily at midnight
 */

import { type NextRequest, NextResponse } from "next/server";
import { resetPeriodicXP } from "@/lib/gamification/xp-system";
import { log } from "@/lib/logger";

// Security: Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env["CRON_SECRET"];

  if (!secret) {
    log.error("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    log.info("Cron job started: reset-xp");

    await resetPeriodicXP();

    log.info("Cron job completed: reset-xp");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Cron job failed: reset-xp", { error });

    return NextResponse.json(
      {
        success: false,
        error: "XP reset failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
