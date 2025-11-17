/**
 * Enhanced XP System Configuration v3
 * Rebalanced for fair and sustainable progression
 * 
 * Changes from v2:
 * - Reduced base XP rewards (prevent level inflation)
 * - Capped streak multiplier (prevent exponential growth)
 * - Added daily/weekly XP limits (anti-gaming measures)
 * - Adjusted level thresholds (slower but more rewarding progression)
 */

// ============================================
// REBALANCED XP REWARDS
// ============================================

export const XP_REWARDS_V3 = {
  // Base rewards (reduced from v2)
  HOMEWORK_COMPLETED: 8,        // Was 10
  HOMEWORK_EARLY: 12,           // Was 15
  HOMEWORK_VERY_EARLY: 18,      // Was 25

  // Time-based bonuses (reduced)
  WEEKEND_BONUS: 3,             // Was 5
  NIGHT_OWL_BONUS: 2,           // Was 3
  MORNING_BONUS: 2,             // Was 3

  // Quality bonuses (harder to get)
  PERFECT_SCORE: 15,            // Was 20
  FAST_COMPLETION: 5,           // Was 10
  DETAILED_NOTES: 3,            // Was 5

  // Streaks (with diminishing returns)
  STREAK_DAY: 3,                // Was 5
  STREAK_MULTIPLIER: 0.05,      // Was 0.1 (5% instead of 10%)
  STREAK_CAP: 10,               // Max 10 days streak bonus (50% max)

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
  MAX_DAILY_XP: 100,            // 100 XP per day max
  MAX_WEEKLY_XP: 500,           // 500 XP per week max
  MAX_HOMEWORK_PER_DAY: 10,     // Max 10 homework submissions per day
  COOLDOWN_MINUTES: 5,          // 5 min cooldown between submissions
} as const;

// ============================================
// ADJUSTED LEVEL THRESHOLDS
// ============================================
// Slower progression but more meaningful levels
// Old: Level 10 at 2300 XP
// New: Level 10 at 3000 XP (+30% slower)

export const LEVEL_THRESHOLDS_V3 = [
  0,      // Level 1
  100,    // Level 2  (+50 from v2)
  250,    // Level 3  (+100)
  450,    // Level 4  (+150)
  700,    // Level 5  (+200)
  1000,   // Level 6  (+250)
  1350,   // Level 7  (+300)
  1750,   // Level 8  (+350)
  2200,   // Level 9  (+400)
  2700,   // Level 10 (+400)
  3250,   // Level 11 (+350)
  3850,   // Level 12 (+250)
  4500,   // Level 13 (+100)
  5200,   // Level 14 (-100)
  5950,   // Level 15 (-350)
  6750,   // Level 16 (-650)
  7600,   // Level 17 (-1000)
  8500,   // Level 18 (-1400)
  9450,   // Level 19 (-1850)
  10450,  // Level 20 (-2350)
  // Levels 21-50 follow exponential curve
  11550, 12750, 14050, 15450, 16950,  // 21-25
  18550, 20250, 22050, 23950, 25950,  // 26-30
  28050, 30250, 32550, 34950, 37450,  // 31-35
  40050, 42750, 45550, 48450, 51450,  // 36-40
  54550, 57750, 61050, 64450, 67950,  // 41-45
  71550, 75250, 79050, 82950, 86950,  // 46-50
];

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
    totalXP += XP_REWARDS_V3.WEEKEND_BONUS;
    bonuses.push(`Weekend +${XP_REWARDS_V3.WEEKEND_BONUS}`);
  }
  if (isNight) {
    totalXP += XP_REWARDS_V3.NIGHT_OWL_BONUS;
    bonuses.push(`Night Owl +${XP_REWARDS_V3.NIGHT_OWL_BONUS}`);
  }
  if (isMorning) {
    totalXP += XP_REWARDS_V3.MORNING_BONUS;
    bonuses.push(`Early Bird +${XP_REWARDS_V3.MORNING_BONUS}`);
  }

  // Quality bonuses
  if (isPerfect) {
    totalXP += XP_REWARDS_V3.PERFECT_SCORE;
    bonuses.push(`Perfect +${XP_REWARDS_V3.PERFECT_SCORE}`);
  }
  if (isFast) {
    totalXP += XP_REWARDS_V3.FAST_COMPLETION;
    bonuses.push(`Speed +${XP_REWARDS_V3.FAST_COMPLETION}`);
  }
  if (hasDetailedNotes) {
    totalXP += XP_REWARDS_V3.DETAILED_NOTES;
    bonuses.push(`Detailed +${XP_REWARDS_V3.DETAILED_NOTES}`);
  }

  // Streak multiplier (capped at 10 days = 50% max bonus)
  if (streak > 0) {
    const effectiveStreak = Math.min(streak, XP_REWARDS_V3.STREAK_CAP);
    const streakBonus = Math.floor(
      baseAmount * effectiveStreak * XP_REWARDS_V3.STREAK_MULTIPLIER
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
    capReason = 'Daily XP limit reached';
  }

  // Weekly cap
  if (currentWeeklyXP + totalXP > XP_LIMITS.MAX_WEEKLY_XP) {
    const remaining = Math.max(0, XP_LIMITS.MAX_WEEKLY_XP - currentWeeklyXP);
    totalXP = remaining;
    capped = true;
    capReason = 'Weekly XP limit reached';
  }

  return {
    totalXP,
    bonuses,
    capped,
    ...(capReason && { capReason }),
  };
}

/**
 * Calculate level from XP (v3 thresholds)
 */
export function calculateLevelV3(xp: number): number {
  for (let i = LEVEL_THRESHOLDS_V3.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS_V3[i];
    if (threshold !== undefined && xp >= threshold) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevelV3(currentXP: number): number {
  const currentLevel = calculateLevelV3(currentXP);
  if (currentLevel >= LEVEL_THRESHOLDS_V3.length) {
    return LEVEL_THRESHOLDS_V3[LEVEL_THRESHOLDS_V3.length - 1] ?? 0;
  }
  return LEVEL_THRESHOLDS_V3[currentLevel] ?? 0;
}

/**
 * Get progress percentage to next level
 */
export function getLevelProgressV3(currentXP: number): number {
  const currentLevel = calculateLevelV3(currentXP);
  if (currentLevel >= LEVEL_THRESHOLDS_V3.length) {
    return 100;
  }

  const currentLevelXP = LEVEL_THRESHOLDS_V3[currentLevel - 1] ?? 0;
  const nextLevelXP = LEVEL_THRESHOLDS_V3[currentLevel] ?? 0;
  const progressXP = currentXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return Math.floor((progressXP / requiredXP) * 100);
}

/**
 * Validate homework submission (anti-gaming checks)
 */
export async function validateHomeworkSubmission(
  studentId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  cooldownRemaining?: number;
}> {
  // Import here to avoid circular dependency
  const { prisma } = await import('@/lib/db/prisma');

  // Check: Max homework per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const homeworkToday = await prisma.homework.count({
    where: {
      studentId,
      createdAt: {
        gte: today,
      },
    },
  });

  if (homeworkToday >= XP_LIMITS.MAX_HOMEWORK_PER_DAY) {
    return {
      allowed: false,
      reason: `Dostigao si limit od ${XP_LIMITS.MAX_HOMEWORK_PER_DAY} zadataka dnevno`,
    };
  }

  // Check: Cooldown between submissions
  const lastHomework = await prisma.homework.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (lastHomework) {
    const cooldownMs = XP_LIMITS.COOLDOWN_MINUTES * 60 * 1000;
    const timeSinceLastMs = Date.now() - lastHomework.createdAt.getTime();

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
