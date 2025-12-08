// Cron Job: Cleanup Expired Parental Consent Requests
// Runs daily to mark expired consents and delete old records

import { type NextRequest, NextResponse } from "next/server";
import { cleanupExpiredConsents } from "@/lib/auth/parental-consent";
import { log } from "@/lib/logger";

/**
 * GET /api/cron/cleanup-consents
 *
 * Cleanup expired parental consent requests
 * - Marks expired PENDING consents as EXPIRED
 * - Deletes old EXPIRED/REVOKED consents (30+ days)
 *
 * Should be called by Vercel Cron or external scheduler
 *
 * Authentication: CRON_SECRET header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env["CRON_SECRET"];

    if (!cronSecret) {
      log.warn("CRON_SECRET not configured - skipping cleanup");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      log.warn("Unauthorized cron job attempt", {
        providedAuth: authHeader ? "present" : "missing",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.info("Starting parental consent cleanup job");

    // Run cleanup
    const result = await cleanupExpiredConsents();

    log.info("Parental consent cleanup completed", {
      expired: result.expired,
      deleted: result.deleted,
    });

    return NextResponse.json(
      {
        success: true,
        expired: result.expired,
        deleted: result.deleted,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    log.error("Consent cleanup job failed", error);
    return NextResponse.json({ error: "Cleanup job failed" }, { status: 500 });
  }
}

/**
 * POST /api/cron/cleanup-consents
 * Alternative endpoint for POST-based cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
