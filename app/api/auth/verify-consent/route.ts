// Verify Parental Consent API
// Verifies 6-digit code from parental consent email

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyConsentCode } from "@/lib/auth/parental-consent";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

const verifyConsentSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "Kod mora biti 6 cifara"),
});

export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate Limiting - Strict (prevent brute force)
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "consent-verify",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          error: "Previše pokušaja. Pokušaj ponovo za par minuta.",
          requestId,
        },
        { status: 429, headers },
      );
    }

    const body = await request.json();
    const validated = verifyConsentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Nevažeći kod",
          details: validated.error.flatten(),
          requestId,
        },
        { status: 400 },
      );
    }

    const { code } = validated.data;

    // Get IP address and user agent for tracking
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Verify consent code using database lookup
    const verificationResult = await verifyConsentCode({
      code,
      ipAddress,
      userAgent,
    });

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          error: "Kod nije validan",
          message: verificationResult.error || "Verifikacija nije uspela.",
          requestId,
        },
        { status: 400 },
      );
    }

    log.info("Parental consent verified successfully", {
      studentId: verificationResult.studentId,
      requestId,
    });

    // COPPA: Log parental consent verification
    if (verificationResult.studentId) {
      await logActivity({
        userId: verificationResult.studentId,
        type: "PARENTAL_CONSENT",
        description: "Roditeljska saglasnost uspešno verifikovana",
        request,
      });
    }

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: "Saglasnost uspešno verifikovana!",
        student: {
          id: verificationResult.studentId,
          name: verificationResult.studentName,
          active: true,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    log.error("Consent verification failed", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri verifikaciji saglasnosti", requestId },
      { status: 500 },
    );
  }
}
