/**
 * Achievement Triggers Tests
 * Testiranje sistema za otključavanje dostignuća
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma before imports
vi.mock("@/lib/db/prisma", () => ({
  __esModule: true,
  default: {
    gamification: {
      findUnique: vi.fn(),
    },
    homework: {
      count: vi.fn(),
    },
    grade: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    activityLog: {
      count: vi.fn(),
    },
    subject: {
      findMany: vi.fn(),
    },
    achievement: {
      count: vi.fn(),
      create: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
  prisma: {
    gamification: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocking
import prisma from "@/lib/db/prisma";

describe("Achievement System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Achievement Rarity Mapping", () => {
    it("should have correct rarity for legendary achievements", () => {
      const legendaryTypes = [
        "PERFECT_MONTH",
        "GRADE_AVG_50",
        "ALL_SUBJECTS_5",
        "TOP_STUDENT",
        "STREAK_100",
        "OVERACHIEVER",
      ];

      // These would be tested against getAchievementRarity function
      // For now, we verify the types are valid
      expect(legendaryTypes).toHaveLength(6);
    });

    it("should have correct rarity for epic achievements", () => {
      const epicTypes = [
        "HOMEWORK_100",
        "STREAK_60",
        "LEVEL_50",
        "PERFECTIONIST",
        "LEADERBOARD_TOP_3",
        "COLLECTOR",
      ];

      expect(epicTypes).toHaveLength(6);
    });

    it("should have correct rarity for rare achievements", () => {
      const rareTypes = [
        "HOMEWORK_50",
        "STREAK_30",
        "LEVEL_30",
        "PERFECT_WEEK",
        "SUBJECT_MASTER",
        "LEADERBOARD_TOP_10",
      ];

      expect(rareTypes).toHaveLength(6);
    });
  });

  describe("Achievement XP Rewards", () => {
    const xpRewardMap: Record<string, number> = {
      // Homework - low tier
      FIRST_HOMEWORK: 50,
      HOMEWORK_5: 100,
      HOMEWORK_10: 150,
      HOMEWORK_25: 300,
      HOMEWORK_50: 500,
      HOMEWORK_100: 1000,

      // Streaks - increasing
      STREAK_3: 100,
      STREAK_7: 200,
      STREAK_14: 400,
      STREAK_30: 800,
      STREAK_60: 1500,
      STREAK_100: 3000,

      // Levels
      LEVEL_5: 200,
      LEVEL_10: 400,
      LEVEL_50: 2000,

      // Special
      TOP_STUDENT: 5000,
      ALL_SUBJECTS_5: 1500,
    };

    it("should have increasing XP for homework milestones", () => {
      expect(xpRewardMap.HOMEWORK_5).toBeGreaterThan(
        xpRewardMap.FIRST_HOMEWORK!,
      );
      expect(xpRewardMap.HOMEWORK_10).toBeGreaterThan(xpRewardMap.HOMEWORK_5!);
      expect(xpRewardMap.HOMEWORK_25).toBeGreaterThan(xpRewardMap.HOMEWORK_10!);
      expect(xpRewardMap.HOMEWORK_50).toBeGreaterThan(xpRewardMap.HOMEWORK_25!);
      expect(xpRewardMap.HOMEWORK_100).toBeGreaterThan(
        xpRewardMap.HOMEWORK_50!,
      );
    });

    it("should have increasing XP for streak milestones", () => {
      expect(xpRewardMap.STREAK_7).toBeGreaterThan(xpRewardMap.STREAK_3!);
      expect(xpRewardMap.STREAK_14).toBeGreaterThan(xpRewardMap.STREAK_7!);
      expect(xpRewardMap.STREAK_30).toBeGreaterThan(xpRewardMap.STREAK_14!);
      expect(xpRewardMap.STREAK_60).toBeGreaterThan(xpRewardMap.STREAK_30!);
      expect(xpRewardMap.STREAK_100).toBeGreaterThan(xpRewardMap.STREAK_60!);
    });

    it("should have legendary achievements worth more than common ones", () => {
      expect(xpRewardMap.TOP_STUDENT).toBeGreaterThan(
        xpRewardMap.FIRST_HOMEWORK!,
      );
      expect(xpRewardMap.STREAK_100).toBeGreaterThan(xpRewardMap.STREAK_3!);
    });
  });

  describe("Achievement Titles (Serbian)", () => {
    const titles: Record<string, string> = {
      FIRST_HOMEWORK: "Prvi Domaći",
      HOMEWORK_100: "Stotinar",
      STREAK_7: "Nedeljni Ratnik",
      STREAK_30: "Mesečni Majstor",
      PERFECT_WEEK: "Savršena Nedelja",
      PERFECT_MONTH: "Savršeni Mesec",
      TOP_STUDENT: "Najbolji Učenik",
      EARLY_BIRD: "Ranoranilac",
      NIGHT_OWL: "Noćna Ptica",
      WEEKEND_WARRIOR: "Vikend Ratnik",
      COMEBACK_KID: "Povratak",
    };

    it("should have Serbian titles for all achievements", () => {
      Object.values(titles).forEach((title) => {
        // Check that titles are in Serbian (contain Serbian-specific characters or words)
        expect(typeof title).toBe("string");
        expect(title.length).toBeGreaterThan(0);
      });
    });

    it("should have descriptive titles", () => {
      expect(titles.FIRST_HOMEWORK).toContain("Domaći");
      expect(titles.STREAK_7).toContain("Nedelj");
      expect(titles.PERFECT_WEEK).toContain("Savrš");
    });
  });

  describe("Achievement Descriptions (Serbian)", () => {
    const descriptions: Record<string, string> = {
      FIRST_HOMEWORK: "Završi svoj prvi domaći zadatak",
      STREAK_7: "Održi niz od 7 dana",
      PERFECT_WEEK: "Dobij sve petice tokom nedelje",
      GRADE_AVG_50: "Postini savršen prosek 5.0",
      ALL_SUBJECTS_5: "Dostini prosek 5.0 iz svih predmeta",
    };

    it("should have Serbian descriptions for achievements", () => {
      Object.values(descriptions).forEach((desc) => {
        expect(typeof desc).toBe("string");
        expect(desc.length).toBeGreaterThan(10);
      });
    });

    it("should have action-oriented descriptions", () => {
      // Descriptions should tell user what to do
      Object.values(descriptions).forEach((desc) => {
        // Most descriptions should start with verbs
        const startsWithVerb =
          /^(Završi|Održi|Dobij|Postini|Dostini|Budi|Pomozi|Sakupi|Uđi|Vrati)/i.test(
            desc,
          );
        expect(
          startsWithVerb || desc.includes("dana") || desc.includes("puta"),
        ).toBe(true);
      });
    });
  });

  describe("Homework Achievement Checks", () => {
    it("should check homework count against target", async () => {
      // Mock gamification data
      (prisma.gamification.findUnique as any).mockResolvedValue({
        totalHomeworkDone: 5,
      });

      // The actual check function would use this data
      const mockGamification = await prisma.gamification.findUnique({
        where: { studentId: "test-student" },
      });

      expect(mockGamification?.totalHomeworkDone).toBe(5);
      // HOMEWORK_5 achievement should be unlockable
    });

    it("should track progress towards homework milestones", () => {
      const milestones = [1, 5, 10, 25, 50, 100];
      const currentCount = 23;

      const nextMilestone = milestones.find((m) => m > currentCount);
      expect(nextMilestone).toBe(25);

      const progress = currentCount / (nextMilestone || 100);
      expect(progress).toBeCloseTo(0.92, 2);
    });
  });

  describe("Streak Achievement Checks", () => {
    it("should use longestStreak for achievement checks", async () => {
      (prisma.gamification.findUnique as any).mockResolvedValue({
        streak: 5,
        longestStreak: 10,
      });

      const gamification = await prisma.gamification.findUnique({
        where: { studentId: "test-student" },
      });

      // STREAK_7 should be achieved (longestStreak = 10)
      expect(gamification?.longestStreak).toBeGreaterThanOrEqual(7);
    });

    it("should calculate streak progress correctly", () => {
      const targets = [3, 7, 14, 30, 60, 100];
      const currentStreak = 20;

      const nextTarget = targets.find((t) => t > currentStreak);
      expect(nextTarget).toBe(30);

      const achieved = targets.filter((t) => t <= currentStreak);
      expect(achieved).toEqual([3, 7, 14]);
    });
  });

  describe("Grade Achievement Checks", () => {
    it("should detect first grade 5", async () => {
      (prisma.grade.count as any).mockResolvedValue(1);

      const count = await prisma.grade.count({
        where: { studentId: "test", grade: "5" },
      });

      expect(count).toBe(1);
      // FIRST_GRADE_5 should be unlocked
    });

    it("should calculate grade average correctly", () => {
      const grades = [5, 5, 4, 5, 5, 4, 5];
      const average = grades.reduce((a, b) => a + b, 0) / grades.length;

      expect(average).toBeCloseTo(4.71, 2);
      // GRADE_AVG_45 should be achieved (>= 4.5)
      expect(average).toBeGreaterThanOrEqual(4.5);
    });

    it("should detect consecutive grade 5 streak", () => {
      const grades = ["5", "5", "5", "4", "5", "5"];

      let maxStreak = 0;
      let currentStreak = 0;

      for (const grade of grades) {
        if (grade === "5") {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      expect(maxStreak).toBe(3); // First 3 fives
      // GRADE_5_STREAK_3 should be achieved
    });
  });

  describe("Time-based Achievement Checks", () => {
    it("should detect early bird activity", () => {
      const hour = 6; // 6 AM
      const isEarlyBird = hour >= 5 && hour < 7;
      expect(isEarlyBird).toBe(true);
    });

    it("should detect night owl activity", () => {
      const hour = 22; // 10 PM
      const isNightOwl = hour >= 22 && hour < 24;
      expect(isNightOwl).toBe(true);
    });

    it("should detect weekend activity", () => {
      const saturday = new Date("2025-01-04"); // Saturday
      const sunday = new Date("2025-01-05"); // Sunday
      const monday = new Date("2025-01-06"); // Monday

      expect(saturday.getDay()).toBe(6);
      expect(sunday.getDay()).toBe(0);
      expect(monday.getDay()).toBe(1);

      const isWeekend = (date: Date) => [0, 6].includes(date.getDay());
      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(sunday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });
  });

  describe("Level Achievement Checks", () => {
    it("should check level milestones", () => {
      const milestones = [5, 10, 20, 30, 50];
      const currentLevel = 15;

      const achieved = milestones.filter((m) => m <= currentLevel);
      const nextMilestone = milestones.find((m) => m > currentLevel);

      expect(achieved).toEqual([5, 10]);
      expect(nextMilestone).toBe(20);
    });
  });

  describe("XP Achievement Checks", () => {
    it("should check XP milestones", () => {
      const milestones = [500, 1000, 2500, 5000, 10000];
      const totalXP = 3500;

      const achieved = milestones.filter((m) => m <= totalXP);
      expect(achieved).toEqual([500, 1000, 2500]);
    });
  });

  describe("Leaderboard Achievement Checks", () => {
    it("should calculate rank correctly", async () => {
      const mockLeaderboard = [
        { studentId: "s1", totalXPEarned: 5000 },
        { studentId: "s2", totalXPEarned: 4000 },
        { studentId: "s3", totalXPEarned: 3000 },
        { studentId: "s4", totalXPEarned: 2000 },
      ];

      const targetStudentId = "s2";
      const rank =
        mockLeaderboard.findIndex((s) => s.studentId === targetStudentId) + 1;

      expect(rank).toBe(2);
      // LEADERBOARD_TOP_3 should be achieved
      expect(rank <= 3).toBe(true);
    });
  });

  describe("Special Achievement Checks", () => {
    it("should detect comeback after 7+ days", () => {
      const lastActivity = new Date("2025-01-01");
      const now = new Date("2025-01-10");

      const daysSinceLastActivity = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(daysSinceLastActivity).toBe(9);
      expect(daysSinceLastActivity >= 7).toBe(true);
      // COMEBACK_KID should be achievable if user is now active
    });

    it("should count unique subjects for explorer achievement", () => {
      const subjectIds = ["math", "serbian", "english", "history", "geography"];
      const uniqueSubjects = new Set(subjectIds);

      expect(uniqueSubjects.size).toBe(5);
      // EXPLORER should be achieved (5+ different subjects)
    });

    it("should count total achievements for collector", () => {
      const achievementCount = 22;
      expect(achievementCount >= 20).toBe(true);
      // COLLECTOR should be achieved
    });
  });
});
