/**
 * Rate Limit Monitoring API
 * GET /api/admin/rate-limits - Get rate limit violations and stats
 * DELETE /api/admin/rate-limits/[identifier] - Reset violations for user/IP
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { redis, isRedisConfigured } from "@/lib/upstash";
import { log } from "@/lib/logger";
import { z } from "zod";

interface ViolationRecord {
  identifier: string;
  count: number;
  firstViolation: number;
  lastViolation: number;
  blocked: boolean;
  blockedUntil?: number;
}

/**
 * GET /api/admin/rate-limits
 * Get all rate limit violations (admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isRedisConfigured() || !redis) {
      return NextResponse.json({
        message: "Redis not configured - rate limiting disabled",
        violations: [],
      });
    }

    // Get all violation keys
    const keys = await redis.keys("ratelimit:violations:*");
    
    if (!keys || keys.length === 0) {
      return NextResponse.json({
        violations: [],
        total: 0,
      });
    }

    // Fetch all violation records
    const violations: ViolationRecord[] = [];
    const now = Date.now();

    for (const key of keys) {
      try {
        const data = await redis.get<string>(key);
        if (!data) continue;

        const record = JSON.parse(data);
        const identifier = key.replace("ratelimit:violations:", "");

        // Check if still blocked
        const isBlocked =
          record.blocked &&
          record.blockedUntil &&
          now < record.blockedUntil;

        violations.push({
          identifier,
          count: record.count,
          firstViolation: record.firstViolation,
          lastViolation: record.lastViolation,
          blocked: isBlocked,
          blockedUntil: record.blockedUntil,
        });
      } catch (error) {
        log.error("Failed to parse violation record", error, { key });
      }
    }

    // Sort by violation count (highest first)
    violations.sort((a, b) => b.count - a.count);

    // Get active blocks
    const activeBlocks = violations.filter((v) => v.blocked);

    // Get stats
    const stats = {
      total: violations.length,
      activeBlocks: activeBlocks.length,
      highViolators: violations.filter((v) => v.count >= 3).length,
    };

    return NextResponse.json({
      violations,
      stats,
      timestamp: now,
    });
  } catch (error) {
    log.error("Rate limits API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rate-limits/reset
 * Reset violations for specific identifier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      identifier: z.string().min(1),
    });

    const validated = schema.parse(body);

    if (!isRedisConfigured() || !redis) {
      return NextResponse.json({
        message: "Redis not configured - nothing to reset",
      });
    }

    // Delete violation record
    const key = `ratelimit:violations:${validated.identifier}`;
    await redis.del(key);

    log.info("Rate limit violations reset by admin", {
      adminId: session.user.id,
      identifier: validated.identifier,
    });

    return NextResponse.json({
      message: "Violations reset successfully",
      identifier: validated.identifier,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    log.error("Rate limits reset API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
