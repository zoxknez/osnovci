// Account Lockout - Prevent brute-force attacks
// Uses Redis for persistent storage (production-ready)
// Enhanced with exponential backoff and progressive lockouts
import { log } from "@/lib/logger";
import { isRedisConfigured, redis } from "@/lib/upstash";

const MAX_FAILED_ATTEMPTS = 5;
const BASE_LOCKOUT_MINUTES = 5; // Starting lockout duration
const MAX_LOCKOUT_MINUTES = 1440; // Maximum 24 hours

interface LoginAttempt {
  email: string;
  success: boolean;
  ip?: string;
}

interface LockoutInfo {
  count: number;
  lockedUntil?: Date;
  lockoutCount: number; // Number of times account has been locked
}

// Fallback in-memory store for development (when Redis not configured)
const fallbackAttempts = new Map<string, LockoutInfo>();

/**
 * Calculate lockout duration with exponential backoff
 * 1st lockout: 5 min, 2nd: 15 min, 3rd: 45 min, 4th: 135 min, etc.
 * Capped at 24 hours (1440 minutes)
 */
function calculateLockoutDuration(lockoutCount: number): number {
  const duration = BASE_LOCKOUT_MINUTES * 3 ** lockoutCount;
  return Math.min(duration, MAX_LOCKOUT_MINUTES);
}

/**
 * Get Redis key for email
 */
function getRedisKey(email: string, suffix = "count"): string {
  return `lockout:${email.toLowerCase()}:${suffix}`;
}

/**
 * Record a login attempt (Redis-based with fallback)
 * Enhanced with progressive lockouts using exponential backoff
 */
export async function recordLoginAttempt({ email, success, ip }: LoginAttempt) {
  const key = email.toLowerCase();

  if (success) {
    // Clear failed attempts on successful login (but keep lockout history for progressive penalties)
    if (redis) {
      await redis.del(getRedisKey(key));
      await redis.del(getRedisKey(key, "locked"));
      // Note: we don't delete lockoutCount to maintain history for progressive lockouts
    } else {
      const current = fallbackAttempts.get(key);
      if (current) {
        // Keep lockoutCount but reset other fields
        fallbackAttempts.set(key, {
          count: 0,
          lockoutCount: current.lockoutCount,
        });
      }
    }

    log.info("Login successful - cleared failed attempts", { email });
    return { locked: false };
  }

  // Increment failed attempts
  if (redis) {
    // Redis implementation (persistent)
    const count = await redis.incr(getRedisKey(key));
    const lockoutCount =
      (await redis.get<number>(getRedisKey(key, "lockoutCount"))) || 0;

    // Set expiration on first failure (auto-cleanup after 24h)
    if (count === 1) {
      await redis.expire(getRedisKey(key), 24 * 60 * 60);
    }

    log.warn("Failed login attempt", {
      email,
      attemptCount: count,
      previousLockouts: lockoutCount,
      ip,
    });

    // Lock account if threshold exceeded
    if (count >= MAX_FAILED_ATTEMPTS) {
      const lockoutDuration = calculateLockoutDuration(lockoutCount);
      const lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);

      // Increment lockout count for next time
      const newLockoutCount = lockoutCount + 1;
      await redis.set(getRedisKey(key, "lockoutCount"), newLockoutCount, {
        ex: 7 * 24 * 60 * 60, // Keep lockout history for 7 days
      });

      await redis.set(
        getRedisKey(key, "locked"),
        JSON.stringify({
          timestamp: lockedUntil.getTime(),
          lockoutCount: newLockoutCount,
        }),
        { ex: lockoutDuration * 60 },
      );

      log.warn("Account locked due to too many failed attempts", {
        email,
        lockedUntil,
        attemptCount: count,
        lockoutNumber: newLockoutCount,
        lockoutDurationMinutes: lockoutDuration,
      });

      return {
        locked: true,
        lockedUntil,
        lockoutNumber: newLockoutCount,
        message: `Nalog je zaključan zbog previše neuspešnih pokušaja. Pokušaj ponovo posle ${lockoutDuration} minuta.${newLockoutCount > 1 ? ` Ovo je ${newLockoutCount}. zaključavanje.` : ""}`,
      };
    }

    return {
      locked: false,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - count,
    };
  } else {
    // Fallback in-memory implementation (development only)
    const current = fallbackAttempts.get(key) || { count: 0, lockoutCount: 0 };
    current.count += 1;

    log.warn("Failed login attempt (in-memory fallback)", {
      email,
      attemptCount: current.count,
      previousLockouts: current.lockoutCount,
      ip,
    });

    // Lock account if threshold exceeded
    if (current.count >= MAX_FAILED_ATTEMPTS) {
      const lockoutDuration = calculateLockoutDuration(current.lockoutCount);
      const lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);

      current.lockedUntil = lockedUntil;
      current.lockoutCount += 1;

      log.warn("Account locked (in-memory fallback)", {
        email,
        lockedUntil,
        attemptCount: current.count,
        lockoutNumber: current.lockoutCount,
        lockoutDurationMinutes: lockoutDuration,
      });

      fallbackAttempts.set(key, current);

      return {
        locked: true,
        lockedUntil,
        lockoutNumber: current.lockoutCount,
        message: `Nalog je zaključan zbog previše neuspešnih pokušaja. Pokušaj ponovo posle ${lockoutDuration} minuta.${current.lockoutCount > 1 ? ` Ovo je ${current.lockoutCount}. zaključavanje.` : ""}`,
      };
    }

    fallbackAttempts.set(key, current);

    return {
      locked: false,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - current.count,
    };
  }
}

/**
 * Check if account is locked
 * Enhanced to parse JSON stored lockout info
 */
export async function isAccountLocked(email: string): Promise<{
  locked: boolean;
  lockedUntil?: Date;
  message?: string;
  lockoutNumber?: number;
}> {
  const key = email.toLowerCase();

  if (redis) {
    // Redis implementation
    const lockedData = await redis.get<string>(getRedisKey(key, "locked"));

    if (!lockedData) {
      return { locked: false };
    }

    // Parse the locked data (can be old format or new JSON format)
    let lockedUntil: Date;
    let lockoutNumber = 1;

    try {
      const parsed = JSON.parse(lockedData);
      lockedUntil = new Date(parsed.timestamp);
      lockoutNumber = parsed.lockoutCount || 1;
    } catch {
      // Old format: just a timestamp string
      lockedUntil = new Date(parseInt(lockedData, 10));
    }

    // Check if lockout has expired
    if (new Date() > lockedUntil) {
      // Lockout expired - clean up (Redis TTL should handle this, but be safe)
      await redis.del(getRedisKey(key));
      await redis.del(getRedisKey(key, "locked"));
      log.info("Account lockout expired", { email });
      return { locked: false };
    }

    const minutesRemaining = Math.ceil(
      (lockedUntil.getTime() - Date.now()) / (1000 * 60),
    );

    return {
      locked: true,
      lockedUntil,
      lockoutNumber,
      message: `Nalog je zaključan. Pokušaj ponovo za ${minutesRemaining} minuta.${lockoutNumber > 1 ? ` (${lockoutNumber}. zaključavanje)` : ""}`,
    };
  } else {
    // Fallback in-memory implementation
    const attempt = fallbackAttempts.get(key);

    if (!attempt?.lockedUntil) {
      return { locked: false };
    }

    // Check if lockout has expired
    if (new Date() > attempt.lockedUntil) {
      fallbackAttempts.delete(key);
      log.info("Account lockout expired (in-memory fallback)", { email });
      return { locked: false };
    }

    const minutesRemaining = Math.ceil(
      (attempt.lockedUntil.getTime() - Date.now()) / (1000 * 60),
    );

    return {
      locked: true,
      lockedUntil: attempt.lockedUntil,
      message: `Nalog je zaključan. Pokušaj ponovo za ${minutesRemaining} minuta.`,
    };
  }
}

/**
 * Manually unlock account (admin function)
 */
export async function unlockAccount(email: string) {
  const key = email.toLowerCase();

  if (redis) {
    await redis.del(getRedisKey(key));
    await redis.del(getRedisKey(key, "locked"));
  } else {
    fallbackAttempts.delete(key);
  }

  log.info("Account manually unlocked", { email });
}

/**
 * Get failed attempts count
 */
export async function getFailedAttempts(email: string): Promise<number> {
  const key = email.toLowerCase();

  if (redis) {
    const count = await redis.get<number>(getRedisKey(key));
    return count || 0;
  } else {
    return fallbackAttempts.get(key)?.count || 0;
  }
}

/**
 * Cleanup expired lockouts (only needed for in-memory fallback)
 */
export function cleanupExpiredLockouts() {
  if (redis) {
    // Redis handles TTL automatically, no cleanup needed
    return 0;
  }

  const now = new Date();
  let cleaned = 0;

  for (const [email, attempt] of fallbackAttempts.entries()) {
    if (attempt.lockedUntil && now > attempt.lockedUntil) {
      fallbackAttempts.delete(email);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    log.info("Cleaned up expired lockouts (in-memory fallback)", {
      count: cleaned,
    });
  }

  return cleaned;
}

// Cleanup every 10 minutes (only for in-memory fallback)
if (typeof window === "undefined" && !isRedisConfigured()) {
  setInterval(cleanupExpiredLockouts, 10 * 60 * 1000);
}
