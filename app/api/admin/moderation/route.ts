/**
 * Admin Moderation Logs API
 * GET /api/admin/moderation - Get all moderation logs (admin only)
 * PATCH /api/admin/moderation/[id] - Review moderation log
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import { log } from "@/lib/logger";

/**
 * GET /api/admin/moderation
 * Get all moderation logs (with pagination and filters)
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const flagged = searchParams.get("flagged");
    const contentType = searchParams.get("contentType");
    const userId = searchParams.get("userId");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (flagged === "true") where.flagged = true;
    if (contentType) where.contentType = contentType;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.moderationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.moderationLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    log.error("Admin moderation logs API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
