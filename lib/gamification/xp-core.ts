/**
 * Core XP System - NO external dependencies (no achievements.ts import)
 *
 * This module contains the foundational XP and leveling logic.
 * It is imported by both xp-system.ts and achievements.ts to avoid circular dependencies.
 */

import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { createNotification } from "@/lib/notifications/create";

// ============================================
// XP REWARDS (Enhanced V3)
// ============================================

export const XP_REWARDS = {
  // Base rewards (reduced from v2)
  HOMEWORK_COMPLETED: 8, // Was 10
  HOMEWORK_EARLY: 12, // Was 15
  HOMEWORK_VERY_EARLY: 18, // Was 25

  // Time-based bonuses (reduced)
  WEEKEND_BONUS: 3, // Was 5
  NIGHT_OWL_BONUS: 2, // Was 3
  MORNING_BONUS: 2, // Was 3

  // Quality bonuses (harder to get)
  PERFECT_SCORE: 15, // Was 20
  FAST_COMPLETION: 5, // Was 10
  DETAILED_NOTES: 3, // Was 5

  // Streaks (with diminishing returns)
  STREAK_DAY: 3, // Was 5
  STREAK_MULTIPLIER: 0.05, // Was 0.1 (5% instead of 10%)
  STREAK_CAP: 10, // Max 10 days streak bonus (50% max)

  // Milestones (keep high for motivation)
  PERFECT_WEEK: 50,
  LEVEL_UP: 20,

  // Social & Special
  HELPED_PEER: 15,
  COMEBACK: 30,
} as const;

// ============================================
// ANTI-GAMING MEASURES
// ============================================

export const XP_LIMITS = {
  MAX_DAILY_XP: 100, // 100 XP per day max
  MAX_WEEKLY_XP: 500, // 500 XP per week max
  MAX_HOMEWORK_PER_DAY: 10, // Max 10 homework submissions per day
  COOLDOWN_MINUTES: 5, // 5 min cooldown between submissions
} as const;

// ============================================
// LEVEL THRESHOLDS (Refined progression curve V3)
// ============================================

export const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2  (+50 from v2)
  250, // Level 3  (+100)
  450, // Level 4  (+150)
  700, // Level 5  (+200)
  1000, // Level 6  (+250)
  1350, // Level 7  (+300)
  1750, // Level 8  (+350)
  2200, // Level 9  (+400)
  2700, // Level 10 (+400)
  3250, // Level 11 (+350)
  3850, // Level 12 (+250)
  4500, // Level 13 (+100)
  5200, // Level 14 (-100)
  5950, // Level 15 (-350)
  6750, // Level 16 (-650)
  7600, // Level 17 (-1000)
  8500, // Level 18 (-1400)
  9450, // Level 19 (-1850)
  10450, // Level 20 (-2350)
  // Levels 21-50 follow exponential curve
  11550,
  12750,
  14050,
  15450,
  16950, // 21-25
  18550,
  20250,
  22050,
  23950,
  25950, // 26-30
  28050,
  30250,
  32550,
  34950,
  37450, // 31-35
  40050,
  42750,
  45550,
  48450,
  51450, // 36-40
  54550,
  57750,
  61050,
  64450,
  67950, // 41-45
  71550,
  75250,
  79050,
  82950,
  86950, // 46-50
];

// ============================================
// CORE FUNCTIONS (No external gamification imports)
// ============================================

/**
 * Add XP to student with enhanced calculation
 *
 * NOTE: This function does NOT call checkAchievements to avoid circular dependencies.
 * The caller should handle achievement checks separately.
 */
export async function addXPCore(
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
  options?: {
    skipLevelUpNotification?: boolean;
    onLevelUp?: (newLevel: number, gamificationId: string) => Promise<void>;
    tx?: any; // Prisma Transaction Client
  },
) {
  try {
    const db = options?.tx || prisma;

    // Get or create gamification record
    let gamif = await db.gamification.findUnique({
      where: { studentId },
    });

    if (!gamif) {
      gamif = await db.gamification.create({
        data: { studentId },
      });
    }

    // Calculate bonus multipliers
    const { totalXP, bonuses, capped, capReason } = calculateXP({
      baseAmount,
      streak: gamif.streak,
      isWeekend: metadata?.isWeekend ?? false,
      isNight: metadata?.isNight ?? false,
      isMorning: metadata?.isMorning ?? false,
      isPerfect: metadata?.isPerfect ?? false,
      isFast: metadata?.isFast ?? false,
      hasDetailedNotes: metadata?.hasDetailedNotes ?? false,
      currentDailyXP: 0, // TODO: Track daily XP in DB if needed, for now we rely on weekly cap
      currentWeeklyXP: gamif.weeklyXP,
    });

    const totalAmount = totalXP;

    if (capped && capReason) {
      bonuses.push(`(Capped: ${capReason})`);
    }

    const newXP = gamif.xp + totalAmount;
    const newWeeklyXP = gamif.weeklyXP + totalAmount;
    const newMonthlyXP = gamif.monthlyXP + totalAmount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > gamif.level;

    // Update gamification
    const updated = await db.gamification.update({
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
      await db.gamification.update({
        where: { id: gamif.id },
        data: {
          xp: newXP + bonusXP,
          totalXPEarned: gamif.totalXPEarned + totalAmount + bonusXP,
        },
      });

      if (!options?.skipLevelUpNotification) {
        const student = await db.student.findUnique({
          where: { id: studentId },
          include: { user: true },
        });

        if (student) {
          // Note: Notifications might need to be outside transaction if they use external services
          // But here we just create a record in DB usually
          await createNotification({
            userId: student.user.id,
            type: "LEVEL_UP" as any, // Cast to any until types are regenerated
            title: `🎉 Level Up! Level ${newLevel}!`,
            message: `Čestitamo! Dostigao si Level ${newLevel}! +${bonusXP} XP bonus!`,
            data: { level: newLevel, xp: newXP, bonusXP },
          });

          // Award streak freeze power-up every 5 levels
          if (newLevel % 5 === 0) {
            await db.gamification.update({
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

      // Callback for level-up specific logic (e.g., checkAchievements)
      if (options?.onLevelUp) {
        await options.onLevelUp(newLevel, gamif.id);
      }
    }

    return { updated, bonuses, totalAmount, leveledUp, newLevel };
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

// ============================================
// XP CALCULATION HELPERS
// ============================================

/**
 * Calculate XP with all bonuses and caps applied
 */
export function calculateXP(params: {
  baseAmount: number;
  streak?: number;
  isWeekend?: boolean;
  isNight?: boolean;
  isMorning?: boolean;
  isPerfect?: boolean;
  isFast?: boolean;
  hasDetailedNotes?: boolean;
  currentDailyXP?: number;
  currentWeeklyXP?: number;
}): {
  totalXP: number;
  bonuses: string[];
  capped: boolean;
  capReason?: string;
} {
  const {
    baseAmount,
    streak = 0,
    isWeekend = false,
    isNight = false,
    isMorning = false,
    isPerfect = false,
    isFast = false,
    hasDetailedNotes = false,
    currentDailyXP = 0,
    currentWeeklyXP = 0,
  } = params;

  let totalXP = baseAmount;
  const bonuses: string[] = [];

  // Time-based bonuses
  if (isWeekend) {
    totalXP += XP_REWARDS.WEEKEND_BONUS;
    bonuses.push(`Weekend +${XP_REWARDS.WEEKEND_BONUS}`);
  }
  if (isNight) {
    totalXP += XP_REWARDS.NIGHT_OWL_BONUS;
    bonuses.push(`Night Owl +${XP_REWARDS.NIGHT_OWL_BONUS}`);
  }
  if (isMorning) {
    totalXP += XP_REWARDS.MORNING_BONUS;
    bonuses.push(`Early Bird +${XP_REWARDS.MORNING_BONUS}`);
  }

  // Quality bonuses
  if (isPerfect) {
    totalXP += XP_REWARDS.PERFECT_SCORE;
    bonuses.push(`Perfect +${XP_REWARDS.PERFECT_SCORE}`);
  }
  if (isFast) {
    totalXP += XP_REWARDS.FAST_COMPLETION;
    bonuses.push(`Speed +${XP_REWARDS.FAST_COMPLETION}`);
  }
  if (hasDetailedNotes) {
    totalXP += XP_REWARDS.DETAILED_NOTES;
    bonuses.push(`Detailed +${XP_REWARDS.DETAILED_NOTES}`);
  }

  // Streak multiplier (capped at 10 days = 50% max bonus)
  if (streak > 0) {
    const effectiveStreak = Math.min(streak, XP_REWARDS.STREAK_CAP);
    const streakBonus = Math.floor(
      baseAmount * effectiveStreak * XP_REWARDS.STREAK_MULTIPLIER,
    );

    if (streakBonus > 0) {
      totalXP += streakBonus;
      bonuses.push(`Streak x${effectiveStreak} +${streakBonus}`);
    }
  }

  // Apply caps
  let capped = false;
  let capReason: string | undefined;

  // Daily cap
  if (currentDailyXP + totalXP > XP_LIMITS.MAX_DAILY_XP) {
    const remaining = Math.max(0, XP_LIMITS.MAX_DAILY_XP - currentDailyXP);
    totalXP = remaining;
    capped = true;
    capReason = "Daily XP limit reached";
  }

  // Weekly cap
  if (currentWeeklyXP + totalXP > XP_LIMITS.MAX_WEEKLY_XP) {
    const remaining = Math.max(0, XP_LIMITS.MAX_WEEKLY_XP - currentWeeklyXP);
    totalXP = remaining;
    capped = true;
    capReason = "Weekly XP limit reached";
  }

  return {
    totalXP,
    bonuses,
    capped,
    ...(capReason && { capReason }),
  };
}

/**
 * Validate homework submission (anti-gaming checks)
 */
export async function validateHomeworkSubmission(studentId: string): Promise<{
  allowed: boolean;
  reason?: string;
  cooldownRemaining?: number;
}> {
  // Check: Max homework COMPLETED per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const homeworkCompletedToday = await prisma.homework.count({
    where: {
      studentId,
      completedAt: {
        gte: today,
      },
    },
  });

  if (homeworkCompletedToday >= XP_LIMITS.MAX_HOMEWORK_PER_DAY) {
    return {
      allowed: false,
      reason: `Dostigao si limit od ${XP_LIMITS.MAX_HOMEWORK_PER_DAY} završenih zadataka dnevno`,
    };
  }

  // Check: Cooldown between submissions (completions)
  const lastCompletedHomework = await prisma.homework.findFirst({
    where: {
      studentId,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  if (lastCompletedHomework && lastCompletedHomework.completedAt) {
    const cooldownMs = XP_LIMITS.COOLDOWN_MINUTES * 60 * 1000;
    const timeSinceLastMs =
      Date.now() - lastCompletedHomework.completedAt.getTime();

    if (timeSinceLastMs < cooldownMs) {
      const remainingMs = cooldownMs - timeSinceLastMs;
      const remainingMin = Math.ceil(remainingMs / 60000);

      return {
        allowed: false,
        reason: `Sačekaj ${remainingMin} minuta pre sledećeg zadatka`,
        cooldownRemaining: remainingMs,
      };
    }
  }

  return { allowed: true };
}
