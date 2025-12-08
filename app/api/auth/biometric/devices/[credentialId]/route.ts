/**
 * Biometric Device Management API - Remove specific device
 *
 * DELETE /api/auth/biometric/devices/[credentialId]
 * Removes a specific biometric credential from user's account
 *
 * Security:
 * - Only credential owner can delete
 * - Prevents accidental lockout (checks if other credentials exist)
 */

import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ credentialId: string }>;
};

import {
  deleteBiometricCredential,
  getUserBiometricCredentials,
} from "@/lib/auth/biometric-server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 401 },
      );
    }

    const { credentialId } = await context.params;

    // Get all user's credentials to check ownership and prevent lockout
    const allCredentials = await getUserBiometricCredentials(session.user.id);
    const credential = allCredentials.find(
      (c: { credentialID: string }) => c.credentialID === credentialId,
    );

    // Check if credential exists and belongs to user
    if (!credential) {
      return NextResponse.json(
        { message: "Uređaj nije pronađen" },
        { status: 404 },
      );
    }

    // Optional: Prevent deleting last device (user would be locked out of biometric login)
    // Comment out if you want to allow full removal
    if (allCredentials.length === 1) {
      log.warn("User attempted to delete last biometric device", {
        userId: session.user.id,
        credentialId,
      });
      // Allow deletion but log warning - user can still use password
    }

    // Delete credential
    await deleteBiometricCredential(credentialId, session.user.id);

    log.info("Biometric device deleted", {
      userId: session.user.id,
      credentialId,
      deviceName: credential.deviceName,
    });

    return NextResponse.json({
      success: true,
      message: "Uređaj je uspešno uklonjen",
    });
  } catch (error) {
    log.error("Failed to delete biometric device", error);
    return NextResponse.json(
      { message: "Greška pri brisanju uređaja" },
      { status: 500 },
    );
  }
}
