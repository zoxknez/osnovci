/**
 * Biometric Authentication Challenge Endpoint
 * Generates WebAuthn challenge for registration or authentication
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { generateBiometricRegistrationOptions } from "@/lib/auth/biometric-server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

/**
 * POST /api/auth/biometric/challenge
 * Generate challenge for biometric registration
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "biometric-challenge",
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
        {
          error: "Niste prijavljeni",
          message: "Morate biti ulogovani",
          requestId,
        },
        { status: 401 },
      );
    }

    const { email, id } = session.user;
    const userName = email || `user-${id}`;

    // Generate registration options
    const options = await generateBiometricRegistrationOptions(id, userName);

    // Store challenge in session/cookie for verification later
    // In production, use Redis or encrypted session storage
    const response = NextResponse.json({
      success: true,
      requestId,
      options,
    });

    // Store challenge in HTTP-only cookie (expires in 5 minutes)
    response.cookies.set("webauthn-challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    log.info("Biometric challenge generated", {
      userId: id,
      userName,
      requestId,
    });

    // COPPA: Log biometric setup initiation
    await logActivity({
      userId: id,
      type: "SECURITY_CHANGE",
      description: "Pokrenuto podešavanje biometrijske autentifikacije",
      request,
    });

    return response;
  } catch (error) {
    log.error("Failed to generate biometric challenge", { error, requestId });
    return NextResponse.json(
      {
        error: "Greška pri generisanju challenge-a",
        requestId,
      },
      { status: 500 },
    );
  }
}
