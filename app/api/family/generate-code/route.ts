/**
 * API Route: Generate Link Code for Student QR
 * Student generates a code that guardian scans
 */

import { randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { addRateLimitHeaders, rateLimit } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

export async function POST(request: NextRequest) {
  const requestId = nanoid(10);

  try {
    // Rate limiting - max 5 code generations per hour
    const rateLimitResult = await rateLimit(request, {
      limit: 5,
      window: 60 * 60, // 1 hour in seconds
      prefix: "family-code",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva. Pokušaj ponovo za sat vremena.", requestId },
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

    // Get student
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json(
        { error: "Samo učenici mogu generisati kod za povezivanje", requestId },
        { status: 403 },
      );
    }

    // Generate a 6-character alphanumeric code
    const code = randomBytes(3).toString("hex").toUpperCase();

    // Store the code with expiration (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Check if student already has an active link code (pending link)
    const existingLink = await prisma.link.findFirst({
      where: {
        studentId: user.student.id,
        expiresAt: { gt: new Date() },
        isActive: true,
      },
    });

    if (existingLink) {
      // Return existing code
      return NextResponse.json({
        success: true,
        code: existingLink.linkCode,
        expiresAt: existingLink.expiresAt,
        requestId,
      });
    }

    // Note: Code is stored temporarily in memory/session
    // When guardian scans, they will create the actual Link record
    // TODO: Store in Redis for production (codeKey: link-code:${code})

    // QR data for scanning
    const qrData = `OSNOVCI:${user.student.id}:${code}`;

    // COPPA Activity logging
    await logActivity({
      studentId: user.student.id,
      type: "PARENT_LINKED", // Using closest existing type
      description: "Generisan kod za povezivanje sa roditeljem",
      metadata: { code, expiresAt },
      request,
    });

    log.info("Generated link code for student", {
      studentId: user.student.id,
      code,
      expiresAt,
      requestId,
    });

    return NextResponse.json({
      success: true,
      code,
      qrData,
      expiresAt,
      requestId,
    });
  } catch (error) {
    log.error("Error generating link code", { error, requestId });
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 },
    );
  }
}
