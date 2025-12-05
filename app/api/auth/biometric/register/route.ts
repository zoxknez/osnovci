/**
 * Biometric Registration Endpoint
 * Verifies and saves biometric credentials (Face ID, Touch ID, Windows Hello)
 */

import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAndSaveBiometricCredential } from "@/lib/auth/biometric-server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

const registerSchema = z.object({
  credential: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
  }),
});

/**
 * POST /api/auth/biometric/register
 * Verify and save biometric credential after successful registration
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "biometric-register",
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

    // Get challenge from cookie
    const challenge = request.cookies.get("webauthn-challenge")?.value;

    if (!challenge) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Challenge nije pronađen ili je istekao",
        },
        { status: 400 },
      );
    }

    // Get and validate registration response from client
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Nevažeći podaci",
          message: "Credential podaci nisu validni",
          requestId,
        },
        { status: 400 },
      );
    }

    const registrationResponse = validated.data
      .credential as RegistrationResponseJSON;

    // Verify and save credential
    const result = await verifyAndSaveBiometricCredential(
      session.user.id,
      registrationResponse,
      challenge,
    );

    if (!result.success) {
      log.warn("Biometric registration failed", {
        userId: session.user.id,
        error: result.error,
        requestId,
      });

      return NextResponse.json(
        {
          error: "Verifikacija nije uspela",
          message: result.error || "Verifikacija nije uspela",
          requestId,
        },
        { status: 400 },
      );
    }

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      requestId,
      message: "Biometrijska autentifikacija uspešno podešena! 🎉",
    });

    response.cookies.delete("webauthn-challenge");

    log.info("Biometric registration successful", {
      userId: session.user.id,
      requestId,
    });

    // COPPA: Log security-sensitive action
    await logActivity({
      userId: session.user.id,
      type: "SECURITY_CHANGE",
      description: "Biometrijska autentifikacija uspešno registrovana",
      request,
    });

    return response;
  } catch (error) {
    log.error("Failed to register biometric credential", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri registraciji", requestId },
      { status: 500 },
    );
  }
}
