/**
 * Leaderboard API - Weekly Rankings
 *
 * GET /api/gamification/leaderboard/weekly
 * Returns top students by weekly XP
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Get top students by weekly XP
    const topStudents = await prisma.gamification.findMany({
      where: {
        showOnLeaderboard: true,
        weeklyXP: {
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
      orderBy: [{ weeklyXP: "desc" }, { xp: "desc" }],
      take: 50, // Top 50 weekly
    });

    const leaderboard = topStudents.map((entry, index) => ({
      rank: index + 1,
      studentId: entry.studentId,
      name: entry.student.name,
      avatar: entry.student.avatar,
      level: entry.level,
      weeklyXP: entry.weeklyXP,
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
              weeklyXP: {
                gt: userGamif.weeklyXP,
              },
            },
          });

          currentUserRank = {
            rank: rank + 1,
            studentId: student.id,
            weeklyXP: userGamif.weeklyXP,
            level: userGamif.level,
          };
        }
      }
    }

    log.info("Leaderboard (weekly) fetched", {
      count: leaderboard.length,
      userId: currentUserId,
    });

    return NextResponse.json({
      leaderboard,
      currentUserRank,
      period: "weekly",
      resetsAt: getNextMonday(),
    });
  } catch (error) {
    log.error("Failed to fetch weekly leaderboard", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju nedeljnog leaderboard-a" },
      { status: 500 },
    );
  }
}

function getNextMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}
