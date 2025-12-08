/**
 * Redis Cache Layer
 *
 * Provides high-performance caching for frequently accessed data:
 * - Student data (profile, settings)
 * - Homework lists (daily, weekly)
 * - Schedule entries (weekly view)
 * - Grade aggregations (subject averages)
 * - Parental insights (engagement scores)
 *
 * Cache Strategy:
 * - Read-through: Fetch from DB if cache miss
 * - Write-through: Update cache on DB writes
 * - TTL-based expiration: Different TTLs per data type
 * - Tag-based invalidation: Clear related caches
 */

import { Redis } from "@upstash/redis";
import { log } from "@/lib/logger";

// Initialize Upstash Redis client
export const redis =
  process.env["UPSTASH_REDIS_REST_URL"] &&
  process.env["UPSTASH_REDIS_REST_TOKEN"]
    ? new Redis({
        url: process.env["UPSTASH_REDIS_REST_URL"],
        token: process.env["UPSTASH_REDIS_REST_TOKEN"],
      })
    : null;

// Cache key prefixes
const CACHE_PREFIXES = {
  STUDENT: "student:",
  HOMEWORK: "homework:",
  SCHEDULE: "schedule:",
  GRADES: "grades:",
  INSIGHTS: "insights:",
  CALENDAR: "calendar:",
} as const;

// TTL values (in seconds)
const CACHE_TTL = {
  STUDENT: 3600, // 1 hour
  HOMEWORK: 300, // 5 minutes
  SCHEDULE: 86400, // 24 hours
  GRADES: 1800, // 30 minutes
  INSIGHTS: 3600, // 1 hour
  CALENDAR: 600, // 10 minutes
} as const;

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Generic get from cache with JSON parsing
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const data = await redis.get<string>(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    log.error("Redis GET error", error, { key });
    return null;
  }
}

/**
 * Generic set to cache with JSON serialization
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl?: number,
): Promise<void> {
  if (!redis) return;

  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    log.error("Redis SET error", error, { key });
  }
}

/**
 * Delete cache key(s)
 */
export async function cacheDelete(key: string | string[]): Promise<void> {
  if (!redis) return;

  try {
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    log.error("Redis DEL error", error, { key });
  }
}

/**
 * Delete all keys matching pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    // Upstash Redis supports SCAN
    let cursor = 0;
    const keysToDelete: string[] = [];

    do {
      const result = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor =
        typeof result[0] === "string" ? parseInt(result[0], 10) : result[0];
      keysToDelete.push(...result[1]);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      log.info("Cache pattern deleted", {
        pattern,
        count: keysToDelete.length,
      });
    }
  } catch (error) {
    log.error("Redis SCAN/DEL error", error, { pattern });
  }
}

/**
 * Increment counter (for rate limiting)
 */
export async function cacheIncrement(
  key: string,
  ttl?: number,
): Promise<number> {
  if (!redis) return 0;

  try {
    const value = await redis.incr(key);
    if (ttl && value === 1) {
      await redis.expire(key, ttl);
    }
    return value;
  } catch (error) {
    log.error("Redis INCR error", error, { key });
    return 0;
  }
}

// ===========================================
// DOMAIN-SPECIFIC CACHE FUNCTIONS
// ===========================================

/**
 * Student data cache
 */
export async function getCachedStudent(studentId: string) {
  return cacheGet(`${CACHE_PREFIXES.STUDENT}${studentId}`);
}

export async function setCachedStudent(studentId: string, data: unknown) {
  return cacheSet(
    `${CACHE_PREFIXES.STUDENT}${studentId}`,
    data,
    CACHE_TTL.STUDENT,
  );
}

export async function invalidateStudentCache(studentId: string) {
  return cacheDelete(`${CACHE_PREFIXES.STUDENT}${studentId}`);
}

/**
 * Homework cache (daily list)
 */
export async function getCachedHomework(studentId: string, date: string) {
  return cacheGet(`${CACHE_PREFIXES.HOMEWORK}${studentId}:${date}`);
}

export async function setCachedHomework(
  studentId: string,
  date: string,
  data: unknown,
) {
  return cacheSet(
    `${CACHE_PREFIXES.HOMEWORK}${studentId}:${date}`,
    data,
    CACHE_TTL.HOMEWORK,
  );
}

export async function invalidateHomeworkCache(studentId: string) {
  return cacheDeletePattern(`${CACHE_PREFIXES.HOMEWORK}${studentId}:*`);
}

/**
 * Generic homework list cache (for pagination/filtering)
 */
export async function getCachedHomeworkList(
  studentId: string,
  keySuffix: string,
) {
  return cacheGet(`${CACHE_PREFIXES.HOMEWORK}${studentId}:${keySuffix}`);
}

export async function setCachedHomeworkList(
  studentId: string,
  keySuffix: string,
  data: unknown,
) {
  return cacheSet(
    `${CACHE_PREFIXES.HOMEWORK}${studentId}:${keySuffix}`,
    data,
    CACHE_TTL.HOMEWORK,
  );
}

/**
 * Schedule cache (weekly view)
 */
export async function getCachedSchedule(studentId: string) {
  return cacheGet(`${CACHE_PREFIXES.SCHEDULE}${studentId}`);
}

export async function setCachedSchedule(studentId: string, data: unknown) {
  return cacheSet(
    `${CACHE_PREFIXES.SCHEDULE}${studentId}`,
    data,
    CACHE_TTL.SCHEDULE,
  );
}

export async function invalidateScheduleCache(studentId: string) {
  return cacheDelete(`${CACHE_PREFIXES.SCHEDULE}${studentId}`);
}

/**
 * Grades cache (subject averages)
 */
export async function getCachedGrades(studentId: string, period?: string) {
  const key = period
    ? `${CACHE_PREFIXES.GRADES}${studentId}:${period}`
    : `${CACHE_PREFIXES.GRADES}${studentId}`;
  return cacheGet(key);
}

export async function setCachedGrades(
  studentId: string,
  data: unknown,
  period?: string,
) {
  const key = period
    ? `${CACHE_PREFIXES.GRADES}${studentId}:${period}`
    : `${CACHE_PREFIXES.GRADES}${studentId}`;
  return cacheSet(key, data, CACHE_TTL.GRADES);
}

export async function invalidateGradesCache(studentId: string) {
  return cacheDeletePattern(`${CACHE_PREFIXES.GRADES}${studentId}*`);
}

/**
 * Parental insights cache
 */
export async function getCachedInsights(studentId: string) {
  return cacheGet(`${CACHE_PREFIXES.INSIGHTS}${studentId}`);
}

export async function setCachedInsights(studentId: string, data: unknown) {
  return cacheSet(
    `${CACHE_PREFIXES.INSIGHTS}${studentId}`,
    data,
    CACHE_TTL.INSIGHTS,
  );
}

export async function invalidateInsightsCache(studentId: string) {
  return cacheDelete(`${CACHE_PREFIXES.INSIGHTS}${studentId}`);
}

/**
 * Calendar cache (multi-view)
 */
export async function getCachedCalendar(
  studentId: string,
  view: string,
  date: string,
) {
  return cacheGet(`${CACHE_PREFIXES.CALENDAR}${studentId}:${view}:${date}`);
}

export async function setCachedCalendar(
  studentId: string,
  view: string,
  date: string,
  data: unknown,
) {
  return cacheSet(
    `${CACHE_PREFIXES.CALENDAR}${studentId}:${view}:${date}`,
    data,
    CACHE_TTL.CALENDAR,
  );
}

export async function invalidateCalendarCache(studentId: string) {
  return cacheDeletePattern(`${CACHE_PREFIXES.CALENDAR}${studentId}:*`);
}

/**
 * Bulk cache invalidation (when student data changes)
 */
export async function invalidateAllStudentCaches(studentId: string) {
  await Promise.all([
    invalidateStudentCache(studentId),
    invalidateHomeworkCache(studentId),
    invalidateScheduleCache(studentId),
    invalidateGradesCache(studentId),
    invalidateInsightsCache(studentId),
    invalidateCalendarCache(studentId),
  ]);

  log.info("All student caches invalidated", { studentId });
}

/**
 * Cache warming (preload frequently accessed data)
 */
export async function warmCache(
  studentId: string,
  data: {
    student?: unknown;
    homework?: unknown;
    schedule?: unknown;
    grades?: unknown;
  },
) {
  const promises: Promise<void>[] = [];

  if (data.student) {
    promises.push(setCachedStudent(studentId, data.student));
  }
  if (data.schedule) {
    promises.push(setCachedSchedule(studentId, data.schedule));
  }
  if (data.grades) {
    promises.push(setCachedGrades(studentId, data.grades));
  }

  await Promise.all(promises);
  log.info("Cache warmed", { studentId, dataTypes: Object.keys(data) });
}
