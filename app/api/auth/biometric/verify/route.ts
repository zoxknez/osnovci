/**
 * Biometric Authentication Verification Endpoint
 * Authenticates user with saved biometric credentials
 */

import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateBiometricAuthenticationOptions,
  verifyBiometricAuthentication,
} from "@/lib/auth/biometric-server";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

const challengeSchema = z.object({
  userId: z.string().min(1, "UserId je obavezan"),
});

const verifySchema = z.object({
  credential: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
  }),
});

/**
 * GET /api/auth/biometric/verify
 * Generate authentication challenge for existing biometric credentials
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "biometric-auth-challenge",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const validated = challengeSchema.safeParse({ userId });
    if (!validated.success) {
      return NextResponse.json(
        { error: "UserId je obavezan", requestId },
        { status: 400 },
      );
    }

    // Generate authentication options
    const options = await generateBiometricAuthenticationOptions(
      validated.data.userId,
    );

    // Store challenge in cookie
    const response = NextResponse.json({
      success: true,
      requestId,
      options,
    });

    response.cookies.set("webauthn-auth-challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    log.info("Authentication challenge generated", {
      userId: validated.data.userId,
      requestId,
    });

    return response;
  } catch (error) {
    log.error("Failed to generate authentication challenge", {
      error,
      requestId,
    });
    return NextResponse.json(
      {
        error: "Greška pri generisanju challenge-a",
        requestId,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/biometric/verify
 * Verify biometric authentication and create session
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Strict rate limiting - prevent brute force
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "biometric-verify",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          error: "Previše pokušaja. Pokušajte ponovo za par minuta.",
          requestId,
        },
        { status: 429, headers },
      );
    }

    // Get challenge from cookie
    const challenge = request.cookies.get("webauthn-auth-challenge")?.value;

    if (!challenge) {
      return NextResponse.json(
        {
          error: "Challenge nije pronađen ili je istekao",
          requestId,
        },
        { status: 400 },
      );
    }

    // Get and validate authentication response from client
    const body = await request.json();
    const validated = verifySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nevažeći credential podaci", requestId },
        { status: 400 },
      );
    }

    const authenticationResponse = validated.data
      .credential as AuthenticationResponseJSON;

    // Verify authentication
    const result = await verifyBiometricAuthentication(
      authenticationResponse,
      challenge,
    );

    if (!result.success || !result.userId) {
      log.warn("Biometric authentication failed", {
        error: result.error,
        requestId,
      });

      return NextResponse.json(
        {
          error: "Autentifikacija nije uspela",
          message: result.error || "Autentifikacija nije uspela",
          requestId,
        },
        { status: 401 },
      );
    }

    // Authentication successful
    log.info("Biometric authentication successful", {
      userId: result.userId,
      requestId,
    });

    // COPPA: Log biometric login
    await logActivity({
      userId: result.userId,
      type: "LOGIN",
      description: "Uspešna biometrijska prijava",
      request,
    });

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      userId: result.userId,
      requestId,
      message: "Uspešna prijava! 🎉",
    });

    response.cookies.delete("webauthn-auth-challenge");

    return response;
  } catch (error) {
    log.error("Failed to verify biometric authentication", {
      error,
      requestId,
    });
    return NextResponse.json(
      { error: "Greška pri verifikaciji", requestId },
      { status: 500 },
    );
  }
}
