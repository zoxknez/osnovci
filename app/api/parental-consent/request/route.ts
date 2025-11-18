// Parental Consent API - COPPA/GDPR Compliance (Security Enhanced!)

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import { emailSchema, idSchema } from "@/lib/security/validators";

/**
 * POST /api/parental-consent/request
 * Request parental consent for child <13
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Enhanced validation
    const studentId = idSchema.parse(body.studentId);
    const guardianEmail = emailSchema.parse(body.guardianEmail);

    if (!studentId || !guardianEmail) {
      return NextResponse.json(
        { error: "Student ID i email roditelja su obavezni" },
        { status: 400 },
      );
    }

    // Use new consent system
    const { createConsentRequest } = await import("@/lib/auth/parental-consent");
    
    const result = await createConsentRequest({
      studentId,
      parentEmail: guardianEmail,
      expiresInHours: 6, // 6 hours instead of 7 days
    });

    if (!result.success || !result.code) {
      return NextResponse.json(
        { error: result.error || "Failed to create consent request" },
        { status: 500 },
      );
    }

    const consent = {
      id: result.consentId,
      code: result.code,
      expiresAt: result.expiresAt,
    };

    // Send parental consent email
    const { sendParentalConsentEmail } = await import("@/lib/email/parental-consent");

    // Get student name for email
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true },
    });

    await sendParentalConsentEmail({
      childName: student?.name || "Student",
      childAge: 0, // TODO: Calculate from birthDate
      parentEmail: guardianEmail,
      parentName: "Poštovani roditelju/staratelju",
      consentToken: consent.code,
      consentUrl: `${process.env["NEXT_PUBLIC_APP_URL"]}/consent-verify`,
    });

    // Mark email as sent
    const { markEmailSent } = await import("@/lib/auth/parental-consent");
    if (consent.id) {
      await markEmailSent(consent.id);
    }

    log.info("Parental consent requested", {
      studentId,
      guardianEmail,
      consentId: consent.id,
      expiresAt: consent.expiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Email poslat roditelju! Nalog će biti aktivan kada roditelj potvrdi.",
        consentId: consent.id,
        expiresAt: consent.expiresAt,
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("Parental consent request failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
