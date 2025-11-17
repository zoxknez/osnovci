/**
 * Biometric Authentication Verification Endpoint
 * Authenticates user with saved biometric credentials
 */

import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { type NextRequest, NextResponse } from "next/server";
import {
  generateBiometricAuthenticationOptions,
  verifyBiometricAuthentication,
} from "@/lib/auth/biometric-server";
import { log } from "@/lib/logger";

/**
 * POST /api/auth/biometric/verify/challenge
 * Generate authentication challenge for existing biometric credentials
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Bad Request", message: "UserId je obavezan" },
        { status: 400 },
      );
    }

    // Generate authentication options
    const options = await generateBiometricAuthenticationOptions(userId);

    // Store challenge in cookie
    const response = NextResponse.json({
      success: true,
      options,
    });

    response.cookies.set("webauthn-auth-challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    log.info("Authentication challenge generated", { userId });

    return response;
  } catch (error) {
    log.error("Failed to generate authentication challenge", { error });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Greška pri generisanju challenge-a",
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
  try {
    // Get challenge from cookie
    const challenge = request.cookies.get("webauthn-auth-challenge")?.value;

    if (!challenge) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Challenge nije pronađen ili je istekao",
        },
        { status: 400 },
      );
    }

    // Get authentication response from client
    const body = await request.json();
    const authenticationResponse: AuthenticationResponseJSON = body.credential;

    if (!authenticationResponse) {
      return NextResponse.json(
        { error: "Bad Request", message: "Credential podaci nisu validni" },
        { status: 400 },
      );
    }

    // Verify authentication
    const result = await verifyBiometricAuthentication(
      authenticationResponse,
      challenge,
    );

    if (!result.success || !result.userId) {
      log.warn("Biometric authentication failed", {
        error: result.error,
      });

      return NextResponse.json(
        {
          error: "Authentication Failed",
          message: result.error || "Autentifikacija nije uspela",
        },
        { status: 401 },
      );
    }

    // Authentication successful - create session via NextAuth
    // Note: This is a simplified approach. In production, you'd want to:
    // 1. Generate JWT token manually
    // 2. Or integrate with NextAuth's session creation

    log.info("Biometric authentication successful", {
      userId: result.userId,
    });

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      userId: result.userId,
      message: "Uspešna prijava! 🎉",
    });

    response.cookies.delete("webauthn-auth-challenge");

    return response;
  } catch (error) {
    log.error("Failed to verify biometric authentication", { error });
    return NextResponse.json(
      { error: "Internal Server Error", message: "Greška pri verifikaciji" },
      { status: 500 },
    );
  }
}
