// XP Calculator - Gamification System
// Calculates XP and levels for students

interface XPCalculationParams {
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  completedOnTime: boolean;
  earlyDays?: number;
  currentStreak?: number;
  perfectWeek?: boolean;
}

/**
 * Base XP values by priority
 */
const BASE_XP = {
  NORMAL: 10,
  IMPORTANT: 15,
  URGENT: 20,
};

/**
 * Calculate XP for completing homework
 */
export function calculateXP(params: XPCalculationParams): number {
  const {
    priority,
    completedOnTime,
    earlyDays = 0,
    currentStreak = 0,
    perfectWeek = false,
  } = params;

  let xp = BASE_XP[priority];

  // Late penalty - 50% XP
  if (!completedOnTime) {
    xp = Math.floor(xp * 0.5);
    return xp; // No bonuses for late submissions
  }

  // Early bird bonus - 5 XP per day early
  if (earlyDays > 0) {
    xp += earlyDays * 5;
  }

  // Streak bonus - 1 XP per day in streak (max 20)
  if (currentStreak > 0) {
    const streakBonus = Math.min(currentStreak, 20);
    xp += streakBonus;
  }

  // Perfect week bonus
  if (perfectWeek) {
    xp += 50;
  }

  return xp;
}

/**
 * Level progression (XP required per level)
 * Formula: level * 100 + (level - 1) * 50
 */
const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  450, // Level 4
  700, // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
  3250, // Level 11
  3850, // Level 12
  4500, // Level 13
  5200, // Level 14
  5950, // Level 15
  6750, // Level 16
  7600, // Level 17
  8500, // Level 18
  9450, // Level 19
  10450, // Level 20
];

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]!) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for specific level
 */
calculateLevel.getRequiredXP = (level: number): number => {
  if (level <= 0) return 0;
  if (level > LEVEL_THRESHOLDS.length) {
    // Calculate dynamically for high levels
    const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
    const additionalLevels = level - LEVEL_THRESHOLDS.length;
    return lastThreshold + additionalLevels * 1000;
  }
  return LEVEL_THRESHOLDS[level - 1]!;
};

/**
 * Get XP progress to next level
 */
export function getXPProgress(totalXP: number): {
  currentLevel: number;
  nextLevel: number;
  currentXP: number;
  requiredXP: number;
  progress: number; // 0-1
} {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = calculateLevel.getRequiredXP(currentLevel);
  const nextLevelXP = calculateLevel.getRequiredXP(currentLevel + 1);

  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    currentXP: xpInCurrentLevel,
    requiredXP: xpNeededForNextLevel,
    progress: xpInCurrentLevel / xpNeededForNextLevel,
  };
}
