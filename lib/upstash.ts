// Upstash Redis Client Configuration
// Production-ready Redis cache & rate limiting
// With connection pooling, exponential backoff, and health checks

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { log } from "./logger";

/**
 * Singleton Redis Client with exponential backoff
 */
class RedisManager {
  private static instance: RedisManager | null = null;
  private client: Redis | null = null;
  private isHealthy: boolean = false;
  private lastHealthCheck: Date | null = null;
  private consecutiveFailures: number = 0;
  private readonly MAX_FAILURES = 3;

  private constructor() {
    if (
      process.env["UPSTASH_REDIS_REST_URL"] &&
      process.env["UPSTASH_REDIS_REST_TOKEN"]
    ) {
      this.client = new Redis({
        url: process.env["UPSTASH_REDIS_REST_URL"],
        token: process.env["UPSTASH_REDIS_REST_TOKEN"],
        retry: {
          retries: 3,
          backoff: (retryCount) => {
            // Exponential backoff: 100ms, 200ms, 400ms
            return Math.min(100 * 2 ** retryCount, 1000);
          },
        },
      });

      // Initial health check
      this.checkHealth().catch(() => {
        log.warn("Redis initial health check failed");
      });
    } else {
      log.warn("Redis not configured - using in-memory fallback");
    }
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getClient(): Redis | null {
    if (!this.client) return null;

    // If too many failures, disable Redis temporarily
    if (this.consecutiveFailures >= this.MAX_FAILURES) {
      log.error("Redis disabled due to consecutive failures", {
        failures: this.consecutiveFailures,
      });
      return null;
    }

    return this.client;
  }

  public async checkHealth(): Promise<boolean> {
    if (!this.client) {
      this.isHealthy = false;
      return false;
    }

    try {
      // Simple ping to check connection
      await this.client.ping();
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      this.consecutiveFailures = 0; // Reset on success
      return true;
    } catch (error) {
      this.consecutiveFailures++;
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      log.error("Redis health check failed", error, {
        consecutiveFailures: this.consecutiveFailures,
      });
      return false;
    }
  }

  public getHealthStatus(): {
    healthy: boolean;
    lastCheck: Date | null;
    consecutiveFailures: number;
  } {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  public recordFailure(): void {
    this.consecutiveFailures++;
  }
}

// Export singleton instance
const redisManager = RedisManager.getInstance();

/**
 * Redis Client (with connection pooling)
 */
export const redis = redisManager.getClient();

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
 * Helper: Cache data in Redis (with failure tracking)
 */
export async function cacheSet(
  key: string,
  value: string | number | object,
  expirationSeconds?: number,
): Promise<void> {
  const client = redisManager.getClient();
  if (!client) return;

  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    if (expirationSeconds) {
      await client.setex(key, expirationSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
    redisManager.recordSuccess();
  } catch (error) {
    redisManager.recordFailure();
    log.error("Redis cache set error", error, { key });
  }
}

/**
 * Helper: Get cached data from Redis (with failure tracking)
 */
export async function cacheGet<T = string>(key: string): Promise<T | null> {
  const client = redisManager.getClient();
  if (!client) return null;

  try {
    const value = await client.get<string>(key);
    if (!value) return null;

    redisManager.recordSuccess();

    // Try to parse JSON, fallback to raw string
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch (error) {
    redisManager.recordFailure();
    log.error("Redis cache get error", error, { key });
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
    // Silently fail - Redis is optional
    if (process.env.NODE_ENV === "development") {
      console.error("Redis cache delete error:", error);
    }
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
    // Silently fail - Redis is optional
    if (process.env.NODE_ENV === "development") {
      console.error("Redis cache exists error:", error);
    }
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
    // Silently fail - Redis is optional
    if (process.env.NODE_ENV === "development") {
      console.error("Redis cache increment error:", error);
    }
    return 0;
  }
}

/**
 * Helper: Get multiple keys (with failure tracking)
 */
export async function cacheGetMany<T = string>(
  keys: string[],
): Promise<(T | null)[]> {
  const client = redisManager.getClient();
  if (!client || keys.length === 0) return [];

  try {
    const values = await client.mget<string[]>(...keys);
    redisManager.recordSuccess();
    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  } catch (error) {
    redisManager.recordFailure();
    log.error("Redis cache get many error", error, { keyCount: keys.length });
    return keys.map(() => null);
  }
}

/**
 * Get Redis health status
 */
export function getRedisHealth() {
  return redisManager.getHealthStatus();
}

/**
 * Force Redis health check
 */
export async function checkRedisHealth(): Promise<boolean> {
  return redisManager.checkHealth();
}
