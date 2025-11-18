// Parental Consent Management API
// Admin/Guardian access to consent requests

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  canResendEmail,
  createConsentRequest,
  getConsentHistory,
  markEmailSent,
  revokeConsent,
} from "@/lib/auth/parental-consent";
import prisma from "@/lib/db/prisma";
import { sendParentalConsentEmail } from "@/lib/email/parental-consent";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

// ============================================
// GET - Get consent history for student
// ============================================

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with student profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { student: true, guardian: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Students can view their own consent history
    // Guardians can view consent history of linked students
    let studentId: string | undefined;

    if (user.student) {
      studentId = user.student.id;
    } else if (user.guardian) {
      // TODO: Get first linked student or accept studentId as query param
      const link = await prisma.link.findFirst({
        where: { guardianId: user.guardian.id, isActive: true },
        select: { studentId: true },
      });
      studentId = link?.studentId;
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "No student associated" },
        { status: 400 },
      );
    }

    // Get consent history
    const consents = await getConsentHistory(studentId);

    return NextResponse.json({
      success: true,
      consents,
    });
  } catch (error) {
    log.error("Error fetching consent history", error);
    return NextResponse.json(
      { error: "Failed to fetch consent history" },
      { status: 500 },
    );
  }
}

// ============================================
// POST - Create new consent request
// ============================================

const createConsentSchema = z.object({
  studentId: z.string().cuid(),
  parentEmail: z.string().email(),
  parentName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "consent-create",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers },
      );
    }

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createConsentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const { studentId, parentEmail, parentName } = validated.data;

    // Verify user has access to this student (admin or guardian)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        guardian: {
          include: {
            links: {
              where: { studentId, isActive: true },
            },
          },
        },
      },
    });

    // Only guardians linked to student can create consent requests
    const isLinkedGuardian =
      user?.guardian && user.guardian.links.length > 0;

    if (!isLinkedGuardian) {
      return NextResponse.json(
        { error: "Not authorized for this student" },
        { status: 403 },
      );
    }

    // Create consent request
    const result = await createConsentRequest({
      studentId,
      parentEmail,
      ...(parentName && { parentName }),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create consent request" },
        { status: 400 },
      );
    }

    // Send email
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true },
    });

    if (student && result.code) {
      try {
        await sendParentalConsentEmail({
          childName: student.name,
          childAge: 0, // TODO: Calculate from student.birthDate
          parentEmail,
          parentName: parentName || "Poštovani roditelju/staratelju",
          consentToken: result.code,
          consentUrl: `${process.env["NEXT_PUBLIC_APP_URL"]}/consent-verify`,
        });

        if (result.consentId) {
          await markEmailSent(result.consentId);
        }

        log.info("Consent request created and email sent", {
          consentId: result.consentId,
          studentId,
          parentEmail,
        });
      } catch (emailError) {
        log.error("Failed to send consent email", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      consentId: result.consentId,
      code: result.code,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    log.error("Error creating consent request", error);
    return NextResponse.json(
      { error: "Failed to create consent request" },
      { status: 500 },
    );
  }
}

// ============================================
// DELETE - Revoke consent
// ============================================

const revokeConsentSchema = z.object({
  consentId: z.string().cuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = revokeConsentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const { consentId } = validated.data;

    // Verify ownership
    const consent = await prisma.parentalConsent.findUnique({
      where: { id: consentId },
      include: {
        student: {
          include: {
            links: {
              include: { guardian: { include: { user: true } } },
            },
          },
        },
      },
    });

    if (!consent) {
      return NextResponse.json(
        { error: "Consent not found" },
        { status: 404 },
      );
    }

    // Only linked guardians can revoke
    const isAuthorized = consent.student.links.some(
      (link) => link.guardian.user.email === session.user.email,
    );

    if (!isAuthorized) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Revoke consent
    const result = await revokeConsent(consentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to revoke consent" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Consent revoked successfully",
    });
  } catch (error) {
    log.error("Error revoking consent", error);
    return NextResponse.json(
      { error: "Failed to revoke consent" },
      { status: 500 },
    );
  }
}

// ============================================
// PATCH - Resend consent email
// ============================================

const resendEmailSchema = z.object({
  consentId: z.string().cuid(),
});

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting (prevent email spam)
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "consent-resend",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers },
      );
    }

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = resendEmailSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const { consentId } = validated.data;

    // Check if can resend (5 minute cooldown)
    const canResend = await canResendEmail(consentId);

    if (!canResend) {
      return NextResponse.json(
        { error: "Please wait 5 minutes before resending" },
        { status: 429 },
      );
    }

    // Get consent details
    const consent = await prisma.parentalConsent.findUnique({
      where: { id: consentId },
      include: {
        student: {
          select: { name: true },
        },
      },
    });

    if (!consent) {
      return NextResponse.json(
        { error: "Consent not found" },
        { status: 404 },
      );
    }

    if (consent.status !== "PENDING") {
      return NextResponse.json(
        { error: "Consent is not pending" },
        { status: 400 },
      );
    }

    // Resend email
    await sendParentalConsentEmail({
      childName: consent.student.name,
      childAge: 0, // TODO: Calculate from birthDate
      parentEmail: consent.parentEmail,
      parentName: consent.parentName || "Poštovani roditelju/staratelju",
      consentToken: consent.code,
      consentUrl: `${process.env["NEXT_PUBLIC_APP_URL"]}/consent-verify`,
    });

    await markEmailSent(consentId);

    log.info("Consent email resent", { consentId });

    return NextResponse.json({
      success: true,
      message: "Email resent successfully",
    });
  } catch (error) {
    log.error("Error resending consent email", error);
    return NextResponse.json(
      { error: "Failed to resend email" },
      { status: 500 },
    );
  }
}
