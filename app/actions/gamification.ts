"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getXPForNextLevel } from "@/lib/gamification/xp-system";
import { maskLeaderboardName } from "@/lib/utils/privacy";

export type ActionState = {
  success?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  data?: any;
};

const GAMIFICATION_INCLUDE = {
  achievements: {
    orderBy: { unlockedAt: "desc" as const },
  },
};

function formatGamification(gamification: any) {
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
    streakFreezes: gamification.streakFreezes,
    weeklyXP: gamification.weeklyXP,
    monthlyXP: gamification.monthlyXP,
    showOnLeaderboard: gamification.showOnLeaderboard,
    xpToNextLevel,
    recentAchievements: gamification.achievements,
  };
}

export async function getGamificationAction(studentId?: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    let targetStudentId = studentId;

    // If no studentId provided, try to use current user's student profile
    if (!targetStudentId) {
      if (session.user.student) {
        targetStudentId = session.user.student.id;
      } else {
        return { error: "Niste učenik i niste odabrali učenika" };
      }
    }

    // Verify access
    if (targetStudentId !== session.user.student?.id) {
      // Check if guardian
      if (session.user.guardian) {
        const link = await prisma.link.findFirst({
          where: {
            guardianId: session.user.guardian.id,
            studentId: targetStudentId,
            isActive: true,
          },
        });
        if (!link) {
          return { error: "Nemate pristup podacima ovog učenika" };
        }
      } else {
        return { error: "Nemate pristup podacima ovog učenika" };
      }
    }

    const gamification = await prisma.gamification.upsert({
      where: { studentId: targetStudentId },
      create: {
        studentId: targetStudentId!,
      },
      update: {},
      include: GAMIFICATION_INCLUDE,
    });

    return { success: true, data: formatGamification(gamification) };
  } catch (error) {
    console.error("Get gamification error:", error);
    return { error: "Greška prilikom učitavanja gamification podataka" };
  }
}

const updateSettingsSchema = z.object({
  showOnLeaderboard: z.boolean(),
});

export async function updateGamificationSettingsAction(studentId: string, data: z.infer<typeof updateSettingsSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = updateSettingsSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  try {
    // Verify access
    if (session.user.student?.id !== studentId) {
        if (session.user.guardian) {
             const link = await prisma.link.findFirst({
                where: {
                    guardianId: session.user.guardian.id,
                    studentId: studentId,
                    isActive: true,
                },
            });
            if (!link) {
                return { error: "Nemate pristup" };
            }
        } else {
            return { error: "Nemate pristup" };
        }
    }

    const updated = await prisma.gamification.update({
      where: { studentId },
      data: {
        showOnLeaderboard: validated.data.showOnLeaderboard,
      },
      include: GAMIFICATION_INCLUDE,
    });

    revalidatePath("/dashboard");
    
    return { success: true, data: formatGamification(updated) };
  } catch (error) {
    console.error("Update gamification settings error:", error);
    return { error: "Greška prilikom ažuriranja podešavanja" };
  }
}

export async function getLeaderboardAction(period: "weekly" | "monthly" | "all-time" = "weekly"): Promise<ActionState> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  try {
    let orderBy: any = {};
    let where: any = {
      showOnLeaderboard: true,
    };

    if (period === "weekly") {
      orderBy = [{ weeklyXP: "desc" }, { xp: "desc" }];
      where.weeklyXP = { gt: 0 };
    } else if (period === "monthly") {
      orderBy = [{ monthlyXP: "desc" }, { xp: "desc" }];
      where.monthlyXP = { gt: 0 };
    } else {
      orderBy = [{ xp: "desc" }];
      where.xp = { gt: 0 };
    }

    const topStudents = await prisma.gamification.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            avatar: true,
            userId: true,
          },
        },
      },
      orderBy,
      take: 50,
    });

    const totalPlayers = await prisma.gamification.count({ where });

    const leaderboard = topStudents.map((entry, index) => {
      const isCurrentUser = entry.student.userId === currentUserId;
      
      return {
        rank: index + 1,
        studentId: entry.studentId,
        name: maskLeaderboardName(entry.student.name, isCurrentUser),
        avatar: entry.student.avatar,
        level: entry.level,
        weeklyXP: entry.weeklyXP,
        monthlyXP: entry.monthlyXP,
        xp: entry.xp,
        streak: entry.streak,
        isCurrentUser,
      };
    });

    // Find current user's rank if not in top 50
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
          let rankWhere: any = {
             showOnLeaderboard: true,
          };
          
          if (period === "weekly") {
             rankWhere.weeklyXP = { gt: userGamif.weeklyXP };
          } else if (period === "monthly") {
             rankWhere.monthlyXP = { gt: userGamif.monthlyXP };
          } else {
             rankWhere.xp = { gt: userGamif.xp };
          }

          const rank = await prisma.gamification.count({
            where: rankWhere,
          });

          currentUserRank = {
            rank: rank + 1,
            studentId: student.id,
            weeklyXP: userGamif.weeklyXP,
            monthlyXP: userGamif.monthlyXP,
            xp: userGamif.xp,
            level: userGamif.level,
          };
        }
      }
    }

    let resetsAt: Date | null = null;
    if (period === "weekly") {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      resetsAt = nextMonday;
    } else if (period === "monthly") {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      resetsAt = nextMonth;
    }

    return {
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        period,
        totalPlayers,
        resetsAt,
      },
    };
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return { error: "Greška prilikom učitavanja leaderboard-a" };
  }
}
