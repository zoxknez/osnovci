// Upstash Redis Client Configuration
// Production-ready Redis cache & rate limiting

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Redis Client
 * Uses Upstash Redis for serverless environments
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Rate Limiters using Upstash Redis
 * Fallback to in-memory if Redis not configured
 */

// Auth endpoints: 5 requests per minute
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/auth",
    })
  : null;

// Login strict: 3 requests per minute (after failed attempts)
export const strictRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/strict",
    })
  : null;

// Upload endpoints: 10 requests per hour
export const uploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "@upstash/ratelimit/upload",
    })
  : null;

// API endpoints: 100 requests per minute
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/api",
    })
  : null;

// Global rate limit: 1000 requests per hour
export const globalRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, "1 h"),
      analytics: true,
      prefix: "@upstash/ratelimit/global",
    })
  : null;

/**
 * Helper: Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return redis !== null;
}

/**
 * Helper: Cache data in Redis
 */
export async function cacheSet(
  key: string,
  value: string | number | object,
  expirationSeconds?: number,
): Promise<void> {
  if (!redis) return;

  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (expirationSeconds) {
      await redis.setex(key, expirationSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.error("Redis cache set error:", error);
  }
}

/**
 * Helper: Get cached data from Redis
 */
export async function cacheGet<T = string>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const value = await redis.get<string>(key);
    if (!value) return null;

    // Try to parse JSON, fallback to raw string
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch (error) {
    console.error("Redis cache get error:", error);
    return null;
  }
}

/**
 * Helper: Delete cached data
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis cache delete error:", error);
  }
}

/**
 * Helper: Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (!redis) return false;

  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error("Redis cache exists error:", error);
    return false;
  }
}

/**
 * Helper: Increment counter
 */
export async function cacheIncrement(key: string, by = 1): Promise<number> {
  if (!redis) return 0;

  try {
    return await redis.incrby(key, by);
  } catch (error) {
    console.error("Redis cache increment error:", error);
    return 0;
  }
}

/**
 * Helper: Get multiple keys
 */
export async function cacheGetMany<T = string>(
  keys: string[],
): Promise<(T | null)[]> {
  if (!redis || keys.length === 0) return [];

  try {
    const values = await redis.mget<string[]>(...keys);
    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  } catch (error) {
    console.error("Redis cache get many error:", error);
    return keys.map(() => null);
  }
}

