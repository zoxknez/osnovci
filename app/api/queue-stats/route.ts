/**
 * Queue Statistics API Endpoint
 * Provides real-time queue metrics for monitoring
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import { getAllQueueStats } from "@/lib/queue/bullmq-config";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/queue-stats
 * Get statistics for all queues
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "queue-stats",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    // Only admins can view queue stats
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nemate pristup", requestId },
        { status: 403 },
      );
    }

    // Get all queue statistics
    const stats = await getAllQueueStats();

    log.info("Queue stats retrieved", { userId: session.user.id, requestId });

    return NextResponse.json({
      success: true,
      requestId,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Failed to get queue stats", { error, requestId });

    return NextResponse.json(
      {
        error: "Greška pri dohvatanju statistike redova",
        message: error instanceof Error ? error.message : "Nepoznata greška",
        requestId,
      },
      { status: 500 },
    );
  }
}
