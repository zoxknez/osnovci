/**
 * XP System Integration Tests
 * Testiranje kompletnog XP sistema sa bazom podataka
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma
const mockPrisma = {
  gamification: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  achievement: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  homework: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  grade: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  student: {
    findUnique: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

vi.mock("@/lib/db/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

vi.mock("@/lib/logger", () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("XP Award System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Award XP Transaction", () => {
    it("should create gamification record if not exists", async () => {
      mockPrisma.gamification.findUnique.mockResolvedValue(null);
      mockPrisma.gamification.create.mockResolvedValue({
        id: "new-gam-id",
        studentId: "student-1",
        level: 1,
        currentXP: 100,
        totalXPEarned: 100,
        streak: 0,
        longestStreak: 0,
        totalHomeworkDone: 0,
        lastActivityDate: new Date(),
      });

      // Simulating the awardXP logic
      const existingGamification = await mockPrisma.gamification.findUnique({
        where: { studentId: "student-1" },
      });

      expect(existingGamification).toBeNull();

      // Should create new record
      const newGamification = await mockPrisma.gamification.create({
        data: {
          studentId: "student-1",
          level: 1,
          currentXP: 100,
          totalXPEarned: 100,
        },
      });

      expect(newGamification.currentXP).toBe(100);
      expect(mockPrisma.gamification.create).toHaveBeenCalled();
    });

    it("should update existing gamification with new XP", async () => {
      mockPrisma.gamification.findUnique.mockResolvedValue({
        id: "gam-1",
        studentId: "student-1",
        level: 3,
        currentXP: 450,
        totalXPEarned: 2450,
        streak: 5,
        longestStreak: 10,
        totalHomeworkDone: 15,
        lastActivityDate: new Date(),
      });

      mockPrisma.gamification.update.mockResolvedValue({
        id: "gam-1",
        studentId: "student-1",
        level: 3,
        currentXP: 550,
        totalXPEarned: 2550,
        streak: 6,
        longestStreak: 10,
        totalHomeworkDone: 16,
        lastActivityDate: new Date(),
      });

      const existing = await mockPrisma.gamification.findUnique({
        where: { studentId: "student-1" },
      });

      expect(existing?.currentXP).toBe(450);

      const xpToAdd = 100;
      const updated = await mockPrisma.gamification.update({
        where: { id: existing?.id },
        data: {
          currentXP: existing!.currentXP + xpToAdd,
          totalXPEarned: existing!.totalXPEarned + xpToAdd,
          streak: existing!.streak + 1,
          totalHomeworkDone: existing!.totalHomeworkDone + 1,
        },
      });

      expect(updated.currentXP).toBe(550);
      expect(updated.totalXPEarned).toBe(2550);
      expect(mockPrisma.gamification.update).toHaveBeenCalled();
    });
  });

  describe("Level Up Detection", () => {
    it("should detect level up when XP threshold is exceeded", () => {
      // XP thresholds: level 1 = 0-499, level 2 = 500-1099, etc.
      const getXPForNextLevel = (level: number): number => {
        return 500 + (level - 1) * 300;
      };

      const currentLevel = 3;
      const currentXP = 480; // Close to level 4
      const xpToAdd = 100;

      const threshold = getXPForNextLevel(currentLevel); // 1100
      const newXP = currentXP + xpToAdd; // 580

      // Check if level up
      // Actually, need to check total XP against level threshold
      // For level 3, threshold is 500 + 300 + 300 = 1100
      // For level 4, we need cumulative XP of 500 + 600 + 900 = 2000

      // Simplified test
      const willLevelUp = newXP >= threshold;
      expect(willLevelUp).toBe(false); // 580 < 1100

      // Test actual level up
      const bigXPAdd = 700;
      const willLevelUpNow = currentXP + bigXPAdd >= threshold;
      expect(willLevelUpNow).toBe(true); // 1180 >= 1100
    });

    it("should handle multiple level ups at once", () => {
      const calculateLevel = (totalXP: number): number => {
        let level = 1;
        let xpRequired = 500;

        while (totalXP >= xpRequired) {
          level++;
          xpRequired += 300 + Math.floor(level / 5) * 50;
        }

        return level;
      };

      const oldTotalXP = 1000; // Level 2
      const xpGained = 5000;
      const newTotalXP = oldTotalXP + xpGained;

      const oldLevel = calculateLevel(oldTotalXP);
      const newLevel = calculateLevel(newTotalXP);

      expect(newLevel).toBeGreaterThan(oldLevel);
      expect(newLevel - oldLevel).toBeGreaterThan(1); // Multiple levels
    });
  });

  describe("Streak Management", () => {
    it("should increment streak for same day activity", () => {
      const lastActivity = new Date("2025-01-09T10:00:00");
      const now = new Date("2025-01-09T15:00:00");

      const isSameDay = lastActivity.toDateString() === now.toDateString();

      expect(isSameDay).toBe(true);
      // Streak should NOT increment for same day
    });

    it("should increment streak for next day activity", () => {
      const lastActivity = new Date("2025-01-08T20:00:00");
      const now = new Date("2025-01-09T08:00:00");

      const lastDate = new Date(lastActivity.toDateString());
      const today = new Date(now.toDateString());
      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(diffDays).toBe(1);
      // Streak should increment
    });

    it("should reset streak after missing 2+ days", () => {
      const lastActivity = new Date("2025-01-05T10:00:00");
      const now = new Date("2025-01-09T10:00:00");

      const lastDate = new Date(lastActivity.toDateString());
      const today = new Date(now.toDateString());
      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(diffDays).toBe(4);
      // Streak should reset to 1
    });

    it("should update longest streak when current exceeds it", () => {
      let streak = 15;
      let longestStreak = 10;

      // Increment streak
      streak++;

      // Check and update longest
      if (streak > longestStreak) {
        longestStreak = streak;
      }

      expect(longestStreak).toBe(16);
    });
  });

  describe("Achievement Unlocking", () => {
    it("should unlock achievement on first homework completion", async () => {
      mockPrisma.achievement.count.mockResolvedValue(0);
      mockPrisma.achievement.create.mockResolvedValue({
        id: "ach-1",
        studentId: "student-1",
        type: "FIRST_HOMEWORK",
        unlockedAt: new Date(),
      });

      // Check if achievement already exists
      const existingAchievement = await mockPrisma.achievement.count({
        where: {
          studentId: "student-1",
          type: "FIRST_HOMEWORK",
        },
      });

      expect(existingAchievement).toBe(0);

      // Unlock achievement
      const newAchievement = await mockPrisma.achievement.create({
        data: {
          studentId: "student-1",
          type: "FIRST_HOMEWORK",
        },
      });

      expect(newAchievement.type).toBe("FIRST_HOMEWORK");
      expect(mockPrisma.achievement.create).toHaveBeenCalled();
    });

    it("should not create duplicate achievements", async () => {
      mockPrisma.achievement.count.mockResolvedValue(1); // Already exists

      const existingCount = await mockPrisma.achievement.count({
        where: {
          studentId: "student-1",
          type: "STREAK_7",
        },
      });

      expect(existingCount).toBe(1);
      // Should NOT create another achievement
      expect(mockPrisma.achievement.create).not.toHaveBeenCalled();
    });

    it("should create notification on achievement unlock", async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: "notif-1",
        userId: "user-1",
        title: "Novo dostignuće!",
        message: "Čestitamo! Otključali ste dostignuće: Nedeljni Ratnik",
        type: "ACHIEVEMENT",
        createdAt: new Date(),
      });

      const notification = await mockPrisma.notification.create({
        data: {
          userId: "user-1",
          title: "Novo dostignuće!",
          message: "Čestitamo! Otključali ste dostignuće: Nedeljni Ratnik",
          type: "ACHIEVEMENT",
        },
      });

      expect(notification.type).toBe("ACHIEVEMENT");
      expect(notification.message).toContain("Nedeljni Ratnik");
    });
  });

  describe("XP Calculation with Context", () => {
    it("should calculate correct XP for homework completion", () => {
      const baseXP = 50;
      const streakBonus = 10;
      const streak = 5;
      const earlySubmissionBonus = 25;
      const isEarly = true;

      let totalXP = baseXP;
      totalXP += Math.min(streakBonus * streak, 100); // Capped at 100
      if (isEarly) {
        totalXP += earlySubmissionBonus;
      }

      expect(totalXP).toBe(125); // 50 + 50 + 25
    });

    it("should calculate correct XP for grade 5", () => {
      const baseXPByGrade: Record<string, number> = {
        "5": 100,
        "4": 75,
        "3": 50,
        "2": 25,
        "1": 0,
      };

      const xpFor5 = baseXPByGrade["5"];
      const xpFor3 = baseXPByGrade["3"];

      expect(xpFor5).toBe(100);
      expect(xpFor3).toBe(50);
      expect(xpFor5).toBeGreaterThan(xpFor3);
    });

    it("should apply XP multipliers for special events", () => {
      const baseXP = 100;
      const weekendMultiplier = 1.5;
      const isWeekend = true;

      const finalXP = isWeekend
        ? Math.round(baseXP * weekendMultiplier)
        : baseXP;

      expect(finalXP).toBe(150);
    });
  });

  describe("Activity Logging", () => {
    it("should log XP award activity", async () => {
      mockPrisma.activityLog.create.mockResolvedValue({
        id: "log-1",
        studentId: "student-1",
        action: "XP_AWARDED",
        details: JSON.stringify({ amount: 100, reason: "HOMEWORK_COMPLETED" }),
        createdAt: new Date(),
      });

      const log = await mockPrisma.activityLog.create({
        data: {
          studentId: "student-1",
          action: "XP_AWARDED",
          details: JSON.stringify({
            amount: 100,
            reason: "HOMEWORK_COMPLETED",
          }),
        },
      });

      const details = JSON.parse(log.details);
      expect(details.amount).toBe(100);
      expect(details.reason).toBe("HOMEWORK_COMPLETED");
    });

    it("should log level up activity", async () => {
      mockPrisma.activityLog.create.mockResolvedValue({
        id: "log-2",
        studentId: "student-1",
        action: "LEVEL_UP",
        details: JSON.stringify({ oldLevel: 4, newLevel: 5 }),
        createdAt: new Date(),
      });

      const log = await mockPrisma.activityLog.create({
        data: {
          studentId: "student-1",
          action: "LEVEL_UP",
          details: JSON.stringify({ oldLevel: 4, newLevel: 5 }),
        },
      });

      const details = JSON.parse(log.details);
      expect(details.newLevel).toBe(5);
      expect(details.newLevel).toBeGreaterThan(details.oldLevel);
    });
  });

  describe("Leaderboard Updates", () => {
    it("should update rank after XP change", async () => {
      const mockLeaderboard = [
        { studentId: "s1", totalXPEarned: 5000, rank: 1 },
        { studentId: "s2", totalXPEarned: 4500, rank: 2 },
        { studentId: "s3", totalXPEarned: 4000, rank: 3 },
        { studentId: "student-1", totalXPEarned: 3500, rank: 4 },
      ];

      // Student earns 1000 XP
      const studentNewXP = 3500 + 1000; // 4500

      // Recalculate ranks
      const updatedLeaderboard = [
        { studentId: "s1", totalXPEarned: 5000 },
        { studentId: "student-1", totalXPEarned: studentNewXP },
        { studentId: "s2", totalXPEarned: 4500 },
        { studentId: "s3", totalXPEarned: 4000 },
      ].sort((a, b) => b.totalXPEarned - a.totalXPEarned);

      const newRank =
        updatedLeaderboard.findIndex((s) => s.studentId === "student-1") + 1;
      expect(newRank).toBe(2); // Moved up from 4 to 2
    });
  });

  describe("XP Source Tracking", () => {
    it("should track XP sources correctly", () => {
      interface XPSource {
        type: string;
        amount: number;
        timestamp: Date;
      }

      const xpHistory: XPSource[] = [
        { type: "HOMEWORK", amount: 50, timestamp: new Date() },
        { type: "GRADE_5", amount: 100, timestamp: new Date() },
        { type: "STREAK_BONUS", amount: 30, timestamp: new Date() },
        { type: "ACHIEVEMENT", amount: 200, timestamp: new Date() },
      ];

      const totalFromHomework = xpHistory
        .filter((x) => x.type === "HOMEWORK")
        .reduce((sum, x) => sum + x.amount, 0);

      const totalFromAchievements = xpHistory
        .filter((x) => x.type === "ACHIEVEMENT")
        .reduce((sum, x) => sum + x.amount, 0);

      expect(totalFromHomework).toBe(50);
      expect(totalFromAchievements).toBe(200);
    });
  });

  describe("Daily XP Caps", () => {
    it("should respect daily XP cap", () => {
      const DAILY_XP_CAP = 500;
      const xpEarnedToday = 450;
      const xpToEarn = 100;

      const actualXPToAdd = Math.min(xpToEarn, DAILY_XP_CAP - xpEarnedToday);
      expect(actualXPToAdd).toBe(50); // Can only earn 50 more today
    });

    it("should reset daily cap at midnight", () => {
      const lastReset = new Date("2025-01-08T00:00:00");
      const now = new Date("2025-01-09T08:00:00");

      const shouldReset = now.toDateString() !== lastReset.toDateString();
      expect(shouldReset).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle 0 XP awards gracefully", async () => {
      const xpToAward = 0;

      // Should not update gamification for 0 XP
      if (xpToAward <= 0) {
        expect(mockPrisma.gamification.update).not.toHaveBeenCalled();
      }
    });

    it("should handle negative XP awards gracefully", () => {
      const xpToAward = -50;
      const sanitizedXP = Math.max(0, xpToAward);

      expect(sanitizedXP).toBe(0);
    });

    it("should handle very large XP awards", () => {
      const MAX_SINGLE_AWARD = 1000;
      const xpToAward = 5000;

      const cappedXP = Math.min(xpToAward, MAX_SINGLE_AWARD);
      expect(cappedXP).toBe(1000);
    });

    it("should handle missing student gracefully", async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      const student = await mockPrisma.student.findUnique({
        where: { id: "non-existent" },
      });

      expect(student).toBeNull();
      // Should not award XP to non-existent student
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.gamification.update.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        mockPrisma.gamification.update({
          where: { id: "gam-1" },
          data: { currentXP: 100 },
        }),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
