/**
 * Content Moderation API
 * POST /api/moderation - Moderate content
 * GET /api/moderation - Get moderation stats
 */

import type { ContentType } from "@prisma/client";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import {
  getModerationStats,
  moderateContent,
  quickModerate,
} from "@/lib/safety/moderation-service";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

const moderateSchema = z.object({
  text: z.string().min(1).max(10000),
  contentType: z.enum([
    "HOMEWORK_TITLE",
    "HOMEWORK_DESCRIPTION",
    "HOMEWORK_NOTE",
    "GRADE_NOTE",
    "SCHEDULE_NOTE",
    "PROFILE_BIO",
    "ATTACHMENT_FILENAME",
  ]),
  contentId: z.string(),
  studentId: z.string().optional(),
  userAge: z.number().int().min(5).max(18).optional(),
  quickCheck: z.boolean().optional(),
});

/**
 * POST /api/moderation
 * Moderate content with comprehensive checks
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "moderation-post",
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

    const body = await request.json();
    const validated = moderateSchema.parse(body);

    // Quick check (no DB logging) - for real-time validation
    if (validated.quickCheck) {
      const result = await quickModerate(validated.text);
      return NextResponse.json({ ...result, requestId });
    }

    // Full moderation with logging
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    const result = await moderateContent({
      text: validated.text,
      contentType: validated.contentType as ContentType,
      contentId: validated.contentId,
      userId: session.user.id,
      ...(validated.studentId && { studentId: validated.studentId }),
      ...(validated.userAge && { userAge: validated.userAge }),
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
    });

    log.info("Content moderated via API", {
      userId: session.user.id,
      contentType: validated.contentType,
      approved: result.approved,
      action: result.action,
      requestId,
    });

    return NextResponse.json({ ...result, requestId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neispravni podaci", details: error.issues, requestId },
        { status: 400 },
      );
    }

    log.error("Moderation API error", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri moderaciji sadržaja", requestId },
      { status: 500 },
    );
  }
}

/**
 * GET /api/moderation
 * Get moderation statistics for current user
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "moderation-stats",
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Only allow users to see their own stats (unless admin)
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nemate pristup", requestId },
        { status: 403 },
      );
    }

    const stats = await getModerationStats(userId);

    return NextResponse.json({ ...stats, requestId });
  } catch (error) {
    log.error("Moderation stats API error", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri učitavanju statistike", requestId },
      { status: 500 },
    );
  }
}
