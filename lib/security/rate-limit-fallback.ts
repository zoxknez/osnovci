/**
 * Rate Limiting Fallback - In-Memory LRU Cache
 * Used when Redis is unavailable to prevent DDoS attacks
 *
 * Production: Always use Redis (Upstash, Railway, or self-hosted)
 * This is ONLY a fallback for development or Redis outages
 */

import { LRUCache } from "lru-cache";
import type { NextRequest } from "next/server";
import { log } from "@/lib/logger";

interface RateLimitEntry {
  requests: number[];
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitConfig {
  limit: number;
  window: number; // seconds
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// LRU Cache configuration
const memoryCache = new LRUCache<string, RateLimitEntry>({
  max: 10000, // Max 10,000 unique identifiers
  ttl: 5 * 60 * 1000, // 5 minutes TTL
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

/**
 * Extract identifier from request (IP address or user ID)
 */
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from headers
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
 * In-memory rate limiter with sliding window
 */
export async function rateLimitMemory(
  request: NextRequest,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const { limit, window, prefix = "ratelimit" } = config;
  const identifier = getIdentifier(request);
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = window * 1000;

  // Get or create entry
  let entry = memoryCache.get(key);
  if (!entry) {
    entry = { requests: [], blocked: false };
  }

  // Check if currently blocked
  if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
    const remainingMs = entry.blockedUntil - now;
    log.warn("Rate limit exceeded (memory fallback)", {
      identifier,
      blocked: true,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    });

    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.blockedUntil,
    };
  }

  // Clear block if expired
  if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
    entry.blocked = false;
    delete entry.blockedUntil;
    entry.requests = [];
  }

  // Filter out old requests (sliding window)
  const windowStart = now - windowMs;
  entry.requests = entry.requests.filter(
    (timestamp) => timestamp > windowStart,
  );

  // Check if limit exceeded
  if (entry.requests.length >= limit) {
    // Block for the remaining window duration
    const oldestRequest = Math.min(...entry.requests);
    const resetTime = oldestRequest + windowMs;

    entry.blocked = true;
    entry.blockedUntil = resetTime;

    memoryCache.set(key, entry);

    log.warn("Rate limit exceeded - blocking (memory fallback)", {
      identifier,
      limit,
      requests: entry.requests.length,
      blockedUntil: new Date(resetTime).toISOString(),
    });

    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Add current request
  entry.requests.push(now);
  memoryCache.set(key, entry);

  const remaining = limit - entry.requests.length;
  const reset = now + windowMs;

  return {
    success: true,
    limit,
    remaining,
    reset,
  };
}

/**
 * Manually clear rate limit for identifier (admin function)
 */
export function clearRateLimit(identifier: string, prefix = "ratelimit"): void {
  const key = `${prefix}:${identifier}`;
  memoryCache.delete(key);
  log.info("Rate limit cleared (memory fallback)", { identifier });
}

/**
 * Get current rate limit stats for identifier
 */
export function getRateLimitStats(
  identifier: string,
  prefix = "ratelimit",
): {
  requests: number;
  blocked: boolean;
  blockedUntil?: Date;
} | null {
  const key = `${prefix}:${identifier}`;
  const entry = memoryCache.get(key);

  if (!entry) {
    return null;
  }

  const result: { requests: number; blocked: boolean; blockedUntil?: Date } = {
    requests: entry.requests.length,
    blocked: entry.blocked,
  };

  if (entry.blockedUntil) {
    result.blockedUntil = new Date(entry.blockedUntil);
  }

  return result;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  max: number;
  percentage: number;
} {
  return {
    size: memoryCache.size,
    max: memoryCache.max,
    percentage: (memoryCache.size / memoryCache.max) * 100,
  };
}
