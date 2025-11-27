// 2FA Setup API - Enable Two-Factor Authentication
// Generates TOTP secret and QR code for user

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import { auth } from "@/lib/auth/config";
import { setupTwoFactorAuth, verifyTOTPToken } from "@/lib/auth/two-factor";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

const setupSchema = z.object({
  password: z.string().min(1, "Lozinka je obavezna"),
});

const verifySchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/, "Token mora biti 6 cifara"),
});

/**
 * POST /api/auth/2fa/setup
 * Step 1: Generate TOTP secret and QR code
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "2fa-setup",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validated = setupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nevažeći podaci", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, phone: true, password: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA je već omogućen" },
        { status: 400 },
      );
    }

    // Verify password before allowing 2FA setup
    if (!user.password) {
      return NextResponse.json(
        { error: "Nalog nema postavljenu lozinku" },
        { status: 400 },
      );
    }

    const isPasswordValid = await compare(validated.data.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Netačna lozinka" },
        { status: 401 },
      );
    }

    // Generate 2FA setup
    const userName = user.email || user.phone || user.id;
    const setup = await setupTwoFactorAuth(userName);

    // Store encrypted secret temporarily (will be confirmed after token verification)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: setup.encryptedSecret,
        backupCodes: setup.encryptedBackupCodes,
        twoFactorEnabled: false, // Not enabled yet - waiting for verification
      },
    });

    log.info("2FA setup initiated", { userId: user.id });

    return NextResponse.json({
      success: true,
      qrCodeDataUrl: setup.qrCodeDataUrl,
      backupCodes: setup.backupCodes,
      message: "Skeniraj QR kod sa authenticator aplikacijom i unesi 6-cifreni kod za potvrdu",
    });
  } catch (error) {
    log.error("2FA setup failed", { error });
    return NextResponse.json(
      { error: "Greška pri podešavanju 2FA" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/auth/2fa/setup
 * Step 2: Verify TOTP token and enable 2FA
 */
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "2fa-verify",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = verifySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nevažeći token", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    // Get user with encrypted secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Nema pending 2FA setup-a. Pokreni setup ponovo." },
        { status: 400 },
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA je već omogućen" },
        { status: 400 },
      );
    }

    // Decrypt secret and verify token
    const { decrypt } = await import("@/lib/auth/two-factor");
    const secret = decrypt(user.twoFactorSecret);
    const isValid = verifyTOTPToken(validated.data.token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Nevažeći token. Proveri authenticator aplikaciju." },
        { status: 400 },
      );
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
      },
    });

    log.info("2FA enabled successfully", { userId: user.id });

    return NextResponse.json({
      success: true,
      message: "2FA uspešno omogućen! Sada ćeš morati da uneseš kod prilikom prijave.",
    });
  } catch (error) {
    log.error("2FA verification failed", { error });
    return NextResponse.json(
      { error: "Greška pri verifikaciji 2FA" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/2fa/setup
 * Disable 2FA
 */
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "2fa-disable",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = setupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nevažeći podaci" },
        { status: 400 },
      );
    }

    // Verify password before disabling 2FA
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "Nalog nema postavljenu lozinku" },
        { status: 400 },
      );
    }

    const isPasswordValid = await compare(validated.data.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Netačna lozinka" },
        { status: 401 },
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    log.info("2FA disabled", { userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: "2FA je onemogućen",
    });
  } catch (error) {
    log.error("2FA disable failed", { error });
    return NextResponse.json(
      { error: "Greška pri onemogućavanju 2FA" },
      { status: 500 },
    );
  }
}
