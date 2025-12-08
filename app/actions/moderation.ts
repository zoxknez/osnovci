"use server";

import type { ContentType } from "@prisma/client";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import {
  getModerationStats,
  moderateContent,
  quickModerate,
} from "@/lib/safety/moderation-service";

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

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
  details?: any;
};

export async function moderateContentAction(
  data: z.infer<typeof moderateSchema>,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validated = moderateSchema.parse(data);

    // Quick check (no DB logging) - for real-time validation
    if (validated.quickCheck) {
      const result = await quickModerate(validated.text);
      return { data: result };
    }

    // Full moderation with logging
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      undefined;
    const userAgent = headersList.get("user-agent") || undefined;

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

    log.info("Content moderated via Action", {
      userId: session.user.id,
      contentType: validated.contentType,
      approved: result.approved,
      action: result.action,
    });

    return { data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid request data", details: error.issues };
    }

    log.error("Moderation Action error", error);
    return { error: "Internal server error" };
  }
}

export async function getModerationStatsAction(
  userId?: string,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const targetUserId = userId || session.user.id;

    // Only allow users to see their own stats (unless admin)
    if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
      return { error: "Forbidden" };
    }

    const stats = await getModerationStats(targetUserId);

    return { data: stats };
  } catch (error) {
    log.error("Moderation stats Action error", error);
    return { error: "Internal server error" };
  }
}
