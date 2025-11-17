// XP & Leveling System - Gamification for kids
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { createNotification } from "@/lib/notifications/create";
import { checkAchievements } from "./achievements";

// XP Rewards
export const XP_REWARDS = {
  HOMEWORK_COMPLETED: 10,
  HOMEWORK_EARLY: 15, // 3+ days before due date
  PERFECT_WEEK: 50, // All homework done this week
  STREAK_DAY: 5, // Each day in streak
  LEVEL_UP: 20, // Bonus when leveling up
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0, // Level 1
  50, // Level 2
  150, // Level 3
  300, // Level 4
  500, // Level 5
  750, // Level 6
  1050, // Level 7
  1400, // Level 8
  1800, // Level 9
  2300, // Level 10
  // ... continue up to 50
];

/**
 * Add XP to student
 */
export async function addXP(studentId: string, amount: number, reason: string) {
  try {
    // Get or create gamification record
    let gamif = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamif) {
      gamif = await prisma.gamification.create({
        data: { studentId },
      });
    }

    const newXP = gamif.xp + amount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > gamif.level;

    // Update gamification
    const updated = await prisma.gamification.update({
      where: { id: gamif.id },
      data: {
        xp: newXP,
        level: newLevel,
        totalXPEarned: gamif.totalXPEarned + amount,
        updatedAt: new Date(),
      },
    });

    log.info("XP added", {
      studentId,
      amount,
      reason,
      newXP,
      newLevel,
      leveledUp,
    });

    // Level up notification
    if (leveledUp) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      const userId = student?.userId;
      
      if (!userId) return updated;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        await createNotification({
          userId: user.id,
          type: "HOMEWORK_SUBMITTED", // Reuse enum (or create LEVEL_UP)
          title: `Level Up! 🎉 Level ${newLevel}!`,
          message: `Čestitamo! Dostigao si Level ${newLevel}! Nastavi tako!`,
          data: { level: newLevel, xp: newXP },
        });

        // Check for level milestone achievements
        await checkAchievements(gamif.id, "LEVEL_MILESTONE", newLevel);
      }
    }

    return updated;
  } catch (error) {
    log.error("Failed to add XP", { error, studentId, amount });
    throw error;
  }
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && xp >= threshold) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    return lastThreshold ?? 0;
  }
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  return nextThreshold ?? 0;
}

/**
 * Update streak (call daily when student completes homework)
 */
export async function updateStreak(studentId: string) {
  try {
    const gamif = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamif) return null;

    const today = new Date();
    const lastActivity = gamif.lastActivityDate;

    let newStreak = gamif.streak;

    if (!lastActivity) {
      // First activity
      newStreak = 1;
    } else {
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastActivity === 1) {
        // Consecutive day!
        newStreak = gamif.streak + 1;

        // Streak XP bonus
        await addXP(studentId, XP_REWARDS.STREAK_DAY, "Streak bonus");

        // Check streak achievements
        if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
          await checkAchievements(gamif.id, "STREAK_MILESTONE", newStreak);
        }
      } else if (daysSinceLastActivity > 1) {
        // Streak broken 😢
        newStreak = 1;
      }
      // daysSinceLastActivity === 0 -> same day, keep streak
    }

    const longestStreak = Math.max(gamif.longestStreak, newStreak);

    const updated = await prisma.gamification.update({
      where: { id: gamif.id },
      data: {
        streak: newStreak,
        longestStreak,
        lastActivityDate: today,
      },
    });

    log.info("Streak updated", {
      studentId,
      streak: newStreak,
      longestStreak,
    });

    return updated;
  } catch (error) {
    log.error("Failed to update streak", { error, studentId });
    throw error;
  }
}

// NOTE: checkAchievements is imported from achievements.ts to avoid circular dependencies

/**
 * Track homework completion
 */
export async function trackHomeworkCompletion(
  studentId: string,
  early = false,
) {
  try {
    const gamif = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamif) return;

    // Increment total homework done
    const newTotal = gamif.totalHomeworkDone + 1;

    await prisma.gamification.update({
      where: { id: gamif.id },
      data: {
        totalHomeworkDone: newTotal,
      },
    });

    // Add XP
    const xpAmount = early
      ? XP_REWARDS.HOMEWORK_EARLY
      : XP_REWARDS.HOMEWORK_COMPLETED;
    await addXP(
      studentId,
      xpAmount,
      early ? "Homework (early!)" : "Homework completed",
    );

    // Update streak
    await updateStreak(studentId);

    // Check milestones
    await checkAchievements(gamif.id, "HOMEWORK_MILESTONE", newTotal);
    if (early) {
      await checkAchievements(gamif.id, "EARLY_BIRD", 1);
    }
  } catch (error) {
    log.error("Failed to track homework completion", { error, studentId });
  }
}
