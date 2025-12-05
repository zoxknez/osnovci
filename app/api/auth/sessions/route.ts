// Session Management API
// List active sessions, logout from specific device, logout all

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  getUserSessions,
  invalidateAllUserSessions,
  invalidateSession,
} from "@/lib/auth/session-manager";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

// Types
type SessionFromDB = {
  id: string;
  deviceType: string | null;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
};

// Validation schemas
const deleteSessionSchema = z
  .object({
    sessionId: z.string().optional(),
    logoutAll: z.boolean().optional(),
  })
  .refine((data) => data.sessionId || data.logoutAll, {
    message: "sessionId ili logoutAll je obavezan",
  });

/**
 * GET /api/auth/sessions
 * List all active sessions for current user
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "sessions-list",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    const sessions = await getUserSessions(session.user.id);

    return NextResponse.json({
      success: true,
      requestId,
      sessions: sessions.map((s: SessionFromDB) => ({
        id: s.id,
        deviceType: s.deviceType,
        deviceName: s.deviceName,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
        expiresAt: s.expiresAt,
      })),
    });
  } catch (error) {
    log.error("GET /api/auth/sessions failed", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri učitavanju sesija", requestId },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/sessions
 * Logout from specific session or all sessions
 */
export async function DELETE(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "sessions-delete",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Zabranjeno", message: csrfResult.error, requestId },
        { status: 403 },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validated = deleteSessionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: validated.error.issues[0]?.message || "Nevažeći podaci",
          requestId,
        },
        { status: 400 },
      );
    }

    const { sessionId, logoutAll } = validated.data;

    if (logoutAll === true) {
      // Logout from all devices
      const count = await invalidateAllUserSessions(session.user.id);

      log.info("User logged out from all devices", {
        userId: session.user.id,
        sessionCount: count,
        requestId,
      });

      // COPPA: Log security action
      await logActivity({
        userId: session.user.id,
        type: "SECURITY_CHANGE",
        description: `Odjava sa svih uređaja (${count} sesija)`,
        request,
      });

      return NextResponse.json({
        success: true,
        requestId,
        message: `Odjavljen sa ${count} uređaja`,
        count,
      });
    }

    if (sessionId) {
      // Logout from specific device
      await invalidateSession(sessionId);

      log.info("User logged out from specific device", {
        userId: session.user.id,
        sessionId,
        requestId,
      });

      // COPPA: Log security action
      await logActivity({
        userId: session.user.id,
        type: "SECURITY_CHANGE",
        description: "Odjava sa uređaja",
        request,
      });

      return NextResponse.json({
        success: true,
        requestId,
        message: "Odjavljen sa uređaja",
      });
    }

    return NextResponse.json(
      { error: "sessionId ili logoutAll je obavezan", requestId },
      { status: 400 },
    );
  } catch (error) {
    log.error("DELETE /api/auth/sessions failed", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri odjavi", requestId },
      { status: 500 },
    );
  }
}
