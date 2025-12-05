/**
 * API Route: Sync
 * Background sync za PWA offline podatke
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { syncHomeworkAction } from "@/app/actions/homework";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // CSRF protection
    const csrfResult = await csrfMiddleware(request);
    if (csrfResult) {
      return NextResponse.json(
        { error: "Neispravan CSRF token", requestId },
        { status: 403 },
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "sync",
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

    const body = await request.json();
    const { action, entity, data } = body;

    if (!action || !entity || !data) {
      return NextResponse.json(
        { error: "Nedostaju podaci", requestId },
        { status: 400 },
      );
    }

    log.info("Sync request received", { action, entity, requestId });

    let result: { error?: string; data?: unknown };

    if (entity === "homework") {
      const syncType = action.toUpperCase() as "CREATE" | "UPDATE" | "DELETE";
      result = await syncHomeworkAction({
        type: syncType,
        data: data,
      });
    } else if (entity === "note") {
      // Notes are just updates to homework
      result = await syncHomeworkAction({
        type: "UPDATE",
        data: {
          id: data.homeworkId,
          notes: data.notes,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Nepoznat entitet", requestId },
        { status: 400 },
      );
    }

    if (result.error) {
      log.error("Sync failed", { error: result.error, requestId });
      return NextResponse.json(
        { error: result.error, requestId },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      requestId,
      data: result.data,
    });
  } catch (error) {
    log.error("Sync API error", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri sinhronizaciji", requestId },
      { status: 500 },
    );
  }
}
