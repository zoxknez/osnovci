// GET /api/auth/2fa/status
// Returns current 2FA status for authenticated user

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Niste prijavljeni" },
        { status: 401 }
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
        { error: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    log.info("2FA status checked", { userId: user.id });

    return NextResponse.json({
      enabled: user.twoFactorEnabled ?? false,
    });
  } catch (error) {
    log.error("Error checking 2FA status", error);
    return NextResponse.json(
      { error: "Greška pri proveri 2FA statusa" },
      { status: 500 }
    );
  }
}
