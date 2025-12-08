/**
 * Redis Health Check API
 *
 * GET /api/health/redis
 * Returns Redis connection status and metrics
 */

import { NextResponse } from "next/server";
import { log } from "@/lib/logger";
import {
  checkRedisHealth,
  getRedisHealth,
  isRedisConfigured,
} from "@/lib/upstash";

export async function GET() {
  try {
    // Check if Redis is configured
    if (!isRedisConfigured()) {
      return NextResponse.json(
        {
          status: "not_configured",
          message: "Redis is not configured - using in-memory fallback",
          configured: false,
        },
        { status: 200 },
      );
    }

    // Get current health status
    const status = getRedisHealth();

    // Perform live health check
    const isHealthy = await checkRedisHealth();

    log.info("Redis health check performed", {
      healthy: isHealthy,
      consecutiveFailures: status.consecutiveFailures,
    });

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        configured: true,
        metrics: {
          healthy: isHealthy,
          lastCheck: status.lastCheck,
          consecutiveFailures: status.consecutiveFailures,
        },
      },
      { status: isHealthy ? 200 : 503 },
    );
  } catch (error) {
    log.error("Redis health check failed", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        configured: true,
      },
      { status: 500 },
    );
  }
}
