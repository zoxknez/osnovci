/**
 * Leaderboard API - All-Time Rankings
 *
 * GET /api/gamification/leaderboard/all-time
 * Returns top students by total XP with privacy controls
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { maskLeaderboardName } from "@/lib/utils/privacy";

export async function GET() {
  try {
    // Optional: Require authentication
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Get top students
    const topStudents = await prisma.gamification.findMany({
      where: {
        showOnLeaderboard: true, // Privacy filter
        xp: {
          gt: 0, // At least some XP
        },
      },
      include: {
        student: {
          select: {
            name: true,
            avatar: true,
            userId: true,
          },
        },
        achievements: {
          select: {
            rarity: true,
          },
        },
      },
      orderBy: [{ xp: "desc" }, { level: "desc" }],
      take: 100, // Top 100
    });

    // Format response
    const leaderboard = topStudents.map((entry, index) => {
      // Count achievements by rarity
      const achievementCounts = entry.achievements.reduce(
        (acc, achievement) => {
          acc[achievement.rarity] = (acc[achievement.rarity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const isCurrentUser = entry.student.userId === currentUserId;
      
      return {
        rank: index + 1,
        studentId: entry.studentId,
        name: maskLeaderboardName(entry.student.name, isCurrentUser),
        avatar: entry.student.avatar,
        level: entry.level,
        xp: entry.xp,
        totalXPEarned: entry.totalXPEarned,
        streak: entry.streak,
        longestStreak: entry.longestStreak,
        totalHomeworkDone: entry.totalHomeworkDone,
        achievementCounts,
        isCurrentUser,
      };
    });

    // Find current user's rank if not in top 100
    let currentUserRank = null;
    if (currentUserId) {
      const student = await prisma.student.findUnique({
        where: { userId: currentUserId },
      });

      if (student) {
        const userGamif = await prisma.gamification.findUnique({
          where: { studentId: student.id },
        });

        if (userGamif && !leaderboard.some((e) => e.studentId === student.id)) {
          // Count how many students have more XP
          const rank = await prisma.gamification.count({
            where: {
              showOnLeaderboard: true,
              xp: {
                gt: userGamif.xp,
              },
            },
          });

          currentUserRank = {
            rank: rank + 1,
            studentId: student.id,
            level: userGamif.level,
            xp: userGamif.xp,
            streak: userGamif.streak,
          };
        }
      }
    }

    log.info("Leaderboard (all-time) fetched", {
      count: leaderboard.length,
      userId: currentUserId,
    });

    return NextResponse.json({
      leaderboard,
      currentUserRank,
      totalPlayers: await prisma.gamification.count({
        where: { showOnLeaderboard: true },
      }),
    });
  } catch (error) {
    log.error("Failed to fetch all-time leaderboard", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju leaderboard-a" },
      { status: 500 },
    );
  }
}
