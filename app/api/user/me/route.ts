/**
 * API Route: Get Current User Info
 * Vraća informacije o trenutno ulogovanom korisniku
 */

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
      prefix: "user-me",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    // Get user with student/guardian info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true,
            school: true,
          },
        },
        guardian: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen", requestId },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      requestId,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        student: user.student,
        guardian: user.guardian,
      },
    });
  } catch (error) {
    log.error("Error fetching user info", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri učitavanju podataka", requestId },
      { status: 500 },
    );
  }
}
