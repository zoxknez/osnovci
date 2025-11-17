/**
 * Biometric Authentication (WebAuthn) - Server-side helpers
 * Supports Face ID, Touch ID, Windows Hello, Fingerprint sensors
 */

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type VerifiedAuthenticationResponse,
  type VerifiedRegistrationResponse,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

// Relying Party configuration
const rpName = "Osnovci App";
const rpID = process.env["NEXT_PUBLIC_APP_URL"]
  ? new URL(process.env["NEXT_PUBLIC_APP_URL"]).hostname
  : "localhost";
const origin = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

/**
 * Generate options for registering a new biometric credential
 */
export async function generateBiometricRegistrationOptions(
  userId: string,
  userName: string,
) {
  try {
    // Get existing credentials for this user
    const existingCredentials = await prisma.biometricCredential.findMany({
      where: { userId },
      select: {
        credentialID: true,
        transports: true,
      },
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName,
      userID: userId, // Use string directly
      // Don't prompt for credentials the user already has
      excludeCredentials: existingCredentials.map(
        (cred: { credentialID: string; transports: string | null }) => ({
          type: "public-key" as const,
          id: Buffer.from(cred.credentialID, "base64url"),
          transports: (cred.transports?.split(",") ||
            []) as AuthenticatorTransport[],
        }),
      ),
      // Prefer platform authenticators (Face ID, Touch ID)
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform", // Prefer built-in sensors
      },
    });

    log.info("Generated biometric registration options", {
      userId,
      challenge: `${options.challenge.substring(0, 10)}...`,
    });

    return options;
  } catch (error) {
    log.error("Failed to generate registration options", { error, userId });
    throw error;
  }
}

/**
 * Verify and save a new biometric credential
 */
export async function verifyAndSaveBiometricCredential(
  userId: string,
  response: RegistrationResponseJSON,
  expectedChallenge: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const verification: VerifiedRegistrationResponse =
      await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

    if (!verification.verified || !verification.registrationInfo) {
      return {
        success: false,
        error: "Verification failed",
      };
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType } =
      verification.registrationInfo;

    // Save credential to database
    const transportsStr = response.response.transports?.join(",");
    await prisma.biometricCredential.create({
      data: {
        userId,
        credentialID: Buffer.from(credentialID).toString("base64url"),
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter: BigInt(counter),
        deviceType: credentialDeviceType,
        deviceName: response.response.authenticatorData
          ? "Unknown Device"
          : "Unknown", // Could parse from client
        ...(transportsStr && { transports: transportsStr }),
      },
    });

    // Update user's biometric flag
    await prisma.user.update({
      where: { id: userId },
      data: { biometric: true },
    });

    log.info("Biometric credential saved", {
      userId,
      credentialID:
        Buffer.from(credentialID).toString("base64url").substring(0, 10) +
        "...",
      deviceType: credentialDeviceType,
    });

    return { success: true };
  } catch (error) {
    log.error("Failed to verify registration response", { error, userId });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate options for authenticating with existing biometric credential
 */
export async function generateBiometricAuthenticationOptions(userId: string) {
  try {
    // Get user's credentials
    const credentials = await prisma.biometricCredential.findMany({
      where: { userId },
      select: {
        credentialID: true,
        transports: true,
      },
    });

    if (credentials.length === 0) {
      throw new Error("No biometric credentials found for user");
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map(
        (cred: { credentialID: string; transports: string | null }) => ({
          type: "public-key" as const,
          id: Buffer.from(cred.credentialID, "base64url"),
          transports: (cred.transports?.split(",") ||
            []) as AuthenticatorTransport[],
        }),
      ),
      userVerification: "preferred",
    });

    log.info("Generated biometric authentication options", {
      userId,
      credentialCount: credentials.length,
    });

    return options;
  } catch (error) {
    log.error("Failed to generate authentication options", { error, userId });
    throw error;
  }
}

/**
 * Verify biometric authentication attempt
 */
export async function verifyBiometricAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Find the credential
    const credential = await prisma.biometricCredential.findUnique({
      where: {
        credentialID: Buffer.from(response.id, "base64url").toString(
          "base64url",
        ),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!credential) {
      return {
        success: false,
        error: "Credential not found",
      };
    }

    const verification: VerifiedAuthenticationResponse =
      await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: Buffer.from(credential.credentialID, "base64url"),
          credentialPublicKey: credential.credentialPublicKey,
          counter: Number(credential.counter),
        },
      });

    if (!verification.verified) {
      return {
        success: false,
        error: "Authentication verification failed",
      };
    }

    // Update counter and last used timestamp
    await prisma.biometricCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    log.info("Biometric authentication successful", {
      userId: credential.userId,
      credentialID: `${credential.credentialID.substring(0, 10)}...`,
    });

    return {
      success: true,
      userId: credential.userId,
    };
  } catch (error) {
    log.error("Failed to verify authentication response", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's biometric credentials (for management UI)
 */
export async function getUserBiometricCredentials(userId: string) {
  return prisma.biometricCredential.findMany({
    where: { userId },
    select: {
      id: true,
      credentialID: true,
      deviceType: true,
      deviceName: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { lastUsedAt: "desc" },
  });
}

/**
 * Delete a biometric credential
 */
export async function deleteBiometricCredential(
  userId: string,
  credentialId: string,
) {
  try {
    await prisma.biometricCredential.delete({
      where: {
        id: credentialId,
        userId, // Ensure user owns this credential
      },
    });

    // Check if user has any remaining credentials
    const remainingCount = await prisma.biometricCredential.count({
      where: { userId },
    });

    // If no credentials left, update user flag
    if (remainingCount === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { biometric: false },
      });
    }

    log.info("Biometric credential deleted", { userId, credentialId });

    return { success: true };
  } catch (error) {
    log.error("Failed to delete credential", { error, userId, credentialId });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
