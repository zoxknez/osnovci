/**
 * Session Management - Track JWT sessions in database
 * Enables session invalidation and multi-device logout
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

interface DeviceInfo {
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate unique session token using Web Crypto API
 * Edge-compatible alternative to Node.js crypto module
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without Web Crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Parse user agent to extract device info
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Device type detection
  let deviceType = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    deviceType = "mobile";
  }

  // Browser detection
  let browser = "Unknown";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";
  else if (ua.includes("opera")) browser = "Opera";

  // OS detection
  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  // Device name
  let deviceName = `${browser} on ${os}`;
  if (deviceType === "mobile") {
    if (ua.includes("iphone")) deviceName = "iPhone";
    else if (ua.includes("ipad")) deviceName = "iPad";
    else if (ua.includes("android")) deviceName = "Android Device";
  }

  return {
    deviceType,
    deviceName,
    browser,
    os,
    userAgent,
  };
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: NextRequest | Request): string {
  // Try various headers (for proxies/load balancers)
  const headers = request.headers;

  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0] ||
    headers.get("cf-connecting-ip") || // Cloudflare
    "unknown"
  );
}

/**
 * Create new session in database
 */
export async function createSession(
  userId: string,
  request?: NextRequest | Request,
  expiresInDays = 7,
): Promise<{ sessionToken: string; sessionId: string }> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  let deviceInfo: DeviceInfo = {};
  let ipAddress = "unknown";

  if (request) {
    const userAgent = request.headers.get("user-agent") || "";
    deviceInfo = parseUserAgent(userAgent);
    ipAddress = getIpAddress(request);
  }

  const session = await prisma.session.create({
    data: {
      userId,
      token: sessionToken,
      expiresAt,
      ...(deviceInfo.deviceType && { deviceType: deviceInfo.deviceType }),
      ...(deviceInfo.deviceName && { deviceName: deviceInfo.deviceName }),
      ...(deviceInfo.browser && { browser: deviceInfo.browser }),
      ...(deviceInfo.os && { os: deviceInfo.os }),
      ipAddress,
      ...(deviceInfo.userAgent && { userAgent: deviceInfo.userAgent }),
    },
  });

  log.info("Session created", {
    userId,
    sessionId: session.id,
    deviceType: deviceInfo.deviceType,
    deviceName: deviceInfo.deviceName,
  });

  return {
    sessionToken,
    sessionId: session.id,
  };
}

/**
 * Validate session token
 */
export async function validateSession(
  sessionToken: string,
): Promise<{ valid: boolean; userId?: string; sessionId?: string }> {
  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!session) {
      return { valid: false };
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      // Session expired - delete it
      await prisma.session.delete({ where: { id: session.id } });
      log.info("Session expired and deleted", { sessionId: session.id });
      return { valid: false };
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return {
      valid: true,
      userId: session.userId,
      sessionId: session.id,
    };
  } catch (error) {
    log.error("Session validation error", { error });
    return { valid: false };
  }
}

/**
 * Invalidate specific session (logout from one device)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    await prisma.session.delete({ where: { id: sessionId } });
    log.info("Session invalidated", { sessionId });
  } catch (error) {
    log.error("Failed to invalidate session", { error, sessionId });
  }
}

/**
 * Invalidate all user sessions (logout from all devices)
 */
export async function invalidateAllUserSessions(
  userId: string,
): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: { userId },
    });

    log.info("All user sessions invalidated", {
      userId,
      count: result.count,
    });

    return result.count;
  } catch (error) {
    log.error("Failed to invalidate all sessions", { error, userId });
    return 0;
  }
}

/**
 * Get all active sessions for user
 */
export async function getUserSessions(userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Only active sessions
      },
      select: {
        id: true,
        deviceType: true,
        deviceName: true,
        browser: true,
        os: true,
        ipAddress: true,
        createdAt: true,
        lastActivityAt: true,
        expiresAt: true,
      },
      orderBy: { lastActivityAt: "desc" },
    });

    return sessions;
  } catch (error) {
    log.error("Failed to get user sessions", { error, userId });
    return [];
  }
}

/**
 * Cleanup expired sessions (run as cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    log.info("Expired sessions cleaned up", { count: result.count });
    return result.count;
  } catch (error) {
    log.error("Failed to cleanup expired sessions", { error });
    return 0;
  }
}

/**
 * Get session by token (for current session identification)
 */
export async function getSessionByToken(token: string) {
  try {
    return await prisma.session.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        deviceType: true,
        deviceName: true,
        createdAt: true,
        lastActivityAt: true,
      },
    });
  } catch (error) {
    log.error("Failed to get session by token", { error });
    return null;
  }
}
