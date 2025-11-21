"use server";

import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { z } from "zod";
import { redis, isRedisConfigured } from "@/lib/upstash";

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

export async function getModerationLogsAction(
  page: number = 1,
  limit: number = 50,
  filters: {
    status?: string;
    flagged?: boolean;
    contentType?: string;
    userId?: string;
  } = {}
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.flagged) where.flagged = true;
    if (filters.contentType) where.contentType = filters.contentType;
    if (filters.userId) where.userId = filters.userId;

    const [logs, total] = await Promise.all([
      prisma.moderationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.moderationLog.count({ where }),
    ]);

    return {
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    log.error("Admin moderation logs Action error", error);
    return { error: "Internal server error" };
  }
}

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "FLAGGED"]),
  reviewNotes: z.string().optional(),
});

export async function reviewModerationLogAction(
  id: string,
  data: z.infer<typeof reviewSchema>
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const validated = reviewSchema.parse(data);

    const updated = await prisma.moderationLog.update({
      where: { id },
      data: {
        status: validated.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        ...(validated.reviewNotes && { reviewNotes: validated.reviewNotes }),
      },
    });

    log.info("Moderation log reviewed", {
      logId: id,
      adminId: session.user.id,
      newStatus: validated.status,
    });

    return { data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid request data" };
    }

    log.error("Admin moderation review Action error", error);
    return { error: "Internal server error" };
  }
}

interface ViolationRecord {
  identifier: string;
  count: number;
  firstViolation: number;
  lastViolation: number;
  blocked: boolean;
  blockedUntil?: number;
}

export async function getRateLimitViolationsAction(): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    if (!isRedisConfigured() || !redis) {
      return {
        data: {
          message: "Redis not configured - rate limiting disabled",
          violations: [],
        },
      };
    }

    // Get all violation keys
    const keys = await redis.keys("ratelimit:violations:*");

    if (!keys || keys.length === 0) {
      return {
        data: {
          violations: [],
          total: 0,
        },
      };
    }

    // Fetch all violation records
    const violations: ViolationRecord[] = [];
    const now = Date.now();

    for (const key of keys) {
      try {
        const data = await redis.get<string>(key);
        if (!data) continue;

        const record = typeof data === "string" ? JSON.parse(data) : data;
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

    return {
      data: {
        violations,
        stats,
        timestamp: now,
      },
    };
  } catch (error) {
    log.error("Rate limits Action error", error);
    return { error: "Internal server error" };
  }
}

export async function resetRateLimitViolationsAction(
  identifier: string
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    if (!isRedisConfigured() || !redis) {
      return {
        data: {
          message: "Redis not configured - nothing to reset",
        },
      };
    }

    // Delete violation record
    const key = `ratelimit:violations:${identifier}`;
    await redis.del(key);

    log.info("Rate limit violations reset by admin", {
      adminId: session.user.id,
      identifier,
    });

    return {
      data: {
        message: "Violations reset successfully",
        identifier,
      },
    };
  } catch (error) {
    log.error("Rate limits reset Action error", error);
    return { error: "Internal server error" };
  }
}
