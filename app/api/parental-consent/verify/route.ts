// Parental Consent Verification
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

/**
 * POST /api/parental-consent/verify
 * Parent clicks link in email to verify consent
 */
export async function POST(request: NextRequest) {
  try {
    const { verificationCode } = await request.json();

    if (!verificationCode) {
      return NextResponse.json(
        { error: "Verification code je obavezan" },
        { status: 400 },
      );
    }

    // Find consent request
    const consent = await prisma.parentalConsent.findUnique({
      where: { verificationCode },
    });

    if (!consent) {
      return NextResponse.json(
        { error: "Nevažeći verification code" },
        { status: 404 },
      );
    }

    // Check if expired
    if (new Date() > consent.expiresAt) {
      return NextResponse.json(
        { error: "Verification code je istekao. Zahtevaj novi." },
        { status: 400 },
      );
    }

    // Check if already verified
    if (consent.verified) {
      return NextResponse.json(
        { error: "Već verifikovano" },
        { status: 400 },
      );
    }

    // Mark as verified
    await prisma.parentalConsent.update({
      where: { id: consent.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Activate student account
    await prisma.student.update({
      where: { id: consent.studentId },
      data: {
        parentalConsentGiven: true,
        parentalConsentDate: new Date(),
        parentalConsentEmail: consent.guardianEmail,
        accountActive: true,
      },
    });

    log.info("Parental consent verified", {
      studentId: consent.studentId,
      guardianEmail: consent.guardianEmail,
    });

    return NextResponse.json({
      success: true,
      message: "Hvala! Nalog deteta je sada aktivan. 🎉",
    });
  } catch (error) {
    log.error("Parental consent verification failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

