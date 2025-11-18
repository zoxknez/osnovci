// Parental Consent System - Complete COPPA/GDPR Compliance
// Generate, store, verify, and manage parental consent codes

import { ConsentStatus } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { log } from "@/lib/logger";

// ============================================
// CONSENT CODE GENERATION
// ============================================

/**
 * Generate a secure 6-digit consent code
 * Format: 123456 (all digits)
 */
export function generateConsentCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// CREATE CONSENT REQUEST
// ============================================

export interface CreateConsentParams {
  studentId: string;
  parentEmail: string;
  parentName?: string;
  expiresInHours?: number; // Default: 6 hours
}

/**
 * Create a new parental consent request
 * - Generates unique 6-digit code
 * - Stores in database with expiration
 * - Returns code for email sending
 */
export async function createConsentRequest({
  studentId,
  parentEmail,
  parentName,
  expiresInHours = 6,
}: CreateConsentParams): Promise<{
  success: boolean;
  code?: string;
  consentId?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check for existing pending consent
    const existingConsent = await prisma.parentalConsent.findFirst({
      where: {
        studentId,
        status: ConsentStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingConsent) {
      // Return existing code if still valid
      log.info("Reusing existing pending consent", {
        studentId,
        consentId: existingConsent.id,
      });
      return {
        success: true,
        code: existingConsent.code,
        consentId: existingConsent.id,
        expiresAt: existingConsent.expiresAt,
      };
    }

    // Generate unique code
    let code = generateConsentCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const existing = await prisma.parentalConsent.findUnique({
        where: { code },
      });

      if (!existing) break;

      code = generateConsentCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, error: "Failed to generate unique code" };
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create consent request
    const consent = await prisma.parentalConsent.create({
      data: {
        studentId,
        code,
        parentEmail: parentEmail.toLowerCase(),
        parentName: parentName || null,
        status: ConsentStatus.PENDING,
        expiresAt,
      },
    });

    log.info("Parental consent request created", {
      consentId: consent.id,
      studentId,
      parentEmail,
      expiresAt,
    });

    return {
      success: true,
      code: consent.code,
      consentId: consent.id,
      expiresAt: consent.expiresAt,
    };
  } catch (error) {
    log.error("Error creating consent request", error, { studentId, parentEmail });
    return { success: false, error: "Database error" };
  }
}

// ============================================
// VERIFY CONSENT CODE
// ============================================

export interface VerifyConsentParams {
  code: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Verify a parental consent code
 * - Validates code format and existence
 * - Checks expiration
 * - Updates student account status
 * - Marks consent as verified
 */
export async function verifyConsentCode({
  code,
  ipAddress,
  userAgent,
}: VerifyConsentParams): Promise<{
  success: boolean;
  studentId?: string;
  studentName?: string;
  error?: string;
}> {
  try {
    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: "Invalid code format" };
    }

    // Find consent request
    const consent = await prisma.parentalConsent.findUnique({
      where: { code },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            parentalConsentGiven: true,
          },
        },
      },
    });

    if (!consent) {
      log.warn("Consent code not found", { code });
      return { success: false, error: "Invalid code" };
    }

    // Increment attempts
    await prisma.parentalConsent.update({
      where: { id: consent.id },
      data: { attempts: { increment: 1 } },
    });

    // Check if already verified
    if (consent.status === ConsentStatus.VERIFIED) {
      return {
        success: true,
        studentId: consent.studentId,
        studentName: consent.student.name,
      };
    }

    // Check if expired
    if (consent.expiresAt < new Date()) {
      await prisma.parentalConsent.update({
        where: { id: consent.id },
        data: { status: ConsentStatus.EXPIRED },
      });
      log.warn("Consent code expired", { code, consentId: consent.id });
      return { success: false, error: "Code expired" };
    }

    // Check if revoked
    if (consent.status === ConsentStatus.REVOKED) {
      log.warn("Consent code revoked", { code, consentId: consent.id });
      return { success: false, error: "Code revoked" };
    }

    // Verify consent - update both consent and student
    await prisma.$transaction([
      // Mark consent as verified
      prisma.parentalConsent.update({
        where: { id: consent.id },
        data: {
          status: ConsentStatus.VERIFIED,
          verifiedAt: new Date(),
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      }),
      // Update student account
      prisma.student.update({
        where: { id: consent.studentId },
        data: {
          parentalConsentGiven: true,
          parentalConsentDate: new Date(),
          parentalConsentEmail: consent.parentEmail,
          accountActive: true,
        },
      }),
    ]);

    log.info("Parental consent verified", {
      consentId: consent.id,
      studentId: consent.studentId,
      parentEmail: consent.parentEmail,
    });

    return {
      success: true,
      studentId: consent.studentId,
      studentName: consent.student.name,
    };
  } catch (error) {
    log.error("Error verifying consent code", error, { code });
    return { success: false, error: "Verification failed" };
  }
}

// ============================================
// CHECK CONSENT STATUS
// ============================================

/**
 * Check if student has valid parental consent
 */
export async function hasValidConsent(studentId: string): Promise<boolean> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { parentalConsentGiven: true },
    });

    return student?.parentalConsentGiven ?? false;
  } catch (error) {
    log.error("Error checking consent status", error, { studentId });
    return false;
  }
}

/**
 * Get all consent requests for a student
 */
export async function getConsentHistory(studentId: string) {
  try {
    const consents = await prisma.parentalConsent.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        status: true,
        parentEmail: true,
        createdAt: true,
        expiresAt: true,
        verifiedAt: true,
        attempts: true,
      },
    });

    return consents;
  } catch (error) {
    log.error("Error fetching consent history", error, { studentId });
    return [];
  }
}

// ============================================
// REVOKE CONSENT
// ============================================

/**
 * Revoke a consent request (before verification)
 * or revoke existing consent (after verification)
 */
export async function revokeConsent(
  consentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const consent = await prisma.parentalConsent.findUnique({
      where: { id: consentId },
      include: { student: { select: { id: true } } },
    });

    if (!consent) {
      return { success: false, error: "Consent not found" };
    }

    // If consent was verified, also deactivate student account
    if (consent.status === ConsentStatus.VERIFIED) {
      await prisma.$transaction([
        prisma.parentalConsent.update({
          where: { id: consentId },
          data: {
            status: ConsentStatus.REVOKED,
            revokedAt: new Date(),
          },
        }),
        prisma.student.update({
          where: { id: consent.studentId },
          data: {
            parentalConsentGiven: false,
            accountActive: false,
          },
        }),
      ]);

      log.warn("Parental consent revoked - account deactivated", {
        consentId,
        studentId: consent.studentId,
      });
    } else {
      // Just mark as revoked
      await prisma.parentalConsent.update({
        where: { id: consentId },
        data: {
          status: ConsentStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      log.info("Consent request revoked", { consentId });
    }

    return { success: true };
  } catch (error) {
    log.error("Error revoking consent", error, { consentId });
    return { success: false, error: "Failed to revoke consent" };
  }
}

// ============================================
// CLEANUP EXPIRED CONSENTS
// ============================================

/**
 * Cleanup job: Mark expired consents and delete old records
 * Should be run as a cron job (e.g., daily)
 */
export async function cleanupExpiredConsents(): Promise<{
  expired: number;
  deleted: number;
}> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Mark expired consents
    const expiredResult = await prisma.parentalConsent.updateMany({
      where: {
        status: ConsentStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: { status: ConsentStatus.EXPIRED },
    });

    // Delete very old consents (30+ days, not verified)
    const deleteResult = await prisma.parentalConsent.deleteMany({
      where: {
        status: { in: [ConsentStatus.EXPIRED, ConsentStatus.REVOKED] },
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    log.info("Expired consents cleanup completed", {
      expired: expiredResult.count,
      deleted: deleteResult.count,
    });

    return {
      expired: expiredResult.count,
      deleted: deleteResult.count,
    };
  } catch (error) {
    log.error("Error cleaning up expired consents", error);
    return { expired: 0, deleted: 0 };
  }
}

// ============================================
// RESEND CONSENT EMAIL
// ============================================

/**
 * Mark that consent email was sent
 */
export async function markEmailSent(consentId: string): Promise<void> {
  try {
    await prisma.parentalConsent.update({
      where: { id: consentId },
      data: { emailSentAt: new Date() },
    });
  } catch (error) {
    log.error("Error marking email sent", error, { consentId });
  }
}

/**
 * Check if consent email can be resent (rate limiting)
 */
export async function canResendEmail(consentId: string): Promise<boolean> {
  try {
    const consent = await prisma.parentalConsent.findUnique({
      where: { id: consentId },
      select: { emailSentAt: true },
    });

    if (!consent || !consent.emailSentAt) return true;

    // Allow resend after 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    return consent.emailSentAt < fiveMinutesAgo;
  } catch (error) {
    log.error("Error checking email resend", error, { consentId });
    return false;
  }
}
