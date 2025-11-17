/**
 * Enhanced XP & Leveling System - Gamification v2
 *
 * Improvements:
 * - Dynamic XP calculation based on multiple factors
 * - Weekly & monthly XP tracking
 * - Time-based bonuses (early bird, night owl, weekend warrior)
 * - Difficulty multipliers
 * - Streak multipliers
 * - Combo bonuses
 * - 15 achievement types (9 new)
 * - Progress tracking for achievements
 * - Hidden achievements
 * - Streak freeze power-ups
 */

import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { createNotification } from "@/lib/notifications/create";
import { checkAchievements } from "./achievements";

// ============================================
// XP REWARDS (Enhanced)
// ============================================

export const XP_REWARDS = {
  // Base rewards
  HOMEWORK_COMPLETED: 10,
  HOMEWORK_EARLY: 15, // 3+ days before due date
  HOMEWORK_VERY_EARLY: 25, // 7+ days before due date

  // Time-based bonuses
  WEEKEND_BONUS: 5, // Weekend completion
  NIGHT_OWL_BONUS: 3, // Completed after 8 PM
  MORNING_BONUS: 3, // Completed before 8 AM

  // Quality bonuses
  PERFECT_SCORE: 20, // No mistakes
  FAST_COMPLETION: 10, // < 30 minutes
  DETAILED_NOTES: 5, // Added detailed notes

  // Streaks & consistency
  STREAK_DAY: 5, // Each day in streak
  STREAK_MULTIPLIER: 0.1, // 10% bonus per streak day (max 50%)

  // Milestones
  PERFECT_WEEK: 50,
  LEVEL_UP: 20,

  // Social
  HELPED_PEER: 15, // Helped another student

  // Special
  COMEBACK: 30, // Returned after 7+ days break
};

// ============================================
// LEVEL THRESHOLDS (Refined progression curve)
// ============================================

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
  2900, // Level 11
  3600, // Level 12
  4400, // Level 13
  5300, // Level 14
  6300, // Level 15
  7400, // Level 16
  8600, // Level 17
  9900, // Level 18
  11300, // Level 19
  12800, // Level 20
  14500, // Level 21
  16300, // Level 22
  18200, // Level 23
  20200, // Level 24
  22300, // Level 25
  24500, // Level 26
  26800, // Level 27
  29200, // Level 28
  31700, // Level 29
  34300, // Level 30
  37000, // Level 31
  39800, // Level 32
  42700, // Level 33
  45700, // Level 34
  48800, // Level 35
  52000, // Level 36
  55300, // Level 37
  58700, // Level 38
  62200, // Level 39
  65800, // Level 40
  69500, // Level 41
  73300, // Level 42
  77200, // Level 43
  81200, // Level 44
  85300, // Level 45
  89500, // Level 46
  93800, // Level 47
  98200, // Level 48
  102700, // Level 49
  107300, // Level 50 (MAX)
];

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Add XP to student with enhanced calculation
 */
export async function addXP(
  studentId: string,
  baseAmount: number,
  reason: string,
  metadata?: {
    isWeekend?: boolean;
    isNight?: boolean;
    isMorning?: boolean;
    isFast?: boolean;
    isPerfect?: boolean;
    hasDetailedNotes?: boolean;
    applyStreakMultiplier?: boolean;
  },
) {
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

    // Calculate bonus multipliers
    let totalAmount = baseAmount;
    const bonuses: string[] = [];

    // Time-based bonuses
    if (metadata?.isWeekend) {
      totalAmount += XP_REWARDS.WEEKEND_BONUS;
      bonuses.push("Weekend Warrior +5");
    }
    if (metadata?.isNight) {
      totalAmount += XP_REWARDS.NIGHT_OWL_BONUS;
      bonuses.push("Night Owl +3");
    }
    if (metadata?.isMorning) {
      totalAmount += XP_REWARDS.MORNING_BONUS;
      bonuses.push("Early Riser +3");
    }

    // Quality bonuses
    if (metadata?.isPerfect) {
      totalAmount += XP_REWARDS.PERFECT_SCORE;
      bonuses.push("Perfect! +20");
    }
    if (metadata?.isFast) {
      totalAmount += XP_REWARDS.FAST_COMPLETION;
      bonuses.push("Speed Demon +10");
    }
    if (metadata?.hasDetailedNotes) {
      totalAmount += XP_REWARDS.DETAILED_NOTES;
      bonuses.push("Detailed Notes +5");
    }

    // Streak multiplier (max 50% bonus)
    if (metadata?.applyStreakMultiplier && gamif.streak > 0) {
      const streakBonus = Math.min(
        Math.floor(baseAmount * gamif.streak * XP_REWARDS.STREAK_MULTIPLIER),
        Math.floor(baseAmount * 0.5),
      );
      if (streakBonus > 0) {
        totalAmount += streakBonus;
        bonuses.push(`Streak x${gamif.streak} +${streakBonus}`);
      }
    }

    const newXP = gamif.xp + totalAmount;
    const newWeeklyXP = gamif.weeklyXP + totalAmount;
    const newMonthlyXP = gamif.monthlyXP + totalAmount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > gamif.level;

    // Update gamification
    const updated = await prisma.gamification.update({
      where: { id: gamif.id },
      data: {
        xp: newXP,
        level: newLevel,
        totalXPEarned: gamif.totalXPEarned + totalAmount,
        weeklyXP: newWeeklyXP,
        monthlyXP: newMonthlyXP,
        updatedAt: new Date(),
      },
    });

    log.info("XP added", {
      studentId,
      baseAmount,
      totalAmount,
      bonuses,
      reason,
      newXP,
      newLevel,
      leveledUp,
    });

    // Level up notification & rewards
    if (leveledUp) {
      const bonusXP = XP_REWARDS.LEVEL_UP;
      await prisma.gamification.update({
        where: { id: gamif.id },
        data: {
          xp: newXP + bonusXP,
          totalXPEarned: gamif.totalXPEarned + totalAmount + bonusXP,
        },
      });

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      });

      if (student) {
        await createNotification({
          userId: student.user.id,
          type: "HOMEWORK_SUBMITTED",
          title: `🎉 Level Up! Level ${newLevel}!`,
          message: `Čestitamo! Dostigao si Level ${newLevel}! +${bonusXP} XP bonus!`,
          data: { level: newLevel, xp: newXP, bonusXP },
        });

        // Check for level milestone achievements
        await checkAchievements(gamif.id, "LEVEL_MILESTONE", newLevel);

        // Award streak freeze power-up every 5 levels
        if (newLevel % 5 === 0) {
          await prisma.gamification.update({
            where: { id: gamif.id },
            data: {
              streakFreezes: gamif.streakFreezes + 1,
            },
          });

          await createNotification({
            userId: student.user.id,
            type: "HOMEWORK_SUBMITTED",
            title: "🛡️ Novi Streak Freeze!",
            message: `Dobio si Streak Freeze! Možeš propustiti 1 dan bez gubitka streak-a.`,
            data: { streakFreezes: gamif.streakFreezes + 1 },
          });
        }
      }
    }

    return { updated, bonuses, totalAmount };
  } catch (error) {
    log.error("Failed to add XP", { error, studentId, baseAmount });
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
 * Get progress percentage to next level
 */
export function getLevelProgress(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 100;
  }

  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] ?? 0;
  const progressXP = currentXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return Math.floor((progressXP / requiredXP) * 100);
}

/**
 * Enhanced streak update with freeze power-up
 */
export async function updateStreak(studentId: string, forceIncrement = false) {
  try {
    const gamif = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamif) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const lastActivity = gamif.lastActivityDate;

    let newStreak = gamif.streak;
    let usedFreeze = false;

    if (!lastActivity) {
      // First activity
      newStreak = 1;
    } else {
      const lastActivityNormalized = new Date(lastActivity);
      lastActivityNormalized.setHours(0, 0, 0, 0);

      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastActivityNormalized.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastActivity === 0 && !forceIncrement) {
        // Same day, keep streak
        return gamif;
      } else if (daysSinceLastActivity === 1 || forceIncrement) {
        // Consecutive day!
        newStreak = gamif.streak + 1;

        // Streak XP bonus
        await addXP(
          studentId,
          XP_REWARDS.STREAK_DAY,
          `Streak Day ${newStreak}`,
          {
            applyStreakMultiplier: false,
          },
        );

        // Check streak achievements
        if ([7, 14, 30, 50, 100, 365].includes(newStreak)) {
          await checkAchievements(gamif.id, "STREAK_MILESTONE", newStreak);
        }
      } else if (daysSinceLastActivity === 2 && gamif.streakFreezes > 0) {
        // Missed 1 day but have streak freeze - use it!
        usedFreeze = true;
        newStreak = gamif.streak; // Keep streak

        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: { user: true },
        });

        if (student) {
          await createNotification({
            userId: student.user.id,
            type: "HOMEWORK_SUBMITTED",
            title: "🛡️ Streak Freeze Aktiviran!",
            message: `Tvoj streak od ${newStreak} dana je spašen! Preostalo freeze-ova: ${gamif.streakFreezes - 1}`,
            data: { streak: newStreak, freezesLeft: gamif.streakFreezes - 1 },
          });
        }
      } else if (daysSinceLastActivity > 1) {
        // Streak broken 😢
        const oldStreak = gamif.streak;
        newStreak = 1;

        // Comeback achievement if returning after 7+ days
        if (daysSinceLastActivity >= 7) {
          await addXP(studentId, XP_REWARDS.COMEBACK, "Welcome back!");
          await checkAchievements(gamif.id, "COMEBACK_KID", 1);
        }

        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: { user: true },
        });

        if (student && oldStreak >= 7) {
          await createNotification({
            userId: student.user.id,
            type: "HOMEWORK_SUBMITTED",
            title: "💔 Streak Prekinut",
            message: `Tvoj streak od ${oldStreak} dana je prekinut. Počni novi!`,
            data: { oldStreak, newStreak },
          });
        }
      }
    }

    const longestStreak = Math.max(gamif.longestStreak, newStreak);

    const updated = await prisma.gamification.update({
      where: { id: gamif.id },
      data: {
        streak: newStreak,
        longestStreak,
        lastActivityDate: today,
        streakFreezes: usedFreeze
          ? gamif.streakFreezes - 1
          : gamif.streakFreezes,
        lastStreakFreeze: usedFreeze ? today : gamif.lastStreakFreeze,
      },
    });

    log.info("Streak updated", {
      studentId,
      streak: newStreak,
      longestStreak,
      usedFreeze,
    });

    return updated;
  } catch (error) {
    log.error("Failed to update streak", { error, studentId });
    throw error;
  }
}

/**
 * Reset weekly/monthly XP counters (should be called by cron job)
 */
export async function resetPeriodicXP() {
  try {
    const now = new Date();

    // Reset weekly XP (every Monday)
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 1) {
      // Monday
      await prisma.gamification.updateMany({
        where: {
          lastWeekReset: {
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
        data: {
          weeklyXP: 0,
          lastWeekReset: now,
        },
      });
      log.info("Weekly XP reset completed");
    }

    // Reset monthly XP (first day of month)
    if (now.getDate() === 1) {
      await prisma.gamification.updateMany({
        where: {
          lastMonthReset: {
            lt: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          },
        },
        data: {
          monthlyXP: 0,
          lastMonthReset: now,
        },
      });
      log.info("Monthly XP reset completed");
    }
  } catch (error) {
    log.error("Failed to reset periodic XP", error);
  }
}
