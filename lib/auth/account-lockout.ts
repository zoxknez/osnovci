// Account Lockout - Prevent brute-force attacks
// Uses Redis for persistent storage (production-ready)
import { log } from "@/lib/logger";
import { redis, isRedisConfigured } from "@/lib/upstash";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

interface LoginAttempt {
  email: string;
  success: boolean;
  ip?: string;
}

// Fallback in-memory store for development (when Redis not configured)
const fallbackAttempts = new Map<
  string,
  { count: number; lockedUntil?: Date }
>();

/**
 * Get Redis key for email
 */
function getRedisKey(email: string, suffix = "count"): string {
  return `lockout:${email.toLowerCase()}:${suffix}`;
}

/**
 * Record a login attempt (Redis-based with fallback)
 */
export async function recordLoginAttempt({
  email,
  success,
  ip,
}: LoginAttempt) {
  const key = email.toLowerCase();

  if (success) {
    // Clear failed attempts on successful login
    if (redis) {
      await redis.del(getRedisKey(key));
      await redis.del(getRedisKey(key, "locked"));
    } else {
      fallbackAttempts.delete(key);
    }

    log.info("Login successful - cleared failed attempts", { email });
    return { locked: false };
  }

  // Increment failed attempts
  if (redis) {
    // Redis implementation (persistent)
    const count = await redis.incr(getRedisKey(key));

    // Set expiration on first failure (auto-cleanup)
    if (count === 1) {
      await redis.expire(getRedisKey(key), LOCKOUT_DURATION_MINUTES * 60);
    }

    log.warn("Failed login attempt", {
      email,
      attemptCount: count,
      ip,
    });

    // Lock account if threshold exceeded
    if (count >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );

      await redis.set(
        getRedisKey(key, "locked"),
        lockedUntil.getTime().toString(),
        { ex: LOCKOUT_DURATION_MINUTES * 60 },
      );

      log.warn("Account locked due to too many failed attempts", {
        email,
        lockedUntil,
        attemptCount: count,
      });

      return {
        locked: true,
        lockedUntil,
        message: `Nalog je zaključan zbog previše neuspešnih pokušaja. Pokušaj ponovo posle ${LOCKOUT_DURATION_MINUTES} minuta.`,
      };
    }

    return {
      locked: false,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - count,
    };
  } else {
    // Fallback in-memory implementation (development only)
    const current = fallbackAttempts.get(key) || { count: 0 };
    current.count += 1;

    log.warn("Failed login attempt (in-memory fallback)", {
      email,
      attemptCount: current.count,
      ip,
    });

    // Lock account if threshold exceeded
    if (current.count >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
      current.lockedUntil = lockedUntil;

      log.warn("Account locked (in-memory fallback)", {
        email,
        lockedUntil,
        attemptCount: current.count,
      });

      fallbackAttempts.set(key, current);

      return {
        locked: true,
        lockedUntil,
        message: `Nalog je zaključan zbog previše neuspešnih pokušaja. Pokušaj ponovo posle ${LOCKOUT_DURATION_MINUTES} minuta.`,
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
 */
export async function isAccountLocked(email: string): Promise<{
  locked: boolean;
  lockedUntil?: Date;
  message?: string;
}> {
  const key = email.toLowerCase();

  if (redis) {
    // Redis implementation
    const lockedTimestamp = await redis.get<string>(getRedisKey(key, "locked"));

    if (!lockedTimestamp) {
      return { locked: false };
    }

    const lockedUntil = new Date(parseInt(lockedTimestamp, 10));

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
      message: `Nalog je zaključan. Pokušaj ponovo za ${minutesRemaining} minuta.`,
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
