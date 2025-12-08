/**
 * API Rate Limiting Middleware
 * Protects against abuse and ensures fair usage
 */

import { Ratelimit } from "@upstash/ratelimit";
import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import { log } from "@/lib/logger";

// ============================================
// RATE LIMIT CONFIGURATIONS
// ============================================

/**
 * Global rate limit (per IP)
 * 100 requests per 15 minutes
 */
export const globalRateLimit = new Ratelimit({
  redis: redis as any,
  limiter: Ratelimit.slidingWindow(100, "15 m"),
  analytics: true,
  prefix: "ratelimit:global",
});

/**
 * API rate limit (per user)
 * 60 requests per minute
 */
export const apiRateLimit = new Ratelimit({
  redis: redis as any,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "ratelimit:api",
});

/**
 * Authentication rate limit (per IP)
 * 5 attempts per 15 minutes
 */
export const authRateLimit = new Ratelimit({
  redis: redis as any,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

/**
 * File upload rate limit (per user)
 * 20 uploads per hour
 */
export const uploadRateLimit = new Ratelimit({
  redis: redis as any,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  analytics: true,
  prefix: "ratelimit:upload",
});

/**
 * Email sending rate limit (per user)
 * 10 emails per hour
 */
export const emailRateLimit = new Ratelimit({
  redis: redis as any,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "ratelimit:email",
});

/**
 * Report generation rate limit (per user)
 * 5 reports per hour
 */
export const reportRateLimit = new Ratelimit({
  redis: redis as any,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:report",
});

// ============================================
// RATE LIMIT MIDDLEWARE
// ============================================

export interface RateLimitConfig {
  limiter: Ratelimit;
  identifier: (req: NextRequest) => string | Promise<string>;
  skipSuccessfulAttempts?: boolean;
}

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      // Get identifier (IP or user ID)
      const identifier = await config.identifier(req);

      // Check rate limit
      const { success, limit, remaining, reset, pending } =
        await config.limiter.limit(identifier);

      // Add rate limit headers
      const headers = new Headers();
      headers.set("X-RateLimit-Limit", limit.toString());
      headers.set("X-RateLimit-Remaining", remaining.toString());
      headers.set("X-RateLimit-Reset", new Date(reset).toISOString());

      if (!success) {
        log.warn("Rate limit exceeded", {
          identifier,
          endpoint: req.nextUrl.pathname,
          limit,
          reset: new Date(reset).toISOString(),
        });

        return new NextResponse(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: "Previše zahteva. Pokušajte ponovo kasnije.",
            limit,
            remaining: 0,
            reset: new Date(reset).toISOString(),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
              ...Object.fromEntries(headers.entries()),
            },
          },
        );
      }

      // If rate limit check is pending, wait for it
      if (pending) {
        await pending;
      }

      // Continue to next middleware/handler
      return null;
    } catch (error) {
      // Log error but don't block request if rate limiting fails
      log.error("Rate limit check failed", error as Error, {
        endpoint: req.nextUrl.pathname,
      });

      return null;
    }
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get IP address from request
 */
export function getIpAddress(req: NextRequest): string {
  // Check various headers for real IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip"); // Cloudflare

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

/**
 * Get user ID from session/token
 */
export async function getUserId(req: NextRequest): Promise<string> {
  try {
    // Try to get user ID from session
    const { auth } = await import("@/lib/auth/config");
    const session = await auth();

    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Session not available
  }

  // Fallback to IP address
  return getIpAddress(req);
}

/**
 * Check if IP is whitelisted
 */
export async function isWhitelisted(ip: string): Promise<boolean> {
  try {
    const whitelist = process.env["RATE_LIMIT_WHITELIST"]?.split(",") || [];
    return whitelist.includes(ip);
  } catch {
    return false;
  }
}

/**
 * Manual rate limit check (for use in API routes)
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const result = await limiter.limit(identifier);

  if (!result.success) {
    log.warn("Rate limit exceeded", {
      identifier,
      limit: result.limit,
      reset: new Date(result.reset).toISOString(),
    });
  }

  return result;
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(
  prefix: string,
  identifier: string,
): Promise<void> {
  try {
    if (!redis) {
      log.warn("Redis not available, cannot reset rate limit");
      return;
    }
    await redis.del(`${prefix}:${identifier}`);
    log.info("Rate limit reset", { prefix, identifier });
  } catch (error) {
    log.error("Failed to reset rate limit", error as Error, {
      prefix,
      identifier,
    });
  }
}

/**
 * Get rate limit status
 */
export async function getRateLimitStatus(
  limiter: Ratelimit,
  identifier: string,
): Promise<{
  remaining: number;
  reset: Date;
}> {
  const result = await limiter.limit(identifier);

  return {
    remaining: result.remaining,
    reset: new Date(result.reset),
  };
}

/**
 * Increment counter without blocking
 */
export async function incrementCounter(
  key: string,
  ttl: number = 3600,
): Promise<number> {
  if (!redis) {
    log.warn("Redis not available, cannot increment counter");
    return 0;
  }

  const count = await redis.incr(key);

  // Set expiry on first increment
  if (count === 1) {
    await redis.expire(key, ttl);
  }

  return count;
}

/**
 * Get counter value
 */
export async function getCounter(key: string): Promise<number> {
  if (!redis) {
    log.warn("Redis not available, cannot get counter");
    return 0;
  }

  const value = await redis.get<number>(key);
  return value || 0;
}

// ============================================
// PREDEFINED MIDDLEWARE INSTANCES
// ============================================

/**
 * Global rate limit middleware (per IP)
 */
export const globalRateLimitMiddleware = createRateLimitMiddleware({
  limiter: globalRateLimit,
  identifier: (req) => getIpAddress(req),
});

/**
 * API rate limit middleware (per user)
 */
export const apiRateLimitMiddleware = createRateLimitMiddleware({
  limiter: apiRateLimit,
  identifier: async (req) => await getUserId(req),
});

/**
 * Auth rate limit middleware (per IP)
 */
export const authRateLimitMiddleware = createRateLimitMiddleware({
  limiter: authRateLimit,
  identifier: (req) => getIpAddress(req),
});

/**
 * Upload rate limit middleware (per user)
 */
export const uploadRateLimitMiddleware = createRateLimitMiddleware({
  limiter: uploadRateLimit,
  identifier: async (req) => await getUserId(req),
});

/**
 * Email rate limit middleware (per user)
 */
export const emailRateLimitMiddleware = createRateLimitMiddleware({
  limiter: emailRateLimit,
  identifier: async (req) => await getUserId(req),
});

/**
 * Report rate limit middleware (per user)
 */
export const reportRateLimitMiddleware = createRateLimitMiddleware({
  limiter: reportRateLimit,
  identifier: async (req) => await getUserId(req),
});
