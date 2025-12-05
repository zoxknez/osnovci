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

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getUserBiometricCredentials } from "@/lib/auth/biometric-server";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "biometric-devices",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { message: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup", requestId },
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
        deviceName: cred.deviceName || "Nepoznat uređaj",
        createdAt: cred.createdAt,
      }),
    );

    return NextResponse.json({
      devices,
      requestId,
    });
  } catch (error) {
    log.error("Failed to list biometric devices", { error, requestId });
    return NextResponse.json(
      { message: "Greška pri učitavanju uređaja", requestId },
      { status: 500 },
    );
  }
}
