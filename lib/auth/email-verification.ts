// lib/auth/email-verification.ts
/**
 * Email Verification Logic
 * Upravljanje verification token-ima i email verifikacijom
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { sendVerificationEmail } from "@/lib/email/service";
import { log } from "@/lib/logger";

/**
 * Kreiraj verification token i pošalji email
 */
export async function createAndSendVerificationEmail(
  email: string,
  userName: string,
) {
  try {
    // 1. Generiši random token
    const token = crypto.randomBytes(32).toString("hex");

    // 2. Heš token za bazu
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 3. Postavi expiration na 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    log.info("Creating verification token", {
      email,
      expiresAt: expiresAt.toISOString(),
    });

    // 4. Obriši stare token-e za ovaj email
    await prisma.verificationToken.deleteMany({
      where: { email },
    });

    // 5. Kreiraj novi token u bazi
    await prisma.verificationToken.create({
      data: {
        email,
        token: hashedToken,
        expires: expiresAt,
      },
    });

    log.debug("Verification token created", { email });

    // 6. Pošalji email sa PLAIN token-om
    const emailResult = await sendVerificationEmail(email, userName, token);

    if (!emailResult.success) {
      log.error("Failed to send verification email", {
        email,
        error: emailResult.error,
      });
      throw new Error(emailResult.error || "Failed to send email");
    }

    log.info("Verification email sent", {
      email,
      messageId: emailResult.messageId,
    });

    return {
      success: true,
      message: "Verification email sent",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to create verification token", {
      email,
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Verificiraj token i aktiviraj email
 */
export async function verifyEmailToken(token: string) {
  try {
    // 1. Heš upisani token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    log.debug("Verifying token");

    // 2. Pronađi token u bazi
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationToken) {
      log.warn("Token not found");
      throw new Error("Invalid verification token");
    }

    // 3. Proveri da li je istekao
    if (verificationToken.expires < new Date()) {
      log.warn("Token expired", {
        email: verificationToken.email,
      });

      // Obriši istekao token
      await prisma.verificationToken.delete({
        where: { token: hashedToken },
      });

      throw new Error("Verification token has expired");
    }

    // 4. Pronađi user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });

    if (!user) {
      log.error("User not found", { email: verificationToken.email });
      throw new Error("User not found");
    }

    // 5. Update user - označi email kao verificiran
    const updatedUser = await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });

    log.info("Email verified", {
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    // 6. Obriši korišćeni token
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    });

    return {
      success: true,
      email: verificationToken.email,
      userId: user.id,
      message: "Email verified successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Email verification failed", { error: errorMessage });

    throw error;
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  try {
    log.info("Resend verification email", { email });

    // 1. Pronađi user sa student i guardian
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        guardian: true,
      },
    });

    if (!user) {
      log.warn("User not found", { email });
      throw new Error("User not found");
    }

    // 2. Proveri da li je već verificiran
    if (user.emailVerified) {
      log.warn("Email already verified", { email });
      throw new Error("Email already verified");
    }

    // 3. Kreiraj i pošalji novi token
    const userName = user.student?.name || user.guardian?.name || "User";
    return await createAndSendVerificationEmail(email, userName);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to resend verification email", {
      email,
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Proveri je li email verificiran
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    return user?.emailVerified !== null && user?.emailVerified !== undefined;
  } catch (_error) {
    log.error("Failed to check email verification", { userId });
    return false;
  }
}
