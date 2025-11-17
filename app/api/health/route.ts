// Health Check Endpoint - Za monitoring i uptime tracking
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: "up" | "down";
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export async function GET() {
  try {
    // Check database connection
    const dbStart = Date.now();
    let dbStatus: "up" | "down" = "down";
    let dbError: string | undefined;
    let dbResponseTime: number | undefined;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "up";
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Unknown error";
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsed = memoryUsage.heapUsed;
    const memoryTotal = memoryUsage.heapTotal;
    const memoryPercentage = (memoryUsed / memoryTotal) * 100;
    // Reserved for future memory metrics
    // @ts-expect-error - Reserved for future use
    const memoryExternal = memoryUsage.external || 0;
    // @ts-expect-error - Reserved for future use
    const memoryRss = memoryUsage.rss || 0;

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (dbStatus === "down") {
      overallStatus = "unhealthy";
    } else if (
      memoryPercentage > 90 ||
      (dbResponseTime && dbResponseTime > 1000)
    ) {
      overallStatus = "degraded";
    }

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env["npm_package_version"] || "0.1.0",
      services: {
        database: {
          status: dbStatus,
          ...(dbResponseTime !== undefined && { responseTime: dbResponseTime }),
          ...(dbError !== undefined && { error: dbError }),
        },
        memory: {
          used: Math.round(memoryUsed / 1024 / 1024), // MB
          total: Math.round(memoryTotal / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage),
        },
      },
    };

    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
