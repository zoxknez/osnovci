/**
 * Enhanced Rate Limiting with Tiered Limits & Exponential Backoff
 * Extends basic rate limiting with role-based limits and violation tracking
 */

import { NextRequest } from "next/server";
import { redis, isRedisConfigured } from "@/lib/upstash";
import { log } from "@/lib/logger";
import { auth } from "@/lib/auth/config";

/**
 * User roles with different rate limits
 */
export type UserRole = "STUDENT" | "GUARDIAN" | "ADMIN" | "UNAUTHENTICATED";

/**
 * Tiered rate limit configuration
 */
export interface TieredRateLimit {
  STUDENT: { limit: number; window: number };
  GUARDIAN: { limit: number; window: number };
  ADMIN: { limit: number; window: number };
  UNAUTHENTICATED: { limit: number; window: number };
}

/**
 * Rate limit result with violation tracking
 */
export interface EnhancedRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  violations: number;
  backoffMultiplier: number;
  blockedUntil?: number;
}

/**
 * Violation record for tracking abuse
 */
interface ViolationRecord {
  count: number;
  firstViolation: number;
  lastViolation: number;
  blocked: boolean;
  blockedUntil?: number;
}

/**
 * Predefined tiered rate limit presets
 */
export const TieredRateLimitPresets = {
  /**
   * API endpoints (homework, grades, schedule)
   */
  api: {
    STUDENT: { limit: 120, window: 60 }, // 120 req/min
    GUARDIAN: { limit: 150, window: 60 }, // 150 req/min (higher for multi-student)
    ADMIN: { limit: 300, window: 60 }, // 300 req/min (monitoring)
    UNAUTHENTICATED: { limit: 30, window: 60 }, // 30 req/min (restricted)
  },
  /**
   * Auth endpoints (login, register)
   */
  auth: {
    STUDENT: { limit: 10, window: 60 },
    GUARDIAN: { limit: 10, window: 60 },
    ADMIN: { limit: 20, window: 60 },
    UNAUTHENTICATED: { limit: 5, window: 60 }, // Strict for unauthenticated
  },
  /**
   * Upload endpoints (file uploads)
   */
  upload: {
    STUDENT: { limit: 15, window: 3600 }, // 15/hour
    GUARDIAN: { limit: 20, window: 3600 }, // 20/hour
    ADMIN: { limit: 50, window: 3600 }, // 50/hour
    UNAUTHENTICATED: { limit: 3, window: 3600 }, // 3/hour
  },
  /**
   * Read-only endpoints (dashboards, analytics)
   */
  read: {
    STUDENT: { limit: 200, window: 60 },
    GUARDIAN: { limit: 250, window: 60 },
    ADMIN: { limit: 500, window: 60 },
    UNAUTHENTICATED: { limit: 50, window: 60 },
  },
  /**
   * Moderation endpoints (AI moderation)
   */
  moderation: {
    STUDENT: { limit: 50, window: 60 },
    GUARDIAN: { limit: 50, window: 60 },
    ADMIN: { limit: 200, window: 60 },
    UNAUTHENTICATED: { limit: 10, window: 60 },
  },
} as const;

/**
 * Exponential backoff multipliers based on violation count
 */
const BACKOFF_MULTIPLIERS = {
  1: 1, // First violation: normal limit
  2: 2, // Second: half the rate
  3: 4, // Third: quarter rate
  4: 8, // Fourth: eighth rate
  5: 16, // Fifth: sixteenth rate
  6: 999, // Sixth+: effectively blocked
} as const;

/**
 * Get user role from request
 */
async function getUserRole(_request: NextRequest): Promise<UserRole> {
  try {
    const session = await auth();
    if (!session?.user) return "UNAUTHENTICATED";
    
    return (session.user.role as UserRole) || "STUDENT";
  } catch {
    return "UNAUTHENTICATED";
  }
}

/**
 * Get identifier for rate limiting (IP + optional user ID)
 */
function getIdentifier(request: NextRequest, userId?: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
  
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Get violation record from Redis
 */
async function getViolationRecord(
  identifier: string
): Promise<ViolationRecord> {
  if (!isRedisConfigured() || !redis) {
    return { count: 0, firstViolation: 0, lastViolation: 0, blocked: false };
  }

  try {
    const key = `ratelimit:violations:${identifier}`;
    const data = await redis.get<string>(key);
    
    if (!data) {
      return { count: 0, firstViolation: 0, lastViolation: 0, blocked: false };
    }

    return JSON.parse(data) as ViolationRecord;
  } catch (error) {
    log.error("Failed to get violation record", error);
    return { count: 0, firstViolation: 0, lastViolation: 0, blocked: false };
  }
}

/**
 * Update violation record in Redis
 */
async function updateViolationRecord(
  identifier: string,
  record: ViolationRecord
): Promise<void> {
  if (!isRedisConfigured() || !redis) return;

  try {
    const key = `ratelimit:violations:${identifier}`;
    // Store for 24 hours
    await redis.setex(key, 86400, JSON.stringify(record));
  } catch (error) {
    log.error("Failed to update violation record", error);
  }
}

/**
 * Calculate backoff multiplier based on violation count
 */
function getBackoffMultiplier(violations: number): number {
  if (violations <= 0) return 1;
  if (violations >= 6) return BACKOFF_MULTIPLIERS[6];
  return BACKOFF_MULTIPLIERS[violations as keyof typeof BACKOFF_MULTIPLIERS] || 1;
}

/**
 * Enhanced rate limit check with tiered limits and exponential backoff
 */
export async function enhancedRateLimit(
  request: NextRequest,
  preset: keyof typeof TieredRateLimitPresets
): Promise<EnhancedRateLimitResult> {
  const role = await getUserRole(request);
  const config = TieredRateLimitPresets[preset][role];
  const { limit: baseLimit, window } = config;

  // Get user ID if authenticated
  let userId: string | undefined;
  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch {
    userId = undefined;
  }

  const identifier = getIdentifier(request, userId);
  
  // Check for existing violations
  const violationRecord = await getViolationRecord(identifier);
  const backoffMultiplier = getBackoffMultiplier(violationRecord.count);
  
  // Check if currently blocked
  const now = Date.now();
  if (violationRecord.blocked && violationRecord.blockedUntil) {
    if (now < violationRecord.blockedUntil) {
      return {
        success: false,
        limit: baseLimit,
        remaining: 0,
        reset: violationRecord.blockedUntil,
        violations: violationRecord.count,
        backoffMultiplier,
        blockedUntil: violationRecord.blockedUntil,
      };
    } else {
      // Unblock - reset violations
      violationRecord.blocked = false;
      violationRecord.count = 0;
      await updateViolationRecord(identifier, violationRecord);
    }
  }

  // Apply backoff to limit
  const effectiveLimit = Math.max(1, Math.floor(baseLimit / backoffMultiplier));

  // If Redis not configured, use in-memory fallback (development)
  if (!isRedisConfigured() || !redis) {
    return {
      success: true,
      limit: effectiveLimit,
      remaining: effectiveLimit,
      reset: now + window * 1000,
      violations: 0,
      backoffMultiplier: 1,
    };
  }

  try {
    const key = `ratelimit:${preset}:${role}:${identifier}`;
    const windowMs = window * 1000;

    // Use Redis sorted set for sliding window
    await redis.zremrangebyscore(key, 0, now - windowMs);
    const count = await redis.zcard(key);

    if (count >= effectiveLimit) {
      // Rate limit exceeded - record violation
      violationRecord.count += 1;
      violationRecord.lastViolation = now;
      if (violationRecord.count === 1) {
        violationRecord.firstViolation = now;
      }

      // Block if too many violations
      if (violationRecord.count >= 5) {
        const blockDuration = Math.min(
          3600000, // Max 1 hour
          60000 * Math.pow(2, violationRecord.count - 5) // Exponential: 1min, 2min, 4min, 8min...
        );
        violationRecord.blocked = true;
        violationRecord.blockedUntil = now + blockDuration;
      }

      await updateViolationRecord(identifier, violationRecord);

      // Get oldest timestamp for reset calculation
      const oldestTimestamp = await redis.zrange(key, 0, 0, {
        withScores: true,
      });
      const resetTime =
        oldestTimestamp.length > 0
          ? Number(oldestTimestamp[1]) + windowMs
          : now + windowMs;

      log.warn("Rate limit exceeded", {
        identifier,
        role,
        preset,
        limit: effectiveLimit,
        count,
        violations: violationRecord.count,
      });

      return {
        success: false,
        limit: effectiveLimit,
        remaining: 0,
        reset: resetTime,
        violations: violationRecord.count,
        backoffMultiplier,
      };
    }

    // Add current request
    const requestId = `${now}:${Math.random()}`;
    await redis.zadd(key, { score: now, member: requestId });
    await redis.expire(key, window);

    return {
      success: true,
      limit: effectiveLimit,
      remaining: effectiveLimit - (count + 1),
      reset: now + windowMs,
      violations: violationRecord.count,
      backoffMultiplier,
    };
  } catch (error) {
    log.error("Enhanced rate limit check failed", error);
    // Fail open - allow request
    return {
      success: true,
      limit: effectiveLimit,
      remaining: effectiveLimit,
      reset: now + window * 1000,
      violations: 0,
      backoffMultiplier: 1,
    };
  }
}

/**
 * Reset violations for an identifier (admin action)
 */
export async function resetViolations(identifier: string): Promise<void> {
  if (!isRedisConfigured() || !redis) return;

  try {
    const key = `ratelimit:violations:${identifier}`;
    await redis.del(key);
    log.info("Violations reset", { identifier });
  } catch (error) {
    log.error("Failed to reset violations", error);
  }
}

/**
 * Get violation statistics for monitoring
 */
export async function getViolationStats(
  identifier: string
): Promise<ViolationRecord | null> {
  return getViolationRecord(identifier);
}
