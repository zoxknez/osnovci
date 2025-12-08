/**
 * Stateless Session Management
 * Enables horizontal scaling by storing sessions in Redis
 */

import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";
import { log } from "@/lib/logger";

// Initialize Redis client
const redis = new Redis({
  url: process.env["UPSTASH_REDIS_REST_URL"]!,
  token: process.env["UPSTASH_REDIS_REST_TOKEN"]!,
});

// Session configuration
const SESSION_PREFIX = "session:";
const SESSION_TTL = 24 * 60 * 60; // 24 hours
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
}

export interface RefreshToken {
  userId: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Create new session
 */
export async function createSession(
  userId: string,
  email: string,
  role: string,
  ipAddress: string,
  userAgent: string,
  deviceId?: string,
): Promise<string> {
  const sessionId = uuidv4();

  const sessionData: SessionData = {
    userId,
    email,
    role,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ipAddress,
    userAgent,
    ...(deviceId && { deviceId }),
  };

  await redis.setex(
    `${SESSION_PREFIX}${sessionId}`,
    SESSION_TTL,
    JSON.stringify(sessionData),
  );

  log.info("Session created", { sessionId, userId });
  return sessionId;
}

/**
 * Get session data
 */
export async function getSession(
  sessionId: string,
): Promise<SessionData | null> {
  try {
    const data = await redis.get<string>(`${SESSION_PREFIX}${sessionId}`);

    if (!data) {
      return null;
    }

    const session = JSON.parse(data) as SessionData;

    // Update last activity
    session.lastActivity = Date.now();
    await redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );

    return session;
  } catch (error) {
    log.error("Failed to get session", error as Error, { sessionId });
    return null;
  }
}

/**
 * Update session data
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<SessionData>,
): Promise<boolean> {
  try {
    const session = await getSession(sessionId);

    if (!session) {
      return false;
    }

    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: Date.now(),
    };

    await redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(updatedSession),
    );

    log.info("Session updated", { sessionId, updates: Object.keys(updates) });
    return true;
  } catch (error) {
    log.error("Failed to update session", error as Error, { sessionId });
    return false;
  }
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
    log.info("Session deleted", { sessionId });
  } catch (error) {
    log.error("Failed to delete session", error as Error, { sessionId });
  }
}

/**
 * Get all sessions for user
 */
export async function getUserSessions(
  userId: string,
): Promise<Array<SessionData & { sessionId: string }>> {
  try {
    const keys = await redis.keys(`${SESSION_PREFIX}*`);
    const sessions: Array<SessionData & { sessionId: string }> = [];

    for (const key of keys) {
      const data = await redis.get<string>(key);
      if (data) {
        const session = JSON.parse(data) as SessionData;
        if (session.userId === userId) {
          sessions.push({
            ...session,
            sessionId: key.replace(SESSION_PREFIX, ""),
          });
        }
      }
    }

    return sessions;
  } catch (error) {
    log.error("Failed to get user sessions", error as Error, { userId });
    return [];
  }
}

/**
 * Delete all sessions for user
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  try {
    const sessions = await getUserSessions(userId);

    for (const session of sessions) {
      await deleteSession(session.sessionId);
    }

    log.info("All user sessions deleted", { userId, count: sessions.length });
  } catch (error) {
    log.error("Failed to delete user sessions", error as Error, { userId });
  }
}

/**
 * Check if session is active
 */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  return session !== null;
}

/**
 * Extend session TTL
 */
export async function extendSession(sessionId: string): Promise<boolean> {
  try {
    const session = await getSession(sessionId);

    if (!session) {
      return false;
    }

    await redis.expire(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL);
    log.info("Session extended", { sessionId });
    return true;
  } catch (error) {
    log.error("Failed to extend session", error as Error, { sessionId });
    return false;
  }
}

// ============================================
// REFRESH TOKEN MANAGEMENT
// ============================================

const REFRESH_TOKEN_PREFIX = "refresh:";

/**
 * Create refresh token
 */
export async function createRefreshToken(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent: string,
): Promise<string> {
  const tokenId = uuidv4();

  const refreshToken: RefreshToken = {
    userId,
    sessionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + REFRESH_TOKEN_TTL * 1000,
    ipAddress,
    userAgent,
  };

  await redis.setex(
    `${REFRESH_TOKEN_PREFIX}${tokenId}`,
    REFRESH_TOKEN_TTL,
    JSON.stringify(refreshToken),
  );

  log.info("Refresh token created", { tokenId, userId });
  return tokenId;
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(
  tokenId: string,
): Promise<RefreshToken | null> {
  try {
    const data = await redis.get<string>(`${REFRESH_TOKEN_PREFIX}${tokenId}`);

    if (!data) {
      return null;
    }

    const token = JSON.parse(data) as RefreshToken;

    // Check if expired
    if (token.expiresAt < Date.now()) {
      await redis.del(`${REFRESH_TOKEN_PREFIX}${tokenId}`);
      return null;
    }

    return token;
  } catch (error) {
    log.error("Failed to verify refresh token", error as Error, { tokenId });
    return null;
  }
}

/**
 * Delete refresh token
 */
export async function deleteRefreshToken(tokenId: string): Promise<void> {
  try {
    await redis.del(`${REFRESH_TOKEN_PREFIX}${tokenId}`);
    log.info("Refresh token deleted", { tokenId });
  } catch (error) {
    log.error("Failed to delete refresh token", error as Error, { tokenId });
  }
}

// ============================================
// SESSION ANALYTICS
// ============================================

/**
 * Get active sessions count
 */
export async function getActiveSessionsCount(): Promise<number> {
  try {
    const keys = await redis.keys(`${SESSION_PREFIX}*`);
    return keys.length;
  } catch (error) {
    log.error("Failed to get active sessions count", error as Error);
    return 0;
  }
}

/**
 * Get sessions by device type
 */
export async function getSessionsByDevice(): Promise<{
  desktop: number;
  mobile: number;
  tablet: number;
  unknown: number;
}> {
  try {
    const keys = await redis.keys(`${SESSION_PREFIX}*`);
    const stats = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      unknown: 0,
    };

    for (const key of keys) {
      const data = await redis.get<string>(key);
      if (data) {
        const session = JSON.parse(data) as SessionData;
        const ua = session.userAgent.toLowerCase();

        if (ua.includes("mobile")) {
          stats.mobile++;
        } else if (ua.includes("tablet")) {
          stats.tablet++;
        } else if (
          ua.includes("windows") ||
          ua.includes("mac") ||
          ua.includes("linux")
        ) {
          stats.desktop++;
        } else {
          stats.unknown++;
        }
      }
    }

    return stats;
  } catch (error) {
    log.error("Failed to get sessions by device", error as Error);
    return { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
  }
}

/**
 * Clean up expired sessions (for maintenance)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const keys = await redis.keys(`${SESSION_PREFIX}*`);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await redis.ttl(key);

      // If no TTL or expired, delete
      if (ttl === -1 || ttl === -2) {
        await redis.del(key);
        cleaned++;
      }
    }

    log.info("Expired sessions cleaned", { count: cleaned });
    return cleaned;
  } catch (error) {
    log.error("Failed to cleanup expired sessions", error as Error);
    return 0;
  }
}
