// Stranger Danger Protection - Multi-step QR verification
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

interface LinkVerification {
  studentId: string;
  guardianId: string;
  linkCode: string;
  step: "qr_scanned" | "child_approved" | "email_sent" | "verified";
  emailCode?: string;
  expiresAt: Date;
}

// Temporary store (in production: use Redis)
const pendingVerifications = new Map<string, LinkVerification>();

/**
 * Step 1: Guardian scans QR code
 * Returns linkCode that student must approve
 */
export async function initiateLink(studentId: string, guardianId: string) {
  const linkCode = nanoid(6).toUpperCase(); // 6-char code
  const emailCode = nanoid(8).toUpperCase(); // 8-char email verification

  const verification: LinkVerification = {
    studentId,
    guardianId,
    linkCode,
    step: "qr_scanned",
    emailCode,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
  };

  pendingVerifications.set(linkCode, verification);

  log.info("Link initiated - awaiting child approval", {
    studentId,
    guardianId,
    linkCode,
  });

  return {
    linkCode,
    step: "qr_scanned",
    message: "QR kod skeniran! Sada dete mora da potvrdi na svom telefonu.",
  };
}

/**
 * Step 2: Child approves on their device
 */
export async function childApproves(linkCode: string, studentId: string) {
  const verification = pendingVerifications.get(linkCode);

  if (!verification) {
    return { success: false, error: "Invalid link code" };
  }

  if (verification.studentId !== studentId) {
    return { success: false, error: "Unauthorized" };
  }

  if (new Date() > verification.expiresAt) {
    pendingVerifications.delete(linkCode);
    return { success: false, error: "Link code expired" };
  }

  // Update step
  verification.step = "child_approved";
  pendingVerifications.set(linkCode, verification);

  log.info("Child approved link", { linkCode, studentId });

  return {
    success: true,
    step: "child_approved",
    emailCode: verification.emailCode,
    message: "Super! Sada pitaj roditelja za kod iz email-a.",
  };
}

/**
 * Step 3: Send email to guardian with verification code
 */
export async function sendGuardianVerificationEmail(
  linkCode: string,
  guardianEmail: string,
) {
  const verification = pendingVerifications.get(linkCode);

  if (!verification || verification.step !== "child_approved") {
    return { success: false, error: "Invalid state" };
  }

  // TODO: Send real email
  log.info("Verification email sent", {
    linkCode,
    guardianEmail,
    emailCode: verification.emailCode,
  });

  verification.step = "email_sent";
  pendingVerifications.set(linkCode, verification);

  return {
    success: true,
    message: `Email poslat na ${guardianEmail}. Roditelj će dobiti kod.`,
  };
}

/**
 * Step 4: Verify email code and create link
 */
export async function verifyEmailCodeAndLink(
  linkCode: string,
  emailCode: string,
  studentId: string,
) {
  const verification = pendingVerifications.get(linkCode);

  if (!verification || verification.step !== "email_sent") {
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
    pendingVerifications.delete(linkCode);
    return { success: false, error: "Kod je istekao" };
  }

  // Create actual link in database!
  try {
    const link = await prisma.link.create({
      data: {
        studentId: verification.studentId,
        guardianId: verification.guardianId,
        linkCode: verification.linkCode,
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    // Cleanup
    pendingVerifications.delete(linkCode);

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
 * Cleanup expired verifications
 */
export function cleanupExpiredVerifications() {
  const now = new Date();
  let cleaned = 0;

  for (const [code, verification] of pendingVerifications.entries()) {
    if (now > verification.expiresAt) {
      pendingVerifications.delete(code);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    log.info("Cleaned up expired link verifications", { count: cleaned });
  }
}

// Cleanup every 10 minutes
if (typeof window === "undefined") {
  setInterval(cleanupExpiredVerifications, 10 * 60 * 1000);
}
