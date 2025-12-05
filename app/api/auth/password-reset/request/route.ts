/**
 * Password Reset Request API
 * POST /api/auth/password-reset/request
 *
 * Šalje email za resetovanje lozinke
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAndSendPasswordResetEmail } from "@/lib/auth/password-reset";
import { log } from "@/lib/logger";
import { strictRateLimit } from "@/lib/upstash";

// Validation schema
const requestSchema = z.object({
  email: z.string().email("Unesite validnu email adresu"),
});

// Mask email for logging
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const maskedLocal =
    local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : "***";
  return `${maskedLocal}@${domain}`;
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // 1. Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    if (strictRateLimit) {
      const { success } = await strictRateLimit.limit(`password-reset-${ip}`);
      if (!success) {
        log.warn("Rate limit exceeded for password reset", { ip, requestId });
        return NextResponse.json(
          { error: "Previše zahteva. Pokušajte ponovo za minut.", requestId },
          { status: 429 },
        );
      }
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Nevažeći podaci", requestId },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    log.info("Password reset requested", {
      email: maskEmail(email),
      requestId,
    });

    // 3. Send password reset email
    // Note: Always returns success to prevent email enumeration
    await createAndSendPasswordResetEmail(email);

    return NextResponse.json({
      success: true,
      requestId,
      message:
        "Ako nalog sa ovim emailom postoji, poslaćemo vam link za resetovanje lozinke.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Password reset request failed", {
      error: errorMessage,
      requestId,
    });

    // Still return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      requestId,
      message:
        "Ako nalog sa ovim emailom postoji, poslaćemo vam link za resetovanje lozinke.",
    });
  }
}
