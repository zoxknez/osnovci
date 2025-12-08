/**
 * XP Core System Tests
 * Testiranje osnovnog XP sistema sa anti-gaming mehanizmima
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateLevel,
  calculateXP,
  getLevelProgress,
  getXPForNextLevel,
  LEVEL_THRESHOLDS,
  XP_LIMITS,
  XP_REWARDS,
} from "@/lib/gamification/xp-core";

describe("XP Core System", () => {
  describe("calculateXP", () => {
    it("should calculate base XP without bonuses", () => {
      const result = calculateXP({
        baseAmount: 10,
      });

      expect(result.totalXP).toBe(10);
      expect(result.bonuses).toHaveLength(0);
      expect(result.capped).toBe(false);
    });

    it("should apply weekend bonus correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        isWeekend: true,
      });

      expect(result.totalXP).toBe(10 + XP_REWARDS.WEEKEND_BONUS);
      expect(result.bonuses).toContain(`Weekend +${XP_REWARDS.WEEKEND_BONUS}`);
    });

    it("should apply night owl bonus correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        isNight: true,
      });

      expect(result.totalXP).toBe(10 + XP_REWARDS.NIGHT_OWL_BONUS);
      expect(result.bonuses).toContain(
        `Night Owl +${XP_REWARDS.NIGHT_OWL_BONUS}`,
      );
    });

    it("should apply morning bonus correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        isMorning: true,
      });

      expect(result.totalXP).toBe(10 + XP_REWARDS.MORNING_BONUS);
      expect(result.bonuses).toContain(
        `Early Bird +${XP_REWARDS.MORNING_BONUS}`,
      );
    });

    it("should apply perfect score bonus correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        isPerfect: true,
      });

      expect(result.totalXP).toBe(10 + XP_REWARDS.PERFECT_SCORE);
      expect(result.bonuses).toContain(`Perfect +${XP_REWARDS.PERFECT_SCORE}`);
    });

    it("should apply fast completion bonus correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        isFast: true,
      });

      expect(result.totalXP).toBe(10 + XP_REWARDS.FAST_COMPLETION);
      expect(result.bonuses).toContain(`Speed +${XP_REWARDS.FAST_COMPLETION}`);
    });

    it("should apply detailed notes bonus correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        hasDetailedNotes: true,
      });

      expect(result.totalXP).toBe(10 + XP_REWARDS.DETAILED_NOTES);
      expect(result.bonuses).toContain(
        `Detailed +${XP_REWARDS.DETAILED_NOTES}`,
      );
    });

    it("should stack multiple bonuses correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        isWeekend: true,
        isPerfect: true,
        isFast: true,
      });

      const expectedXP =
        10 +
        XP_REWARDS.WEEKEND_BONUS +
        XP_REWARDS.PERFECT_SCORE +
        XP_REWARDS.FAST_COMPLETION;
      expect(result.totalXP).toBe(expectedXP);
      expect(result.bonuses).toHaveLength(3);
    });

    it("should apply streak multiplier correctly", () => {
      const result = calculateXP({
        baseAmount: 10,
        streak: 5,
      });

      // Streak bonus = base * streak * multiplier = 10 * 5 * 0.05 = 2.5 -> 2 (floored)
      const streakBonus = Math.floor(10 * 5 * XP_REWARDS.STREAK_MULTIPLIER);
      expect(result.totalXP).toBe(10 + streakBonus);
      expect(result.bonuses).toContain(`Streak x5 +${streakBonus}`);
    });

    it("should cap streak bonus at 10 days", () => {
      const result = calculateXP({
        baseAmount: 10,
        streak: 20, // More than cap
      });

      // Should use cap of 10, not 20
      const cappedStreakBonus = Math.floor(
        10 * XP_REWARDS.STREAK_CAP * XP_REWARDS.STREAK_MULTIPLIER,
      );
      expect(result.totalXP).toBe(10 + cappedStreakBonus);
      expect(result.bonuses).toContain(
        `Streak x${XP_REWARDS.STREAK_CAP} +${cappedStreakBonus}`,
      );
    });

    it("should apply daily XP cap", () => {
      const result = calculateXP({
        baseAmount: 50,
        currentDailyXP: 80,
      });

      // Only 20 XP remaining in daily cap (100 - 80)
      expect(result.totalXP).toBe(20);
      expect(result.capped).toBe(true);
      expect(result.capReason).toBe("Daily XP limit reached");
    });

    it("should apply weekly XP cap", () => {
      const result = calculateXP({
        baseAmount: 50,
        currentWeeklyXP: 480,
      });

      // Only 20 XP remaining in weekly cap (500 - 480)
      expect(result.totalXP).toBe(20);
      expect(result.capped).toBe(true);
      expect(result.capReason).toBe("Weekly XP limit reached");
    });

    it("should return 0 when daily cap is reached", () => {
      const result = calculateXP({
        baseAmount: 50,
        currentDailyXP: 100,
      });

      expect(result.totalXP).toBe(0);
      expect(result.capped).toBe(true);
    });

    it("should return 0 when weekly cap is reached", () => {
      const result = calculateXP({
        baseAmount: 50,
        currentWeeklyXP: 500,
      });

      expect(result.totalXP).toBe(0);
      expect(result.capped).toBe(true);
    });
  });

  describe("calculateLevel", () => {
    it("should return level 1 for 0 XP", () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it("should return level 1 for XP below first threshold", () => {
      expect(calculateLevel(50)).toBe(1);
    });

    it("should return level 2 at exactly 100 XP", () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it("should return correct level for mid-range XP", () => {
      expect(calculateLevel(700)).toBe(5); // Level 5 starts at 700
      expect(calculateLevel(1000)).toBe(6); // Level 6 starts at 1000
    });

    it("should return max level for very high XP", () => {
      expect(calculateLevel(100000)).toBe(LEVEL_THRESHOLDS.length);
    });

    it("should handle edge case at level boundary", () => {
      // Just below level 3 threshold (250)
      expect(calculateLevel(249)).toBe(2);
      // Exactly at level 3 threshold
      expect(calculateLevel(250)).toBe(3);
    });
  });

  describe("getXPForNextLevel", () => {
    it("should return correct XP for level 1 -> 2", () => {
      expect(getXPForNextLevel(0)).toBe(100);
      expect(getXPForNextLevel(50)).toBe(100);
    });

    it("should return correct XP for level 2 -> 3", () => {
      expect(getXPForNextLevel(100)).toBe(250);
      expect(getXPForNextLevel(200)).toBe(250);
    });

    it("should return last threshold for max level", () => {
      const maxXP = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
      expect(getXPForNextLevel(100000)).toBe(maxXP);
    });
  });

  describe("getLevelProgress", () => {
    it("should return 0% at start of level", () => {
      expect(getLevelProgress(0)).toBe(0);
      expect(getLevelProgress(100)).toBe(0); // Start of level 2
    });

    it("should return 50% at midpoint", () => {
      // Level 2: 100-250, midpoint = 175
      // Progress = (175-100) / (250-100) = 75/150 = 50%
      expect(getLevelProgress(175)).toBe(50);
    });

    it("should return 100% at max level", () => {
      expect(getLevelProgress(100000)).toBe(100);
    });

    it("should handle fractional progress", () => {
      // Level 2: 100-250, at 120
      // Progress = (120-100) / (250-100) = 20/150 = 13.3% -> 13%
      expect(getLevelProgress(120)).toBe(13);
    });
  });

  describe("XP Constants", () => {
    it("should have valid XP_REWARDS values", () => {
      expect(XP_REWARDS.HOMEWORK_COMPLETED).toBeGreaterThan(0);
      expect(XP_REWARDS.HOMEWORK_EARLY).toBeGreaterThan(
        XP_REWARDS.HOMEWORK_COMPLETED,
      );
      expect(XP_REWARDS.HOMEWORK_VERY_EARLY).toBeGreaterThan(
        XP_REWARDS.HOMEWORK_EARLY,
      );
    });

    it("should have valid XP_LIMITS values", () => {
      expect(XP_LIMITS.MAX_DAILY_XP).toBeGreaterThan(0);
      expect(XP_LIMITS.MAX_WEEKLY_XP).toBeGreaterThan(XP_LIMITS.MAX_DAILY_XP);
      expect(XP_LIMITS.MAX_HOMEWORK_PER_DAY).toBeGreaterThan(0);
      expect(XP_LIMITS.COOLDOWN_MINUTES).toBeGreaterThan(0);
    });

    it("should have monotonically increasing level thresholds", () => {
      for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i]).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]!);
      }
    });
  });
});

describe("XP Edge Cases", () => {
  it("should handle negative XP input gracefully", () => {
    const result = calculateXP({
      baseAmount: -10,
    });
    // Implementation should handle this - total might be negative
    expect(typeof result.totalXP).toBe("number");
  });

  it("should handle zero streak correctly", () => {
    const result = calculateXP({
      baseAmount: 10,
      streak: 0,
    });

    expect(result.totalXP).toBe(10);
    expect(result.bonuses).not.toContain("Streak");
  });

  it("should handle all bonuses combined", () => {
    const result = calculateXP({
      baseAmount: 10,
      streak: 10,
      isWeekend: true,
      isNight: true,
      isMorning: true,
      isPerfect: true,
      isFast: true,
      hasDetailedNotes: true,
    });

    // Should have all bonuses (morning and night are mutually exclusive in real use, but system allows both)
    expect(result.bonuses.length).toBeGreaterThanOrEqual(6);
    expect(result.totalXP).toBeGreaterThan(10);
  });
});
