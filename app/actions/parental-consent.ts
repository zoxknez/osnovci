"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  canResendEmail,
  createConsentRequest,
  getConsentHistory,
  markEmailSent,
  revokeConsent,
  verifyConsentCode,
} from "@/lib/auth/parental-consent";
import prisma from "@/lib/db/prisma";
import { sendParentalConsentEmail } from "@/lib/email/parental-consent";
import { log } from "@/lib/logger";
import { headers } from "next/headers";

/**
 * Calculate age from birth date
 * @param birthDate - The birth date to calculate age from
 * @returns Age in years, or 0 if birthDate is null/undefined
 */
function calculateAge(birthDate: Date | null | undefined): number {
  if (!birthDate) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age); // Ensure non-negative
}

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
  success?: boolean;
};

// ============================================
// GET - Get consent history for student
// ============================================

export async function getConsentHistoryAction(): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    // Get user with student profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { student: true, guardian: true },
    });

    if (!user) {
      return { error: "User not found" };
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
      return { error: "No student associated" };
    }

    // Get consent history
    const consents = await getConsentHistory(studentId);

    return {
      success: true,
      data: consents,
    };
  } catch (error) {
    log.error("Error fetching consent history", error);
    return { error: "Failed to fetch consent history" };
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

export async function createConsentRequestAction(data: z.infer<typeof createConsentSchema>): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const validated = createConsentSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
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
      return { error: "Not authorized for this student" };
    }

    // Create consent request
    const result = await createConsentRequest({
      studentId,
      parentEmail,
      ...(parentName && { parentName }),
    });

    if (!result.success) {
      return { error: result.error || "Failed to create consent request" };
    }

    // Send email
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, birthDate: true },
    });

    if (student && result.code) {
      try {
        await sendParentalConsentEmail({
          childName: student.name,
          childAge: calculateAge(student.birthDate),
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

    return {
      success: true,
      data: {
        consentId: result.consentId,
        code: result.code,
        expiresAt: result.expiresAt,
      },
    };
  } catch (error) {
    log.error("Error creating consent request", error);
    return { error: "Failed to create consent request" };
  }
}

// ============================================
// DELETE - Revoke consent
// ============================================

const revokeConsentSchema = z.object({
  consentId: z.string().cuid(),
});

export async function revokeConsentAction(data: z.infer<typeof revokeConsentSchema>): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const validated = revokeConsentSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
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
      return { error: "Consent not found" };
    }

    // Only linked guardians can revoke
    const isAuthorized = consent.student.links.some(
      (link) => link.guardian.user.email === session.user.email,
    );

    if (!isAuthorized) {
      return { error: "Not authorized" };
    }

    // Revoke consent
    const result = await revokeConsent(consentId);

    if (!result.success) {
      return { error: result.error || "Failed to revoke consent" };
    }

    return {
      success: true,
      data: { message: "Consent revoked successfully" },
    };
  } catch (error) {
    log.error("Error revoking consent", error);
    return { error: "Failed to revoke consent" };
  }
}

// ============================================
// PATCH - Resend consent email
// ============================================

const resendEmailSchema = z.object({
  consentId: z.string().cuid(),
});

export async function resendConsentEmailAction(data: z.infer<typeof resendEmailSchema>): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const validated = resendEmailSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    const { consentId } = validated.data;

    // Check if can resend (5 minute cooldown)
    const canResend = await canResendEmail(consentId);

    if (!canResend) {
      return { error: "Please wait 5 minutes before resending" };
    }

    // Get consent details
    const consent = await prisma.parentalConsent.findUnique({
      where: { id: consentId },
      include: {
        student: {
          select: { name: true, birthDate: true },
        },
      },
    });

    if (!consent) {
      return { error: "Consent not found" };
    }

    if (consent.status !== "PENDING") {
      return { error: "Consent is not pending" };
    }

    // Resend email
    await sendParentalConsentEmail({
      childName: consent.student.name,
      childAge: calculateAge(consent.student.birthDate),
      parentEmail: consent.parentEmail,
      parentName: consent.parentName || "Poštovani roditelju/staratelju",
      consentToken: consent.code,
      consentUrl: `${process.env["NEXT_PUBLIC_APP_URL"]}/consent-verify`,
    });

    await markEmailSent(consentId);

    log.info("Consent email resent", { consentId });

    return {
      success: true,
      data: { message: "Email resent successfully" },
    };
  } catch (error) {
    log.error("Error resending consent email", error);
    return { error: "Failed to resend email" };
  }
}

// ============================================
// POST - Resend consent email for current user
// ============================================

export async function resendMyConsentEmailAction(): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    // Find pending consent for this user's student profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { student: true },
    });

    if (!user?.student) {
      return { error: "Student profile not found" };
    }

    const consent = await prisma.parentalConsent.findFirst({
      where: {
        studentId: user.student.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!consent) {
      return { error: "No pending consent found" };
    }

    // Check cooldown
    const canResend = await canResendEmail(consent.id);
    if (!canResend) {
      return { error: "Please wait 5 minutes before resending" };
    }

    // Resend email
    await sendParentalConsentEmail({
      childName: user.student.name,
      childAge: calculateAge(user.student.birthDate),
      parentEmail: consent.parentEmail,
      parentName: consent.parentName || "Poštovani roditelju/staratelju",
      consentToken: consent.code,
      consentUrl: `${process.env["NEXT_PUBLIC_APP_URL"]}/consent-verify`,
    });

    await markEmailSent(consent.id);

    log.info("Consent email resent for user", { userId: user.id, consentId: consent.id });

    return {
      success: true,
      data: { message: "Email resent successfully" },
    };
  } catch (error) {
    log.error("Error resending consent email", error);
    return { error: "Failed to resend email" };
  }
}

// ============================================
// POST - Verify consent code
// ============================================

const verifyConsentSchema = z.object({
  code: z.string().min(1),
});

export async function verifyConsentAction(data: z.infer<typeof verifyConsentSchema>): Promise<ActionResponse> {
  try {
    const validated = verifyConsentSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid data" };
    }

    const { code } = validated.data;
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    const result = await verifyConsentCode({
      code,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return { error: result.error || "Verifikacija nije uspela" };
    }

    log.info("Parental consent verified via action", {
      studentId: result.studentId,
      studentName: result.studentName,
    });

    return {
      success: true,
      data: {
        message: "Hvala! Nalog deteta je sada aktivan. 🎉",
        student: {
          id: result.studentId,
          name: result.studentName,
        },
      },
    };
  } catch (error) {
    log.error("Parental consent verification failed", error);
    return { error: "Internal Server Error" };
  }
}
