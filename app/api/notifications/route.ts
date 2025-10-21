// Notifications API - User notifications
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";

// GET /api/notifications - Get user notifications
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      count: notifications.length,
    });
  } catch (error) {
    log.error("GET /api/notifications failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications/mark-read - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notifikacije označene kao pročitane!",
    });
  } catch (error) {
    log.error("PATCH /api/notifications failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
