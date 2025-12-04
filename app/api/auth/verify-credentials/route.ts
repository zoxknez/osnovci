/**
 * Verify credentials without creating a session
 * Used for 2FA flow - verify password first, then verify 2FA before creating session
 */

import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isAccountLocked,
  recordLoginAttempt,
} from "@/lib/auth/account-lockout";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

const verifySchema = z.object({
  email: z.string().email("Nevažeća email adresa"),
  password: z.string().min(1, "Lozinka je obavezna"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - strict for auth
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "verify-credentials",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše pokušaja. Sačekajte malo.", valid: false },
        { status: 429, headers },
      );
    }

    const body = await request.json();
    const validated = verifySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nevažeći podaci", valid: false },
        { status: 400 },
      );
    }

    const { email, password } = validated.data;

    // Check if account is locked
    const lockStatus = await isAccountLocked(email);
    if (lockStatus.locked) {
      return NextResponse.json(
        { error: lockStatus.message || "Nalog je zaključan", valid: false },
        { status: 403 },
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.password) {
      // Record failed attempt
      await recordLoginAttempt({ email, success: false });

      // Don't reveal if user exists
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka", valid: false },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Record failed attempt
      const lockResult = await recordLoginAttempt({ email, success: false });

      if (lockResult.locked) {
        return NextResponse.json(
          { error: lockResult.message || "Nalog je zaključan", valid: false },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { error: "Pogrešan email ili lozinka", valid: false },
        { status: 401 },
      );
    }

    // Don't clear failed attempts yet - wait for 2FA verification
    // Password is valid, but we don't create a session here
    log.info("Credentials verified for 2FA user", { userId: user.id });

    return NextResponse.json({
      valid: true,
      requires2FA: user.twoFactorEnabled,
    });
  } catch (error) {
    log.error("Verify credentials failed", { error });
    return NextResponse.json(
      { error: "Greška pri verifikaciji", valid: false },
      { status: 500 },
    );
  }
}
