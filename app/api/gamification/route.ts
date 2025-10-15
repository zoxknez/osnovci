// Gamification API - XP, Levels, Achievements
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { withAuthAndRateLimit, getAuthenticatedStudent, success, internalError } from "@/lib/api/middleware";

/**
 * GET /api/gamification - Get student's gamification data
 * TODO: Add Gamification model to Prisma schema
 */
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const GET = withAuthAndRateLimit(async (_request: NextRequest, session: any, _context: any) => {
  try {
    const student = await getAuthenticatedStudent(session.user.id);

    // Temporary placeholder response until Gamification model is added
    const gamification = {
      studentId: student.id,
      level: 1,
      xp: 0,
      streak: 0,
      achievements: [],
    };

    return success({ gamification });
  } catch (error) {
    return internalError(error, "Greška pri učitavanju XP podataka");
  }
});

/**
 * POST /api/gamification/complete-homework
 * Called when homework is marked as done
 * TODO: Implement when Gamification model is added
 */
export async function POST(request: NextRequest) {
  try {
    const session = await (await import("@/lib/auth/config")).auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await getAuthenticatedStudent(session.user.id);
    const { homeworkId } = await request.json();

    if (!homeworkId) {
      return NextResponse.json({ error: "Homework ID required" }, { status: 400 });
    }

    // Verify ownership
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework || homework.studentId !== student.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    log.info("Homework completion tracked", {
      studentId: student.id,
      homeworkId,
    });

    // Placeholder response
    return NextResponse.json({
      success: true,
      message: "Bravo! +10 XP! 🎉",
      gamification: {
        level: 1,
        xp: 10,
        streak: 1,
      },
      newAchievements: [],
    }, { status: 201 });
  } catch (error) {
    log.error("Homework completion tracking failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

