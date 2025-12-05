// app/api/auth/verify-email/route.ts (Security Enhanced!)
/**
 * Email Verification Endpoint
 *
 * GET /api/auth/verify-email?token=XXX
 *   └─ Verificiraj email sa token-om
 *   └─ Redirect na success ili error stranicu
 *
 * POST /api/auth/verify-email
 *   └─ Resend verification email
 *   └─ Body: { email: "user@example.com" }
 */

import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  resendVerificationEmail,
  verifyEmailToken,
} from "@/lib/auth/email-verification";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { emailSchema } from "@/lib/security/validators";

// Mask email for logging
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const maskedLocal =
    local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : "***";
  return `${maskedLocal}@${domain}`;
}

/**
 * GET /api/auth/verify-email?token=XXX
 *
 * User je kliknuo link iz email-a
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting for GET
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "verify-email-get",
    });

    if (!rateLimitResult.success) {
      return NextResponse.redirect(
        new URL("/auth/verify-error?reason=too_many_requests", request.url),
      );
    }

    // 1. Proveri token
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      log.warn("Verify email endpoint called without token", { requestId });

      return NextResponse.redirect(
        new URL("/auth/verify-error?reason=no_token", request.url),
      );
    }

    log.info("Email verification attempt", {
      tokenLength: token.length,
      requestId,
    });

    // 2. Verificiraj token
    const result = await verifyEmailToken(token);

    // 3. Preusmeravaj na success stranicu
    return NextResponse.redirect(
      new URL(
        `/auth/verify-success?email=${encodeURIComponent(result.email)}`,
        request.url,
      ),
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Email verification failed", { error: errorMessage, requestId });

    // Preusmeravaj na error stranicu
    return NextResponse.redirect(
      new URL(
        `/auth/verify-error?reason=${encodeURIComponent(errorMessage)}`,
        request.url,
      ),
    );
  }
}

/**
 * POST /api/auth/verify-email
 *
 * Resend verification email
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate Limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "verify-email-resend",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          success: false,
          error: "Previše zahteva. Pokušaj ponovo za par minuta.",
          requestId,
        },
        { status: 429, headers },
      );
    }

    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Zabranjeno",
          message: csrfResult.error,
          requestId,
        },
        { status: 403 },
      );
    }

    // 1. Validiraj request body
    const body = await request.json();

    const schema = z.object({
      email: emailSchema, // Use enhanced email validation
    });

    const validated = schema.safeParse(body);

    if (!validated.success) {
      log.warn("Invalid resend email request", {
        errors: validated.error.flatten(),
        requestId,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Nevažeća email adresa",
          details: validated.error.flatten(),
          requestId,
        },
        { status: 400 },
      );
    }

    const { email } = validated.data;

    log.info("Resend verification email request", {
      email: maskEmail(email),
      requestId,
    });

    // 2. Resend email
    await resendVerificationEmail(email);

    log.info("Verification email resent", {
      email: maskEmail(email),
      requestId,
    });

    // 3. Vrati success
    return NextResponse.json(
      {
        success: true,
        requestId,
        message: "Email za verifikaciju poslat",
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Resend verification email failed", {
      error: errorMessage,
      requestId,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        requestId,
      },
      { status: 400 },
    );
  }
}
