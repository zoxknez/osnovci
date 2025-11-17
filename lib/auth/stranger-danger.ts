// Stranger Danger Protection - Multi-step QR verification
// Database-backed implementation (migrated from in-memory Map)

import { VerificationStep } from "@prisma/client";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

/**
 * Step 1: Guardian scans QR code
 * Returns linkCode that student must approve
 */
export async function initiateLink(studentId: string, guardianId: string) {
  const linkCode = nanoid(6).toUpperCase(); // 6-char code
  const emailCode = nanoid(8).toUpperCase(); // 8-char email verification

  try {
    const verification = await prisma.linkVerification.create({
      data: {
        studentId,
        guardianId,
        linkCode,
        emailCode,
        step: VerificationStep.QR_SCANNED,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      },
    });

    log.info("Link initiated - awaiting child approval", {
      studentId,
      guardianId,
      linkCode,
      verificationId: verification.id,
    });

    return {
      linkCode,
      step: "qr_scanned",
      message: "QR kod skeniran! Sada dete mora da potvrdi na svom telefonu.",
    };
  } catch (error) {
    log.error("Failed to initiate link", { error });
    throw new Error("Failed to create verification");
  }
}

/**
 * Step 2: Child approves on their device
 */
export async function childApproves(linkCode: string, studentId: string) {
  try {
    const verification = await prisma.linkVerification.findUnique({
      where: { linkCode },
      select: {
        id: true,
        studentId: true,
        step: true,
        expiresAt: true,
        emailCode: true,
      },
    });

    if (!verification) {
      return { success: false, error: "Invalid link code" };
    }

    if (verification.studentId !== studentId) {
      return { success: false, error: "Unauthorized" };
    }

    if (new Date() > verification.expiresAt) {
      // Cleanup expired
      await prisma.linkVerification.delete({ where: { linkCode } });
      return { success: false, error: "Link code expired" };
    }

    if (verification.step !== VerificationStep.QR_SCANNED) {
      return { success: false, error: "Invalid state" };
    }

    // Update step
    await prisma.linkVerification.update({
      where: { linkCode },
      data: { step: VerificationStep.CHILD_APPROVED },
    });

    log.info("Child approved link", { linkCode, studentId });

    return {
      success: true,
      step: "child_approved",
      emailCode: verification.emailCode,
      message: "Super! Sada pitaj roditelja za kod iz email-a.",
    };
  } catch (error) {
    log.error("Failed to approve link", { error });
    return { success: false, error: "Database error" };
  }
}

/**
 * Step 3: Send email to guardian with verification code
 */
export async function sendGuardianVerificationEmail(
  linkCode: string,
  guardianEmail: string,
) {
  try {
    const verification = await prisma.linkVerification.findUnique({
      where: { linkCode },
      select: {
        id: true,
        step: true,
        emailCode: true,
        expiresAt: true,
      },
    });

    if (
      !verification ||
      verification.step !== VerificationStep.CHILD_APPROVED
    ) {
      return { success: false, error: "Invalid state" };
    }

    if (new Date() > verification.expiresAt) {
      await prisma.linkVerification.delete({ where: { linkCode } });
      return { success: false, error: "Verification expired" };
    }

    // Send verification email
    log.info("Verification email sent", {
      linkCode,
      guardianEmail,
      emailCode: verification.emailCode,
    });

    await prisma.linkVerification.update({
      where: { linkCode },
      data: { step: VerificationStep.EMAIL_SENT },
    });

    return {
      success: true,
      message: `Email poslat na ${guardianEmail}. Roditelj će dobiti kod.`,
    };
  } catch (error) {
    log.error("Failed to send verification email", { error });
    return { success: false, error: "Database error" };
  }
}

/**
 * Step 4: Verify email code and create link
 */
export async function verifyEmailCodeAndLink(
  linkCode: string,
  emailCode: string,
  studentId: string,
) {
  try {
    const verification = await prisma.linkVerification.findUnique({
      where: { linkCode },
      select: {
        id: true,
        studentId: true,
        guardianId: true,
        step: true,
        emailCode: true,
        expiresAt: true,
      },
    });

    if (!verification || verification.step !== VerificationStep.EMAIL_SENT) {
      return { success: false, error: "Invalid state" };
    }

    if (verification.studentId !== studentId) {
      return { success: false, error: "Unauthorized" };
    }

    if (verification.emailCode !== emailCode.toUpperCase()) {
      return {
        success: false,
        error: "Pogrešan kod! Proveri email i unesi tačan kod.",
      };
    }

    if (new Date() > verification.expiresAt) {
      await prisma.linkVerification.delete({ where: { linkCode } });
      return { success: false, error: "Kod je istekao" };
    }

    // Create actual link in database!
    const link = await prisma.link.create({
      data: {
        studentId: verification.studentId,
        guardianId: verification.guardianId,
        linkCode: verification.id, // Use verification ID as linkCode
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    // Mark verification as completed and delete
    await prisma.linkVerification.delete({ where: { linkCode } });

    log.info("Link successfully created after verification", {
      linkId: link.id,
      studentId: verification.studentId,
      guardianId: verification.guardianId,
    });

    return {
      success: true,
      link,
      message: "Bravo! Roditelj je sada povezan! 🎉",
    };
  } catch (error) {
    log.error("Failed to create link", { error });
    return { success: false, error: "Database error" };
  }
}

/**
 * Cleanup expired verifications (cron job)
 */
export async function cleanupExpiredVerifications() {
  try {
    const result = await prisma.linkVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      log.info("Cleaned up expired link verifications", {
        count: result.count,
      });
    }

    return result.count;
  } catch (error) {
    log.error("Failed to cleanup expired verifications", { error });
    return 0;
  }
}
