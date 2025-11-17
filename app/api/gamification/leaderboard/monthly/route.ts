/**
 * Leaderboard API - Monthly Rankings
 *
 * GET /api/gamification/leaderboard/monthly
 * Returns top students by monthly XP
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Get top students by monthly XP
    const topStudents = await prisma.gamification.findMany({
      where: {
        showOnLeaderboard: true,
        monthlyXP: {
          gt: 0,
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
      },
      orderBy: [{ monthlyXP: "desc" }, { xp: "desc" }],
      take: 50, // Top 50 monthly
    });

    const leaderboard = topStudents.map((entry, index) => ({
      rank: index + 1,
      studentId: entry.studentId,
      name: entry.student.name,
      avatar: entry.student.avatar,
      level: entry.level,
      monthlyXP: entry.monthlyXP,
      xp: entry.xp,
      streak: entry.streak,
      isCurrentUser: entry.student.userId === currentUserId,
    }));

    // Find current user's rank
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
          const rank = await prisma.gamification.count({
            where: {
              showOnLeaderboard: true,
              monthlyXP: {
                gt: userGamif.monthlyXP,
              },
            },
          });

          currentUserRank = {
            rank: rank + 1,
            studentId: student.id,
            monthlyXP: userGamif.monthlyXP,
            level: userGamif.level,
          };
        }
      }
    }

    log.info("Leaderboard (monthly) fetched", {
      count: leaderboard.length,
      userId: currentUserId,
    });

    return NextResponse.json({
      leaderboard,
      currentUserRank,
      period: "monthly",
      resetsAt: getFirstDayOfNextMonth(),
    });
  } catch (error) {
    log.error("Failed to fetch monthly leaderboard", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju mesečnog leaderboard-a" },
      { status: 500 },
    );
  }
}

function getFirstDayOfNextMonth(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth;
}
