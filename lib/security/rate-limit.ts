/**
 * Rate Limiting sa Upstash Redis
 * Sliding window rate limiter za API endpoints
 */

import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { log } from "@/lib/logger";

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

interface RateLimitConfig {
  /**
   * Broj dozvoljenih zahteva
   */
  limit: number;
  /**
   * Vremenski prozor u sekundama
   */
  window: number;
  /**
   * Prefix za Redis ključ
   */
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Izvlači identifikator korisnika iz zahteva
 * Prioritet: user ID > IP adresa
 */
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from session (if available in headers)
  const userId = request.headers.get("x-user-id");
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0] : realIp || "unknown";
  return `ip:${ip}`;
}

/**
 * Sliding window rate limiter
 * 
 * @example
 * ```ts
 * const result = await rateLimit(request, {
 *   limit: 10,
 *   window: 60, // 10 requests per minute
 * });
 * 
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: "Too many requests" },
 *     { status: 429, headers: {
 *       "X-RateLimit-Limit": result.limit.toString(),
 *       "X-RateLimit-Remaining": result.remaining.toString(),
 *       "X-RateLimit-Reset": result.reset.toString(),
 *     }}
 *   );
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const { limit, window, prefix = "ratelimit" } = config;

  // If Redis is not configured, allow all requests (development mode)
  if (!redis) {
    log.warn("Rate limiting disabled - Upstash Redis not configured");
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }

  try {
    const identifier = getIdentifier(request);
    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const windowMs = window * 1000;

    // Use Redis sorted set for sliding window
    // Score = timestamp, member = unique request ID

    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, now - windowMs);

    // Count requests in current window
    const count = await redis.zcard(key);

    if (count >= limit) {
      // Rate limit exceeded
      const oldestTimestamp = await redis.zrange(key, 0, 0, {
        withScores: true,
      });
      const resetTime =
        oldestTimestamp.length > 0
          ? Number(oldestTimestamp[1]) + windowMs
          : now + windowMs;

      log.warn("Rate limit exceeded", {
        identifier,
        limit,
        count,
        window,
      });

      return {
        success: false,
        limit,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Add current request
    const requestId = `${now}:${Math.random()}`;
    await redis.zadd(key, { score: now, member: requestId });

    // Set expiry on the key (cleanup)
    await redis.expire(key, window);

    return {
      success: true,
      limit,
      remaining: limit - (count + 1),
      reset: now + windowMs,
    };
  } catch (error) {
    // If Redis fails, fail open (allow request)
    log.error("Rate limit check failed - allowing request", { error });
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict - 10 requests per minute
   * Za sensitive endpoints (login, register, password reset)
   */
  strict: {
    limit: 10,
    window: 60,
  },

  /**
   * Moderate - 30 requests per minute
   * Za API endpoints (homework, grades, schedule)
   */
  moderate: {
    limit: 30,
    window: 60,
  },

  /**
   * Relaxed - 100 requests per minute
   * Za read-only endpoints
   */
  relaxed: {
    limit: 100,
    window: 60,
  },

  /**
   * Upload - 5 uploads per 5 minutes
   * Za file upload endpoints
   */
  upload: {
    limit: 5,
    window: 300,
  },
} as const;

/**
 * Helper za dodavanje rate limit headera u response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
): Headers {
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.reset.toString());
  
  if (!result.success) {
    headers.set("Retry-After", Math.ceil((result.reset - Date.now()) / 1000).toString());
  }
  
  return headers;
}
