/**
 * Content Moderation API
 * POST /api/moderation - Moderate content
 * GET /api/moderation - Get moderation stats
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { moderateContent, getModerationStats, quickModerate } from "@/lib/safety/moderation-service";
import { ContentType } from "@prisma/client";
import { log } from "@/lib/logger";
import { z } from "zod";

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
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = moderateSchema.parse(body);

    // Quick check (no DB logging) - for real-time validation
    if (validated.quickCheck) {
      const result = await quickModerate(validated.text);
      return NextResponse.json(result);
    }

    // Full moderation with logging
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
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
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    log.error("Moderation API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/moderation
 * Get moderation statistics for current user
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Only allow users to see their own stats (unless admin)
    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getModerationStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    log.error("Moderation stats API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
