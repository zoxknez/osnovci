// Guardian PIN Management API

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  hasParentPIN,
  setParentPIN,
  verifyParentPIN,
} from "@/lib/auth/parental-lock";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

const setPinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN mora biti 4-6 cifara"),
  currentPin: z.string().optional(), // Za promenu postojećeg PIN-a
});

/**
 * POST /api/guardian/pin/set
 * Set or update guardian PIN
 */
export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "guardian:pin:set",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Previše pokušaja. Pokušaj ponovo za par minuta.",
        },
        { status: 429, headers },
      );
    }

    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani" },
        { status: 401 },
      );
    }

    // Get guardian
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { guardian: true },
    });

    if (!user?.guardian) {
      return NextResponse.json(
        { error: "Forbidden", message: "Samo roditelji mogu postaviti PIN" },
        { status: 403 },
      );
    }

    // Parse body
    const body = await request.json();
    const validated = setPinSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const { pin, currentPin } = validated.data;

    // If guardian already has PIN, verify current PIN first
    if (await hasParentPIN(user.guardian.id)) {
      if (!currentPin) {
        return NextResponse.json(
          {
            error: "Current PIN Required",
            message: "Morate uneti trenutni PIN za promenu",
          },
          { status: 400 },
        );
      }

      const isCurrentValid = await verifyParentPIN(
        currentPin,
        user.guardian.id,
      );
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Invalid PIN", message: "Trenutni PIN nije tačan" },
          { status: 401 },
        );
      }
    }

    // Set new PIN
    const result = await setParentPIN(user.guardian.id, pin);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed", message: result.error },
        { status: 400 },
      );
    }

    log.info("Guardian PIN set/updated", {
      guardianId: user.guardian.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "PIN je uspešno postavljen",
    });
  } catch (error) {
    log.error("POST /api/guardian/pin failed", { error });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Greška pri postavljanju PIN-a",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/guardian/pin/status
 * Check if guardian has PIN set
 */
export async function GET() {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani" },
        { status: 401 },
      );
    }

    // Get guardian
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { guardian: true },
    });

    if (!user?.guardian) {
      return NextResponse.json(
        { error: "Forbidden", message: "Samo roditelji imaju PIN" },
        { status: 403 },
      );
    }

    const hasPIN = await hasParentPIN(user.guardian.id);

    return NextResponse.json({
      success: true,
      hasPIN,
    });
  } catch (error) {
    log.error("GET /api/guardian/pin/status failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
