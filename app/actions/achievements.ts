"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-triggers";

export type ActionState<T = any> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function getAchievementsAction(
  studentIdParam?: string,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: {
          include: {
            links: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    let studentId: string;

    if (user?.student) {
      studentId = user.student.id;
    } else if (user?.guardian && studentIdParam) {
      const hasAccess = user.guardian.links.some(
        (link) => link.studentId === studentIdParam,
      );
      if (!hasAccess) {
        return { error: "Nemate pristup ovom učeniku" };
      }
      studentId = studentIdParam;
    } else {
      // If guardian but no studentIdParam, try to get first student
      const firstLink = user?.guardian?.links?.[0];
      if (firstLink) {
        studentId = firstLink.studentId;
      } else {
        return { error: "Nije pronađen učenik" };
      }
    }

    const gamification = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamification) {
      return { error: "Gamifikacija nije pronađena" };
    }

    const achievements = await prisma.achievement.findMany({
      where: { gamificationId: gamification.id },
      orderBy: { unlockedAt: "desc" },
    });

    // Get progress
    const progressResults = await checkAndUnlockAchievements(studentId);

    return {
      success: true,
      data: {
        achievements,
        progress: progressResults.filter((p) => !p.unlocked),
        stats: {
          total: achievements.length,
          totalXP: achievements.reduce((sum, a) => sum + (a.xpReward || 0), 0),
          level: gamification.level,
          currentXP: gamification.xp,
          totalXPEarned: gamification.totalXPEarned,
        },
      },
    };
  } catch (error) {
    console.error("Get achievements error:", error);
    return { error: "Greška prilikom učitavanja postignuća" };
  }
}

export async function checkAchievementsAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return { error: "Samo učenici mogu proveravati postignuća" };
    }

    const studentId = user.student.id;
    const results = await checkAndUnlockAchievements(studentId);

    const newUnlocks = results.filter((r) => r.unlocked).length;

    if (newUnlocks > 0) {
      revalidatePath("/dashboard/postignuca");
      revalidatePath("/dashboard");
    }

    return {
      success: true,
      data: {
        newUnlocks,
        checked: results.length,
      },
    };
  } catch (error) {
    console.error("Check achievements error:", error);
    return { error: "Greška prilikom provere postignuća" };
  }
}
