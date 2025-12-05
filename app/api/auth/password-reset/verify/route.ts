/**
 * Password Reset Verify API
 * POST /api/auth/password-reset/verify
 *
 * Verifikuje token za resetovanje lozinke
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPasswordResetToken } from "@/lib/auth/password-reset";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

// Validation schema
const verifySchema = z.object({
  token: z.string().min(1, "Token je obavezan"),
});

export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "password-reset-verify",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { valid: false, error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }
    // 1. Parse and validate body
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        {
          valid: false,
          error: firstError?.message || "Nevažeći podaci",
          requestId,
        },
        { status: 400 },
      );
    }

    const { token } = validation.data;

    log.debug("Verifying password reset token", { requestId });

    // 2. Verify token
    const result = await verifyPasswordResetToken(token);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error,
          requestId,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      requestId,
      // Only return masked email hint, not full email
      emailHint: result.email
        ? `${result.email[0]}***@${result.email.split("@")[1]}`
        : undefined,
      userName: result.userName,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Password reset token verification failed", {
      error: errorMessage,
      requestId,
    });

    return NextResponse.json(
      {
        valid: false,
        error: "Greška pri verifikaciji. Pokušajte ponovo.",
        requestId,
      },
      { status: 500 },
    );
  }
}
