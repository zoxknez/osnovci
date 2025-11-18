/**
 * Admin Moderation Log Review API
 * PATCH /api/admin/moderation/[id] - Review specific log
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { z } from "zod";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "FLAGGED"]),
  reviewNotes: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/admin/moderation/[id]
 * Review and update moderation log status
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validated = reviewSchema.parse(body);

    const updated = await prisma.moderationLog.update({
      where: { id },
      data: {
        status: validated.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        ...(validated.reviewNotes && { reviewNotes: validated.reviewNotes }),
      },
    });

    log.info("Moderation log reviewed", {
      logId: id,
      adminId: session.user.id,
      newStatus: validated.status,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    log.error("Admin moderation review API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
