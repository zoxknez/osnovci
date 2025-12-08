// XP Calculator Tests
import { describe, expect, it } from "vitest";
import { calculateLevel, calculateXP } from "@/lib/gamification/xp-calculator";

describe("XP Calculator", () => {
  describe("calculateXP", () => {
    it("should give base XP for normal homework", () => {
      const xp = calculateXP({
        priority: "NORMAL",
        completedOnTime: true,
        earlyDays: 0,
      });

      expect(xp).toBe(10); // Base XP
    });

    it("should give bonus for important homework", () => {
      const xp = calculateXP({
        priority: "IMPORTANT",
        completedOnTime: true,
        earlyDays: 0,
      });

      expect(xp).toBe(15); // Base + 50% bonus
    });

    it("should give bonus for urgent homework", () => {
      const xp = calculateXP({
        priority: "URGENT",
        completedOnTime: true,
        earlyDays: 0,
      });

      expect(xp).toBe(20); // Base + 100% bonus
    });

    it("should give early bird bonus", () => {
      const xp = calculateXP({
        priority: "NORMAL",
        completedOnTime: true,
        earlyDays: 2,
      });

      expect(xp).toBe(20); // Base + 5XP per early day
    });

    it("should penalize late submission", () => {
      const xp = calculateXP({
        priority: "NORMAL",
        completedOnTime: false,
        earlyDays: 0,
      });

      expect(xp).toBe(5); // Half XP for late
    });

    it("should give streak bonus", () => {
      const xp = calculateXP({
        priority: "NORMAL",
        completedOnTime: true,
        earlyDays: 0,
        currentStreak: 5,
      });

      expect(xp).toBeGreaterThan(10); // Base + streak bonus
    });

    it("should combine multiple bonuses", () => {
      const xp = calculateXP({
        priority: "URGENT",
        completedOnTime: true,
        earlyDays: 3,
        currentStreak: 7,
      });

      // URGENT (20) + early (15) + streak bonus
      expect(xp).toBeGreaterThan(35);
    });
  });

  describe("calculateLevel", () => {
    it("should start at level 1 with 0 XP", () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it("should be level 2 at 100 XP", () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it("should be level 3 at 250 XP", () => {
      expect(calculateLevel(250)).toBe(3);
    });

    it("should be level 5 at 700 XP", () => {
      expect(calculateLevel(700)).toBe(5);
    });

    it("should be level 10 at 2700 XP", () => {
      expect(calculateLevel(2700)).toBe(10);
    });

    it("should calculate XP needed for next level", () => {
      const current = 150;
      const level = calculateLevel(current);
      const nextLevelXP = calculateLevel.getRequiredXP(level + 1);

      expect(nextLevelXP).toBeGreaterThan(current);
    });
  });

  describe("getRequiredXP", () => {
    it("should return 0 for level 1", () => {
      expect(calculateLevel.getRequiredXP(1)).toBe(0);
    });

    it("should return 100 for level 2", () => {
      expect(calculateLevel.getRequiredXP(2)).toBe(100);
    });

    it("should have increasing requirements", () => {
      const level2 = calculateLevel.getRequiredXP(2);
      const level3 = calculateLevel.getRequiredXP(3);
      const level4 = calculateLevel.getRequiredXP(4);

      expect(level3).toBeGreaterThan(level2);
      expect(level4).toBeGreaterThan(level3);
    });
  });
});
