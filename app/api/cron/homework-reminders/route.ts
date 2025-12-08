/**
 * Cron Endpoint: Homework Reminders
 *
 * Schedule: Every 15 minutes
 *
 * Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/homework-reminders",
 *     "schedule": "0,15,30,45 * * * *"
 *   }]
 * }
 *
 * Manual trigger (development):
 * curl http://localhost:3000/api/cron/homework-reminders?secret=your-secret
 */

import { type NextRequest, NextResponse } from "next/server";
import { processHomeworkReminders } from "@/lib/cron/homework-reminders";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max (Vercel Pro limit)
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/homework-reminders
 *
 * Vercel Cron will call this endpoint automatically
 * For manual testing: add ?secret=YOUR_CRON_SECRET query param
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get("authorization");
    const querySecret = request.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env["CRON_SECRET"];

    if (!expectedSecret) {
      log.error("[CRON] CRON_SECRET not configured in environment");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }

    // Check authorization
    const isVercelCron = authHeader === `Bearer ${expectedSecret}`;
    const isManualTrigger = querySecret === expectedSecret;

    if (!isVercelCron && !isManualTrigger) {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      log.warn("[CRON] Unauthorized cron attempt", {
        ip: clientIp,
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    log.info("[CRON] Homework reminders cron triggered", {
      source: isVercelCron ? "vercel" : "manual",
      ip: clientIp,
    });

    // Process reminders
    const result = await processHomeworkReminders();

    const duration = Date.now() - startTime;

    log.info("[CRON] Homework reminders completed", {
      ...result,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    log.error("[CRON] Homework reminders failed", error as Error, {
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
