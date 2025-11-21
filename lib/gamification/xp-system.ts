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
import { checkAndUnlockAchievements } from "./achievement-triggers";
import {
  addXPCore,
  calculateLevel,
  getXPForNextLevel,
  getLevelProgress,
  validateHomeworkSubmission,
  LEVEL_THRESHOLDS,
  XP_REWARDS,
} from "./xp-core";

// Re-export core functions and constants
export { calculateLevel, getXPForNextLevel, getLevelProgress, validateHomeworkSubmission, LEVEL_THRESHOLDS, XP_REWARDS };

// ============================================
// ENHANCED XP FUNCTIONS WITH ACHIEVEMENTS
// ============================================

/**
 * Add XP to student with enhanced calculation + achievement checks
 * 
 * This is a wrapper around addXPCore that also handles checkAchievements calls.
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
  tx?: any // Prisma Transaction Client
) {
  // Call core XP function with achievement callback
  const result = await addXPCore(studentId, baseAmount, reason, metadata, {
    onLevelUp: async () => {
      // Check for level milestone achievements
      // Note: checkAndUnlockAchievements might need tx support too, but for now we keep it simple
      // If it fails, it's not critical for data integrity of XP
      await checkAndUnlockAchievements(studentId);
    },
    tx,
  });

  return result;
}

/**
 * Enhanced streak update with freeze power-up
 */
export async function updateStreak(studentId: string, forceIncrement = false, tx?: any) {
  try {
    const db = tx || prisma;
    const gamif = await db.gamification.findUnique({
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
          db
        );

        // Check streak achievements
        if ([7, 14, 30, 50, 100, 365].includes(newStreak)) {
          await checkAndUnlockAchievements(studentId);
        }
      } else if (daysSinceLastActivity === 2 && gamif.streakFreezes > 0) {
        // Missed 1 day but have streak freeze - use it!
        usedFreeze = true;
        newStreak = gamif.streak; // Keep streak

        const student = await db.student.findUnique({
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
          await addXP(studentId, XP_REWARDS.COMEBACK, "Welcome back!", undefined, db);
          await checkAndUnlockAchievements(studentId);
        }

        const student = await db.student.findUnique({
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

    const updated = await db.gamification.update({
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

/**
 * Track homework completion with enhanced logic
 */
export async function trackHomeworkCompletion(
  studentId: string,
  early = false,
) {
  try {
    // Anti-gaming check
    const validation = await validateHomeworkSubmission(studentId);
    if (!validation.allowed) {
      log.warn("XP blocked by anti-gaming check", { studentId, reason: validation.reason });
      return;
    }

    const gamif = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamif) return;

    // Use transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // Increment total homework done
      const newTotal = gamif.totalHomeworkDone + 1;

      await tx.gamification.update({
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
        {
          applyStreakMultiplier: true,
        },
        tx
      );

      // Update streak
      await updateStreak(studentId, false, tx);
    });

    // Check milestones (outside transaction to avoid long locks)
    await checkAndUnlockAchievements(studentId);
    
    // Trigger specific achievement checks
    if (early) {
      // Check early submission achievements specifically if needed
      // But checkAndUnlockAchievements covers all types
    }
  } catch (error) {
    log.error("Failed to track homework completion", { error, studentId });
  }
}
