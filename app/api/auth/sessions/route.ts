// Session Management API
// List active sessions, logout from specific device, logout all

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getUserSessions,
  invalidateAllUserSessions,
  invalidateSession,
} from "@/lib/auth/session-manager";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";

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

/**
 * GET /api/auth/sessions
 * List all active sessions for current user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani" },
        { status: 401 },
      );
    }

    const sessions = await getUserSessions(session.user.id);

    return NextResponse.json({
      success: true,
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
    log.error("GET /api/auth/sessions failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/sessions
 * Logout from specific session or all sessions
 */
export async function DELETE(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { sessionId, logoutAll } = body;

    if (logoutAll === true) {
      // Logout from all devices
      const count = await invalidateAllUserSessions(session.user.id);

      log.info("User logged out from all devices", {
        userId: session.user.id,
        sessionCount: count,
      });

      return NextResponse.json({
        success: true,
        message: `Odjavljen sa ${count} uređaja`,
        count,
      });
    } else if (sessionId) {
      // Logout from specific device
      await invalidateSession(sessionId);

      log.info("User logged out from specific device", {
        userId: session.user.id,
        sessionId,
      });

      return NextResponse.json({
        success: true,
        message: "Odjavljen sa uređaja",
      });
    } else {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "sessionId ili logoutAll je obavezan",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    log.error("DELETE /api/auth/sessions failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
