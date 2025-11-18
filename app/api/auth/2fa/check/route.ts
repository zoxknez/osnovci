// Check if user has 2FA enabled API
// Used before login to determine if 2FA modal should be shown

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

const checkSchema = z.object({
  email: z.string().email("Nevažeća email adresa"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - moderate
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "2fa-check",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers },
      );
    }

    const body = await request.json();
    const validated = checkSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nevažeći email", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const { email } = validated.data;

    // Check if user exists and has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    // Return whether 2FA is enabled
    // Even if user doesn't exist, return false to prevent user enumeration
    return NextResponse.json({
      twoFactorEnabled: user?.twoFactorEnabled || false,
    });
  } catch (error) {
    log.error("2FA check failed", { error });
    return NextResponse.json(
      { error: "Greška pri proveri 2FA statusa" },
      { status: 500 },
    );
  }
}
