/**
 * Biometric Registration Endpoint
 * Verifies and saves biometric credentials (Face ID, Touch ID, Windows Hello)
 */

import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAndSaveBiometricCredential } from "@/lib/auth/biometric-server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";

/**
 * POST /api/auth/biometric/register
 * Verify and save biometric credential after successful registration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani" },
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

    // Get registration response from client
    const body = await request.json();
    const registrationResponse: RegistrationResponseJSON = body.credential;

    if (!registrationResponse) {
      return NextResponse.json(
        { error: "Bad Request", message: "Credential podaci nisu validni" },
        { status: 400 },
      );
    }

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
      });

      return NextResponse.json(
        {
          error: "Verification Failed",
          message: result.error || "Verifikacija nije uspela",
        },
        { status: 400 },
      );
    }

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      message: "Biometrijska autentifikacija uspešno podešena! 🎉",
    });

    response.cookies.delete("webauthn-challenge");

    log.info("Biometric registration successful", {
      userId: session.user.id,
    });

    return response;
  } catch (error) {
    log.error("Failed to register biometric credential", { error });
    return NextResponse.json(
      { error: "Internal Server Error", message: "Greška pri registraciji" },
      { status: 500 },
    );
  }
}
