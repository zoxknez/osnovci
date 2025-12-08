/**
 * JWT Token Blacklist - Session Invalidation System
 * Critical Security Feature: Prevents stolen JWT access after logout
 *
 * Uses Redis for distributed blacklist with automatic expiration
 */

import { log } from "@/lib/logger";
import { redis } from "@/lib/upstash";

const BLACKLIST_PREFIX = "jwt:blacklist:";
const DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days (match JWT expiration)

interface BlacklistEntry {
  token: string;
  userId: string;
  reason:
    | "logout"
    | "security"
    | "password_change"
    | "2fa_enabled"
    | "admin_revoke";
  timestamp: number;
  expiresAt: number;
}

/**
 * Add JWT token to blacklist
 * Token will be automatically removed after expiration
 */
export async function blacklistToken(
  token: string,
  userId: string,
  reason: BlacklistEntry["reason"] = "logout",
  ttlSeconds: number = DEFAULT_TTL,
): Promise<boolean> {
  if (!redis) {
    log.error("Redis not available - cannot blacklist token", {
      userId,
      reason,
    });
    return false;
  }

  const key = `${BLACKLIST_PREFIX}${token}`;
  const entry: BlacklistEntry = {
    token,
    userId,
    reason,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000,
  };

  try {
    await redis.set(key, entry, { ex: ttlSeconds });

    log.info("JWT token blacklisted", {
      userId,
      reason,
      ttl: ttlSeconds,
      tokenPreview: token.substring(0, 16) + "...",
    });

    return true;
  } catch (error) {
    log.error("Failed to blacklist token", { error, userId });
    return false;
  }
}

/**
 * Check if JWT token is blacklisted
 * CRITICAL: Call this on EVERY authenticated request
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!redis) {
    // FALLBACK: Without Redis, we can't maintain blacklist
    // This is a security degradation - log warning
    log.warn("Redis unavailable - blacklist check skipped", {
      tokenPreview: token.substring(0, 16) + "...",
    });
    return false;
  }

  const key = `${BLACKLIST_PREFIX}${token}`;

  try {
    const entry = await redis.get<BlacklistEntry>(key);

    if (entry) {
      log.warn("Blacklisted token access attempt", {
        userId: entry.userId,
        reason: entry.reason,
        blacklistedAt: new Date(entry.timestamp).toISOString(),
      });
      return true;
    }

    return false;
  } catch (error) {
    log.error("Blacklist check failed", { error });
    // FAIL CLOSED: If check fails, treat as blacklisted for security
    return true;
  }
}

/**
 * Blacklist all user tokens (e.g., password change, account compromise)
 * This invalidates ALL sessions across ALL devices
 */
export async function blacklistAllUserTokens(
  userId: string,
  reason: BlacklistEntry["reason"] = "security",
): Promise<number> {
  if (!redis) {
    log.error("Redis not available - cannot blacklist user tokens", { userId });
    return 0;
  }

  try {
    // Get all active sessions for user from database
    const { prisma } = await import("@/lib/db/prisma");
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: { token: true },
    });

    // Blacklist each session token
    let blacklisted = 0;
    for (const session of sessions) {
      const success = await blacklistToken(session.token, userId, reason);
      if (success) blacklisted++;
    }

    // Also delete sessions from database
    await prisma.session.deleteMany({
      where: { userId },
    });

    log.info("All user tokens blacklisted", {
      userId,
      reason,
      count: blacklisted,
    });

    return blacklisted;
  } catch (error) {
    log.error("Failed to blacklist all user tokens", { error, userId });
    return 0;
  }
}

/**
 * Remove token from blacklist (rare - e.g., false positive)
 */
export async function removeFromBlacklist(token: string): Promise<boolean> {
  if (!redis) return false;

  const key = `${BLACKLIST_PREFIX}${token}`;

  try {
    await redis.del(key);
    log.info("Token removed from blacklist", {
      tokenPreview: token.substring(0, 16) + "...",
    });
    return true;
  } catch (error) {
    log.error("Failed to remove token from blacklist", { error });
    return false;
  }
}

/**
 * Get blacklist statistics (monitoring)
 */
export async function getBlacklistStats(): Promise<{
  totalBlacklisted: number;
  byReason: Record<string, number>;
}> {
  if (!redis) {
    return { totalBlacklisted: 0, byReason: {} };
  }

  try {
    const keys: string[] = [];
    let cursor = 0;

    // Scan for all blacklisted tokens
    do {
      const result = await redis.scan(cursor, {
        match: `${BLACKLIST_PREFIX}*`,
        count: 100,
      });

      cursor =
        typeof result[0] === "string" ? parseInt(result[0], 10) : result[0];
      keys.push(...result[1]);
    } while (cursor !== 0);

    // Get reason distribution
    const byReason: Record<string, number> = {};
    for (const key of keys) {
      const entry = await redis.get<BlacklistEntry>(key);
      if (entry) {
        byReason[entry.reason] = (byReason[entry.reason] || 0) + 1;
      }
    }

    return {
      totalBlacklisted: keys.length,
      byReason,
    };
  } catch (error) {
    log.error("Failed to get blacklist stats", { error });
    return { totalBlacklisted: 0, byReason: {} };
  }
}

/**
 * Cleanup expired blacklist entries (cron job)
 * Note: Redis automatically removes expired keys, but this provides manual cleanup
 */
export async function cleanupExpiredBlacklist(): Promise<number> {
  if (!redis) return 0;

  try {
    const keys: string[] = [];
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, {
        match: `${BLACKLIST_PREFIX}*`,
        count: 100,
      });

      cursor =
        typeof result[0] === "string" ? parseInt(result[0], 10) : result[0];
      keys.push(...result[1]);
    } while (cursor !== 0);

    // Check each entry for expiration
    let removed = 0;
    const now = Date.now();

    for (const key of keys) {
      const entry = await redis.get<BlacklistEntry>(key);
      if (entry && entry.expiresAt < now) {
        await redis.del(key);
        removed++;
      }
    }

    log.info("Expired blacklist entries cleaned up", { count: removed });
    return removed;
  } catch (error) {
    log.error("Failed to cleanup expired blacklist", { error });
    return 0;
  }
}
