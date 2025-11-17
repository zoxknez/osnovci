/**
 * Biometric Authentication Challenge Endpoint
 * Generates WebAuthn challenge for registration or authentication
 */

import { NextResponse } from "next/server";
import { generateBiometricRegistrationOptions } from "@/lib/auth/biometric-server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";

/**
 * POST /api/auth/biometric/challenge
 * Generate challenge for biometric registration
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani" },
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
    });

    return response;
  } catch (error) {
    log.error("Failed to generate biometric challenge", { error });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Greška pri generisanju challenge-a",
      },
      { status: 500 },
    );
  }
}
