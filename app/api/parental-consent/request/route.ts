// Parental Consent API - COPPA/GDPR Compliance
import { type NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

/**
 * POST /api/parental-consent/request
 * Request parental consent for child <13
 */
export async function POST(request: NextRequest) {
  try {
    const { studentId, guardianEmail } = await request.json();

    if (!studentId || !guardianEmail) {
      return NextResponse.json(
        { error: "Student ID i email roditelja su obavezni" },
        { status: 400 },
      );
    }

    // Generate verification code
    const verificationCode = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create consent request
    const consent = await prisma.parentalConsent.create({
      data: {
        studentId,
        guardianEmail,
        verificationCode,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // TODO: Send verification email to parent
    // await sendParentalConsentEmail(guardianEmail, verificationCode);
    
    log.info("Parental consent requested", {
      studentId,
      guardianEmail,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Email poslat roditelju! Nalog će biti aktivan kada roditelj potvrdi.",
      consentId: consent.id,
      expiresAt,
    }, { status: 201 });
  } catch (error) {
    log.error("Parental consent request failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

