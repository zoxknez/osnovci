// Gamification API - XP, Levels, Achievements (Security Enhanced!)
import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  withAuthAndRateLimit,
  getAuthenticatedStudent,
  success,
  internalError,
  badRequest,
  forbidden,
} from "@/lib/api/middleware";
import {
  addXP,
  getXPForNextLevel,
  trackHomeworkCompletion,
} from "@/lib/gamification/xp-system";
import { csrfMiddleware } from "@/lib/security/csrf";

const GAMIFICATION_INCLUDE = {
  achievements: {
    orderBy: { unlockedAt: "desc" as const },
  },
} satisfies Prisma.GamificationInclude;

type GamificationWithAchievements = Prisma.GamificationGetPayload<{
  include: typeof GAMIFICATION_INCLUDE;
}>;

function formatGamification(gamification: GamificationWithAchievements | null) {
  if (!gamification) return null;

  const nextLevelThreshold = getXPForNextLevel(gamification.xp);
  const xpToNextLevel = Math.max(nextLevelThreshold - gamification.xp, 0);

  return {
    id: gamification.id,
    studentId: gamification.studentId,
    level: gamification.level,
    xp: gamification.xp,
    totalXPEarned: gamification.totalXPEarned,
    totalHomeworkDone: gamification.totalHomeworkDone,
    streak: gamification.streak,
    longestStreak: gamification.longestStreak,
    lastActivityDate: gamification.lastActivityDate,
    xpToNextLevel,
    achievements: gamification.achievements,
  };
}

/**
 * GET /api/gamification - Get student's gamification data
 */
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const GET = withAuthAndRateLimit(
  async (_request: NextRequest, session: any, _context: any) => {
    try {
      const student = await getAuthenticatedStudent(session.user.id);

      const gamification = await prisma.gamification.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
        },
        update: {},
        include: GAMIFICATION_INCLUDE,
      });

      return success({ gamification: formatGamification(gamification) });
    } catch (error) {
      return internalError(error, "Greška pri učitavanju XP podataka");
    }
  },
);

/**
 * POST /api/gamification/complete-homework
 * Called when homework is marked as done
 * TODO: Implement when Gamification model is added
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const session = await (await import("@/lib/auth/config")).auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await getAuthenticatedStudent(session.user.id);
    const { homeworkId } = await request.json();

    if (!homeworkId) {
      return badRequest("Homework ID required");
    }

    // Verify ownership
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework || homework.studentId !== student.id) {
      return forbidden();
    }

    const dueDate =
      homework.dueDate instanceof Date
        ? homework.dueDate
        : new Date(homework.dueDate);
    const isEarly = Number.isFinite(dueDate.getTime())
      ? dueDate.getTime() - Date.now() > 3 * 24 * 60 * 60 * 1000
      : false;

    await trackHomeworkCompletion(student.id, isEarly);

    const updated = await prisma.gamification.findUnique({
      where: { studentId: student.id },
      include: GAMIFICATION_INCLUDE,
    });

    if (!updated) {
      // Should not happen but keep safe default
      await addXP(student.id, 0, "SYNC");
    }

    log.info("Homework completion tracked", {
      studentId: student.id,
      homeworkId,
      isEarly,
    });

    return success(
      {
        message: isEarly
          ? "Bravo! +15 XP za rano urađen domaći! 🎉"
          : "Bravo! +10 XP! 🎉",
        gamification: formatGamification(updated),
      },
      201,
    );
  } catch (error) {
    log.error("Homework completion tracking failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
