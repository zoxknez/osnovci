/**
 * Student Gamification Data API
 *
 * GET /api/gamification/student/[studentId]
 * Returns complete gamification data for a specific student
 */

import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function GET(
  _request: Request,
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

    // Verify student belongs to user
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student nije pronađen" },
        { status: 404 },
      );
    }

    // Check authorization
    if (student.userId !== session.user.id) {
      // Check if user is guardian
      const guardianLink = await prisma.link.findFirst({
        where: {
          studentId,
          guardian: {
            userId: session.user.id,
          },
          isActive: true,
        },
      });

      if (!guardianLink) {
        return NextResponse.json(
          { message: "Neautorizovan pristup" },
          { status: 403 },
        );
      }
    }

    // Get gamification data
    const gamif = await prisma.gamification.findUnique({
      where: { studentId },
      include: {
        achievements: {
          orderBy: { unlockedAt: "desc" },
          take: 20, // Recent 20
        },
      },
    });

    if (!gamif) {
      // Create gamification record if doesn't exist
      const newGamif = await prisma.gamification.create({
        data: { studentId },
        include: {
          achievements: true,
        },
      });

      return NextResponse.json({
        level: newGamif.level,
        xp: newGamif.xp,
        totalXPEarned: newGamif.totalXPEarned,
        streak: newGamif.streak,
        longestStreak: newGamif.longestStreak,
        streakFreezes: newGamif.streakFreezes,
        totalHomeworkDone: newGamif.totalHomeworkDone,
        weeklyXP: newGamif.weeklyXP,
        monthlyXP: newGamif.monthlyXP,
        showOnLeaderboard: newGamif.showOnLeaderboard,
        recentAchievements: [],
      });
    }

    // Get leaderboard position if visible
    let leaderboardPosition = null;
    if (gamif.showOnLeaderboard) {
      const rank = await prisma.gamification.count({
        where: {
          showOnLeaderboard: true,
          xp: {
            gt: gamif.xp,
          },
        },
      });

      const totalPlayers = await prisma.gamification.count({
        where: { showOnLeaderboard: true },
      });

      leaderboardPosition = {
        rank: rank + 1,
        totalPlayers,
      };
    }

    log.info("Student gamification data fetched", {
      studentId,
      level: gamif.level,
      xp: gamif.xp,
    });

    return NextResponse.json({
      level: gamif.level,
      xp: gamif.xp,
      totalXPEarned: gamif.totalXPEarned,
      streak: gamif.streak,
      longestStreak: gamif.longestStreak,
      streakFreezes: gamif.streakFreezes,
      totalHomeworkDone: gamif.totalHomeworkDone,
      weeklyXP: gamif.weeklyXP,
      monthlyXP: gamif.monthlyXP,
      showOnLeaderboard: gamif.showOnLeaderboard,
      recentAchievements: gamif.achievements,
      leaderboardPosition,
    });
  } catch (error) {
    log.error("Failed to fetch student gamification data", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju podataka" },
      { status: 500 },
    );
  }
}
