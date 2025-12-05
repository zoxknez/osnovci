// GET /api/auth/2fa/status
// Returns current 2FA status for authenticated user

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
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
      prefix: "2fa-status",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    // Get authenticated session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    // Fetch user with 2FA status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen", requestId },
        { status: 404 },
      );
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled ?? false,
      requestId,
    });
  } catch (error) {
    log.error("Error checking 2FA status", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri proveri 2FA statusa", requestId },
      { status: 500 },
    );
  }
}
