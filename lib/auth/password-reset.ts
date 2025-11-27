/**
 * Password Reset Logic
 * Upravljanje password reset token-ima i resetovanjem lozinke
 */

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { sendCustomEmail } from "@/lib/email/service";
import { createPasswordResetEmailTemplate } from "@/lib/email/templates/password-reset";
import { env } from "@/lib/env";

// Constants
const PASSWORD_RESET_EXPIRY_HOURS = 1; // Token expires in 1 hour
const MIN_PASSWORD_LENGTH = 8;

/**
 * Generate password reset token and send email
 */
export async function createAndSendPasswordResetEmail(email: string) {
  try {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        guardian: true,
      },
    });

    if (!user) {
      // Don't reveal if user exists for security
      log.info("Password reset requested for non-existent email", { email });
      return {
        success: true,
        message: "Ako nalog postoji, email za resetovanje je poslat",
      };
    }

    // 2. Generate random token
    const token = crypto.randomBytes(32).toString("hex");

    // 3. Hash token for database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 4. Set expiration
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000
    );

    log.info("Creating password reset token", {
      email,
      expiresAt: expiresAt.toISOString(),
    });

    // 5. Delete old tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email },
    });

    // 6. Create new token in database (reusing VerificationToken model)
    await prisma.verificationToken.create({
      data: {
        email,
        token: hashedToken,
        expires: expiresAt,
      },
    });

    // 7. Create reset URL
    const baseUrl =
      env.NEXTAUTH_URL ||
      (process.env["VERCEL_URL"]
        ? `https://${process.env["VERCEL_URL"]}`
        : "http://localhost:3000");
    const resetUrl = `${baseUrl}/resetuj-lozinku?token=${token}`;

    // 8. Get user name
    const userName = user.student?.name || user.guardian?.name || "Korisnik";

    // 9. Send email
    const template = createPasswordResetEmailTemplate(userName, resetUrl);
    const emailResult = await sendCustomEmail(
      email,
      template.subject,
      template.html,
      template.text
    );

    if (!emailResult.success) {
      log.error("Failed to send password reset email", {
        email,
        error: emailResult.error,
      });
      throw new Error(emailResult.error || "Failed to send email");
    }

    log.info("Password reset email sent", {
      email,
      messageId: emailResult.messageId,
    });

    return {
      success: true,
      message: "Email za resetovanje lozinke je poslat",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to create password reset token", {
      email,
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string) {
  try {
    // 1. Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    log.debug("Verifying password reset token");

    // 2. Find token in database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationToken) {
      log.warn("Password reset token not found");
      return {
        valid: false,
        error: "Link za resetovanje lozinke nije validan ili je istekao",
      };
    }

    // 3. Check if expired
    if (verificationToken.expires < new Date()) {
      log.warn("Password reset token expired", {
        email: verificationToken.email,
      });

      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token: hashedToken },
      });

      return {
        valid: false,
        error: "Link za resetovanje lozinke je istekao. Zatražite novi.",
      };
    }

    // 4. Find user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
      include: {
        student: true,
        guardian: true,
      },
    });

    if (!user) {
      log.error("User not found for password reset", {
        email: verificationToken.email,
      });
      return {
        valid: false,
        error: "Korisnik nije pronađen",
      };
    }

    const userName = user.student?.name || user.guardian?.name || "Korisnik";

    return {
      valid: true,
      email: verificationToken.email,
      userName,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Password reset token verification failed", {
      error: errorMessage,
    });

    return {
      valid: false,
      error: "Greška pri verifikaciji tokena",
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
) {
  try {
    // 1. Validate password
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Lozinka mora imati najmanje ${MIN_PASSWORD_LENGTH} karaktera`,
      };
    }

    // 2. Verify token
    const tokenResult = await verifyPasswordResetToken(token);
    if (!tokenResult.valid || !tokenResult.email) {
      return {
        success: false,
        error: tokenResult.error ?? "Token nije validan",
      };
    }

    const userEmail = tokenResult.email;

    // 3. Hash the provided token to delete it
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 5. Update user password
    await prisma.user.update({
      where: { email: userEmail },
      data: { password: hashedPassword },
    });

    log.info("Password reset successful", { email: userEmail });

    // 6. Delete used token
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    });

    // 7. Invalidate all existing sessions for security
    await prisma.session.deleteMany({
      where: {
        user: {
          email: userEmail,
        },
      },
    });

    log.info("Sessions invalidated after password reset", {
      email: userEmail,
    });

    return {
      success: true,
      message: "Lozinka je uspešno promenjena",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Password reset failed", { error: errorMessage });

    return {
      success: false,
      error: "Greška pri resetovanju lozinke. Pokušajte ponovo.",
    };
  }
}
