// 2FA Login Verification API
// Verifies TOTP token or backup code during login

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyTwoFactorAuth } from "@/lib/auth/two-factor";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

const verifyLoginSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6).max(9), // 6 digits or 8-9 chars with dash (AB12-CD34)
});

export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Strict rate limiting - prevent brute force
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "2fa-login-verify",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          error: "Previše pokušaja",
          message: "Previše pokušaja. Pokušaj ponovo za par minuta.",
          requestId,
        },
        { status: 429, headers },
      );
    }

    const body = await request.json();
    const validated = verifyLoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Nevažeći podaci",
          details: validated.error.flatten(),
          requestId,
        },
        { status: 400 },
      );
    }

    const { email, token } = validated.data;

    // Find user with 2FA enabled
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA nije omogućen za ovaj nalog", requestId },
        { status: 400 },
      );
    }

    // Verify token (TOTP or backup code)
    const result = verifyTwoFactorAuth(
      token,
      user.twoFactorSecret,
      user.backupCodes || null,
    );

    if (!result.valid) {
      log.warn("2FA verification failed during login", {
        userId: user.id,
        requestId,
      });

      return NextResponse.json(
        {
          error: "Nevažeći kod",
          message: "Proveri kod i pokušaj ponovo.",
          requestId,
        },
        { status: 401 },
      );
    }

    // If backup code was used, update remaining codes
    if (result.usedBackupCode && result.newEncryptedBackupCodes) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          backupCodes: result.newEncryptedBackupCodes,
        },
      });

      log.info("Backup code used during login", {
        userId: user.id,
        requestId,
      });
    }

    log.info("2FA verification successful during login", {
      userId: user.id,
      usedBackupCode: result.usedBackupCode,
      requestId,
    });

    // COPPA: Log successful 2FA verification
    await logActivity({
      userId: user.id,
      type: "LOGIN",
      description: result.usedBackupCode
        ? "Uspešna 2FA verifikacija sa backup kodom"
        : "Uspešna 2FA verifikacija",
      request,
    });

    return NextResponse.json({
      success: true,
      message: "2FA verifikovan uspešno!",
      usedBackupCode: result.usedBackupCode,
      requestId,
    });
  } catch (error) {
    log.error("2FA login verification failed", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri verifikaciji 2FA", requestId },
      { status: 500 },
    );
  }
}
