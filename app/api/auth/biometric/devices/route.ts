/**
 * Biometric Devices API - List user's registered biometric devices
 *
 * GET /api/auth/biometric/devices
 * Returns list of all biometric credentials for authenticated user
 *
 * Response:
 * [
 *   {
 *     id: string (credentialID),
 *     deviceName: string,
 *     createdAt: Date
 *   }
 * ]
 */

import { NextResponse } from "next/server";
import { getUserBiometricCredentials } from "@/lib/auth/biometric-server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 401 },
      );
    }

    // Get user's biometric devices
    const credentials = await getUserBiometricCredentials(session.user.id);

    // Format response
    const devices = credentials.map(
      (cred: {
        id: string;
        createdAt: Date;
        deviceType: string | null;
        deviceName: string | null;
        credentialID: string;
        lastUsedAt: Date;
      }) => ({
        id: cred.credentialID,
        deviceName: cred.deviceName || "Unknown Device",
        createdAt: cred.createdAt,
      }),
    );

    log.info("Listed biometric devices", {
      userId: session.user.id,
      count: devices.length,
    });

    return NextResponse.json(devices);
  } catch (error) {
    log.error("Failed to list biometric devices", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju uređaja" },
      { status: 500 },
    );
  }
}
