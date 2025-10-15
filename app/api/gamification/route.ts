// Gamification API - XP, Levels, Achievements
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { withAuthAndRateLimit, getAuthenticatedStudent, success, internalError } from "@/lib/api/middleware";
import { addXP, trackHomeworkCompletion } from "@/lib/gamification/xp-system";

/**
 * GET /api/gamification - Get student's gamification data
 */
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const GET = withAuthAndRateLimit(async (request: NextRequest, session: any, _context: any) => {
  try {
    const student = await getAuthenticatedStudent(session.user.id);

    // Get or create gamification record
    let gamification = await prisma.gamification.findUnique({
      where: { studentId: student.id },
      include: {
        achievements: {
          orderBy: { unlockedAt: "desc" },
        },
      },
    });

    if (!gamification) {
      gamification = await prisma.gamification.create({
        data: {
          studentId: student.id,
        },
        include: {
          achievements: true,
        },
      });
    }

    return success({ gamification });
  } catch (error) {
    return internalError(error, "Greška pri učitavanju XP podataka");
  }
});

/**
 * POST /api/gamification/complete-homework
 * Called when homework is marked as done
 */
export async function POST(request: NextRequest) {
  try {
    const session = await (await import("@/lib/auth/config")).auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await getAuthenticatedStudent(session.user.id);
    const { homeworkId, early } = await request.json();

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

    // Track completion (adds XP, updates streak, unlocks achievements)
    await trackHomeworkCompletion(student.id, early);

    // Get updated gamification data
    const gamification = await prisma.gamification.findUnique({
      where: { studentId: student.id },
      include: {
        achievements: {
          where: {
            unlockedAt: {
              gte: new Date(Date.now() - 5000), // Last 5 seconds
            },
          },
        },
      },
    });

    log.info("Homework completion tracked", {
      studentId: student.id,
      homeworkId,
      early,
    });

    return success({
      message: "Bravo! +10 XP! 🎉",
      gamification,
      newAchievements: gamification?.achievements || [],
    }, 201);
  } catch (error) {
    log.error("Homework completion tracking failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

