/**
 * Student Gamification Settings API
 *
 * PATCH /api/gamification/student/[studentId]/settings
 * Update student gamification settings (privacy, etc.)
 */

import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 401 },
      );
    }

    const { studentId } = await context.params;
    const body = await request.json();

    // Verify student belongs to user
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 403 },
      );
    }

    // Update settings
    const updated = await prisma.gamification.update({
      where: { studentId },
      data: {
        showOnLeaderboard: body.showOnLeaderboard ?? undefined,
      },
    });

    log.info("Student gamification settings updated", {
      studentId,
      updates: body,
    });

    return NextResponse.json({
      success: true,
      showOnLeaderboard: updated.showOnLeaderboard,
    });
  } catch (error) {
    log.error("Failed to update gamification settings", error);
    return NextResponse.json(
      { message: "Greška pri ažuriranju podešavanja" },
      { status: 500 },
    );
  }
}
