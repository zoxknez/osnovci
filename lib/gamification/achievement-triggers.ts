import prisma from "@/lib/db/prisma";
import { AchievementType, NotificationType } from "@prisma/client";
import { log } from "@/lib/logger";

// Achievement unlock logic
interface AchievementCheck {
  type: AchievementType;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

// Check all achievements for a student
export async function checkAndUnlockAchievements(
  studentId: string
): Promise<AchievementCheck[]> {
  try {
    const results: AchievementCheck[] = [];

    // Fetch student gamification data
    const gamification = await prisma.gamification.findUnique({
      where: { studentId },
      include: {
        achievements: true,
      },
    });

    if (!gamification) {
      return results;
    }

    // Get all unlocked achievement types
    const unlockedTypes = new Set(
      gamification.achievements.map((a) => a.type)
    );

    // Check each achievement type
    for (const achievementType of Object.values(AchievementType)) {
      if (unlockedTypes.has(achievementType)) {
        results.push({ type: achievementType, unlocked: true });
        continue;
      }

      const check = await checkAchievement(studentId, achievementType);
      results.push(check);

      // Unlock if criteria met
      if (check.unlocked && !unlockedTypes.has(achievementType)) {
        await unlockAchievement(studentId, achievementType);
      }
    }

    return results;
  } catch (error) {
    log.error("Error checking achievements", error, { studentId });
    return [];
  }
}

// Check specific achievement
async function checkAchievement(
  studentId: string,
  type: AchievementType
): Promise<AchievementCheck> {
  try {
    switch (type) {
      // Homework Achievements
      case "FIRST_HOMEWORK":
        return await checkHomeworkCount(studentId, type, 1);
      case "HOMEWORK_5":
        return await checkHomeworkCount(studentId, type, 5);
      case "HOMEWORK_10":
        return await checkHomeworkCount(studentId, type, 10);
      case "HOMEWORK_25":
        return await checkHomeworkCount(studentId, type, 25);
      case "HOMEWORK_50":
        return await checkHomeworkCount(studentId, type, 50);
      case "HOMEWORK_100":
        return await checkHomeworkCount(studentId, type, 100);
      case "ALL_HOMEWORK_WEEK":
        return await checkAllHomeworkWeek(studentId);
      case "ALL_HOMEWORK_MONTH":
        return await checkAllHomeworkMonth(studentId);

      // Streak Achievements
      case "STREAK_3":
        return await checkStreak(studentId, type, 3);
      case "STREAK_7":
        return await checkStreak(studentId, type, 7);
      case "STREAK_14":
        return await checkStreak(studentId, type, 14);
      case "STREAK_30":
        return await checkStreak(studentId, type, 30);
      case "STREAK_60":
        return await checkStreak(studentId, type, 60);
      case "STREAK_100":
        return await checkStreak(studentId, type, 100);

      // Level Achievements
      case "LEVEL_5":
        return await checkLevel(studentId, type, 5);
      case "LEVEL_10":
        return await checkLevel(studentId, type, 10);
      case "LEVEL_20":
        return await checkLevel(studentId, type, 20);
      case "LEVEL_30":
        return await checkLevel(studentId, type, 30);
      case "LEVEL_50":
        return await checkLevel(studentId, type, 50);

      // XP Achievements
      case "XP_500":
        return await checkXP(studentId, type, 500);
      case "XP_1000":
        return await checkXP(studentId, type, 1000);
      case "XP_2500":
        return await checkXP(studentId, type, 2500);
      case "XP_5000":
        return await checkXP(studentId, type, 5000);
      case "XP_10000":
        return await checkXP(studentId, type, 10000);

      // Grade Achievements
      case "FIRST_GRADE_5":
        return await checkFirstGradeFive(studentId);
      case "GRADE_5_STREAK_3":
        return await checkGradeFiveStreak(studentId, type, 3);
      case "GRADE_5_STREAK_5":
        return await checkGradeFiveStreak(studentId, type, 5);
      case "GRADE_5_STREAK_10":
        return await checkGradeFiveStreak(studentId, type, 10);
      case "PERFECT_WEEK":
        return await checkPerfectWeek(studentId);
      case "PERFECT_MONTH":
        return await checkPerfectMonth(studentId);
      case "GRADE_AVG_45":
        return await checkGradeAverage(studentId, type, 4.5);
      case "GRADE_AVG_48":
        return await checkGradeAverage(studentId, type, 4.8);
      case "GRADE_AVG_50":
        return await checkGradeAverage(studentId, type, 5.0);

      // Time-based Achievements
      case "EARLY_BIRD":
        return await checkEarlyBird(studentId);
      case "NIGHT_OWL":
        return await checkNightOwl(studentId);
      case "WEEKEND_WARRIOR":
        return await checkWeekendWarrior(studentId);
      case "EARLY_SUBMISSION":
        return await checkEarlySubmissionCount(studentId, type, 1);
      case "EARLY_SUBMISSION_10":
        return await checkEarlySubmissionCount(studentId, type, 10);
      case "EARLY_SUBMISSION_25":
        return await checkEarlySubmissionCount(studentId, type, 25);

      // Speed Achievements
      case "SPEED_DEMON":
        return await checkSpeedDemon(studentId);
      case "SPEEDRUNNER_5":
        return await checkSpeedrunner(studentId, type, 5);
      case "SPEEDRUNNER_10":
        return await checkSpeedrunner(studentId, type, 10);
      case "LIGHTNING_FAST":
        return await checkLightningFast(studentId);

      // Subject Achievements
      case "SUBJECT_MASTER":
        return await checkSubjectMaster(studentId);
      case "ALL_SUBJECTS_5":
        return await checkAllSubjectsFive(studentId);
      case "SUBJECT_SPECIALIST":
        return await checkSubjectSpecialist(studentId);

      // Social Achievements
      case "HELPER":
        return await checkHelper(studentId);
      case "SOCIAL_BUTTERFLY":
        return await checkSocialButterfly(studentId);
      case "TEAM_PLAYER":
        return await checkTeamPlayer(studentId);

      // Consistency Achievements
      case "CONSISTENT_7":
        return await checkConsistency(studentId, type, 7);
      case "CONSISTENT_30":
        return await checkConsistency(studentId, type, 30);
      case "CONSISTENT_90":
        return await checkConsistency(studentId, type, 90);
      case "PERFECTIONIST":
        return await checkPerfectionist(studentId);

      // Special Achievements
      case "COMEBACK_KID":
        return await checkComebackKid(studentId);
      case "EXPLORER":
        return await checkExplorer(studentId);
      case "OVERACHIEVER":
        return await checkOverachiever(studentId);
      case "COLLECTOR":
        return await checkCollector(studentId);
      case "TOP_STUDENT":
        return await checkTopStudent(studentId);
      case "LEADERBOARD_TOP_3":
        return await checkLeaderboardRank(studentId, type, 3);
      case "LEADERBOARD_TOP_10":
        return await checkLeaderboardRank(studentId, type, 10);

      default:
        return { type, unlocked: false };
    }
  } catch (error) {
    log.error("Error checking achievement", error, { studentId, type });
    return { type, unlocked: false };
  }
}

// ==================== HOMEWORK ACHIEVEMENTS ====================

async function checkHomeworkCount(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const count = gamification?.totalHomeworkDone || 0;

  return {
    type,
    unlocked: count >= target,
    progress: Math.min(count, target),
    maxProgress: target,
  };
}

async function checkAllHomeworkWeek(studentId: string): Promise<AchievementCheck> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [total, completed] = await Promise.all([
    prisma.homework.count({
      where: {
        studentId,
        dueDate: { gte: weekStart, lt: weekEnd },
      },
    }),
    prisma.homework.count({
      where: {
        studentId,
        dueDate: { gte: weekStart, lt: weekEnd },
        status: "DONE",
      },
    }),
  ]);

  return {
    type: "ALL_HOMEWORK_WEEK",
    unlocked: total > 0 && completed === total,
    progress: completed,
    maxProgress: total || 1,
  };
}

async function checkAllHomeworkMonth(studentId: string): Promise<AchievementCheck> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [total, completed] = await Promise.all([
    prisma.homework.count({
      where: {
        studentId,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.homework.count({
      where: {
        studentId,
        dueDate: { gte: monthStart, lte: monthEnd },
        status: "DONE",
      },
    }),
  ]);

  return {
    type: "ALL_HOMEWORK_MONTH",
    unlocked: total > 0 && completed === total,
    progress: completed,
    maxProgress: total || 1,
  };
}

// ==================== STREAK ACHIEVEMENTS ====================

async function checkStreak(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const currentStreak = gamification?.longestStreak || 0;

  return {
    type,
    unlocked: currentStreak >= target,
    progress: Math.min(currentStreak, target),
    maxProgress: target,
  };
}

// ==================== LEVEL ACHIEVEMENTS ====================

async function checkLevel(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const level = gamification?.level || 1;

  return {
    type,
    unlocked: level >= target,
    progress: Math.min(level, target),
    maxProgress: target,
  };
}

// ==================== XP ACHIEVEMENTS ====================

async function checkXP(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const totalXP = gamification?.totalXPEarned || 0;

  return {
    type,
    unlocked: totalXP >= target,
    progress: Math.min(totalXP, target),
    maxProgress: target,
  };
}

// ==================== GRADE ACHIEVEMENTS ====================

async function checkFirstGradeFive(studentId: string): Promise<AchievementCheck> {
  const count = await prisma.grade.count({
    where: { studentId, grade: "5" },
  });

  return {
    type: "FIRST_GRADE_5",
    unlocked: count >= 1,
    progress: Math.min(count, 1),
    maxProgress: 1,
  };
}

async function checkGradeFiveStreak(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const grades = await prisma.grade.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let currentStreak = 0;
  let maxStreak = 0;

  for (const grade of grades) {
    if (parseFloat(grade.grade) === 5) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return {
    type,
    unlocked: maxStreak >= target,
    progress: Math.min(maxStreak, target),
    maxProgress: target,
  };
}

async function checkPerfectWeek(studentId: string): Promise<AchievementCheck> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      createdAt: { gte: weekStart, lt: weekEnd },
    },
  });

  const allPerfect = grades.length > 0 && grades.every((g) => parseFloat(g.grade) === 5);

  return {
    type: "PERFECT_WEEK",
    unlocked: allPerfect,
    progress: grades.filter((g) => parseFloat(g.grade) === 5).length,
    maxProgress: grades.length || 1,
  };
}

async function checkPerfectMonth(studentId: string): Promise<AchievementCheck> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      createdAt: { gte: monthStart, lte: monthEnd },
    },
  });

  const allPerfect = grades.length >= 5 && grades.every((g) => parseFloat(g.grade) === 5);

  return {
    type: "PERFECT_MONTH",
    unlocked: allPerfect,
    progress: grades.filter((g) => parseFloat(g.grade) === 5).length,
    maxProgress: Math.max(grades.length, 5),
  };
}

async function checkGradeAverage(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const grades = await prisma.grade.findMany({
    where: { studentId },
  });

  if (grades.length === 0) {
    return { type, unlocked: false, progress: 0, maxProgress: 100 };
  }

  const sum = grades.reduce((acc, g) => acc + parseFloat(g.grade), 0);
  const avg = sum / grades.length;

  return {
    type,
    unlocked: avg >= target,
    progress: Math.min(Math.round(avg * 20), 100),
    maxProgress: 100,
  };
}

// ==================== TIME-BASED ACHIEVEMENTS ====================

async function checkEarlyBird(studentId: string): Promise<AchievementCheck> {
  const count = await prisma.activityLog.count({
    where: {
      studentId,
      createdAt: {
        gte: new Date(new Date().setHours(5, 0, 0, 0)),
        lt: new Date(new Date().setHours(7, 0, 0, 0)),
      },
    },
  });

  return {
    type: "EARLY_BIRD",
    unlocked: count >= 10,
    progress: Math.min(count, 10),
    maxProgress: 10,
  };
}

async function checkNightOwl(studentId: string): Promise<AchievementCheck> {
  const count = await prisma.activityLog.count({
    where: {
      studentId,
      createdAt: {
        gte: new Date(new Date().setHours(22, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });

  return {
    type: "NIGHT_OWL",
    unlocked: count >= 10,
    progress: Math.min(count, 10),
    maxProgress: 10,
  };
}

async function checkWeekendWarrior(studentId: string): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const count = gamification?.weekendTasks || 0;

  return {
    type: "WEEKEND_WARRIOR",
    unlocked: count >= 10,
    progress: Math.min(count, 10),
    maxProgress: 10,
  };
}

async function checkEarlySubmissionCount(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const count = gamification?.earlySubmissions || 0;

  return {
    type,
    unlocked: count >= target,
    progress: Math.min(count, target),
    maxProgress: target,
  };
}

// ==================== SPEED ACHIEVEMENTS ====================

async function checkSpeedDemon(studentId: string): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const count = gamification?.fastCompletions || 0;

  return {
    type: "SPEED_DEMON",
    unlocked: count >= 1,
    progress: Math.min(count, 1),
    maxProgress: 1,
  };
}

async function checkSpeedrunner(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const count = gamification?.fastCompletions || 0;

  return {
    type,
    unlocked: count >= target,
    progress: Math.min(count, target),
    maxProgress: target,
  };
}

async function checkLightningFast(studentId: string): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const count = gamification?.fastCompletions || 0;

  return {
    type: "LIGHTNING_FAST",
    unlocked: count >= 20,
    progress: Math.min(count, 20),
    maxProgress: 20,
  };
}

// ==================== SUBJECT ACHIEVEMENTS ====================

async function checkSubjectMaster(studentId: string): Promise<AchievementCheck> {
  const grades = await prisma.grade.findMany({
    where: { studentId },
    include: { subject: true },
  });

  const subjectAverages = new Map<string, { sum: number; count: number }>();

  for (const grade of grades) {
    const key = grade.subjectId;
    const existing = subjectAverages.get(key) || { sum: 0, count: 0 };
    existing.sum += parseFloat(grade.grade);
    existing.count++;
    subjectAverages.set(key, existing);
  }

  let masterCount = 0;
  for (const { sum, count } of subjectAverages.values()) {
    if (sum / count >= 4.8) masterCount++;
  }

  return {
    type: "SUBJECT_MASTER",
    unlocked: masterCount >= 1,
    progress: masterCount,
    maxProgress: subjectAverages.size || 1,
  };
}

async function checkAllSubjectsFive(studentId: string): Promise<AchievementCheck> {
  const subjects = await prisma.subject.findMany();
  const grades = await prisma.grade.findMany({
    where: { studentId },
  });

  const subjectAverages = new Map<string, number[]>();
  for (const grade of grades) {
    const arr = subjectAverages.get(grade.subjectId) || [];
    arr.push(parseFloat(grade.grade));
    subjectAverages.set(grade.subjectId, arr);
  }

  let perfectCount = 0;
  for (const [, gradesList] of subjectAverages) {
    const avg = gradesList.reduce((a, b) => a + b, 0) / gradesList.length;
    if (avg === 5.0) perfectCount++;
  }

  return {
    type: "ALL_SUBJECTS_5",
    unlocked: perfectCount === subjects.length && subjects.length > 0,
    progress: perfectCount,
    maxProgress: subjects.length || 1,
  };
}

async function checkSubjectSpecialist(studentId: string): Promise<AchievementCheck> {
  const grades = await prisma.grade.findMany({
    where: { studentId },
  });

  const subjectCounts = new Map<string, number>();
  for (const grade of grades) {
    subjectCounts.set(grade.subjectId, (subjectCounts.get(grade.subjectId) || 0) + 1);
  }

  const maxCount = Math.max(...Array.from(subjectCounts.values()), 0);

  return {
    type: "SUBJECT_SPECIALIST",
    unlocked: maxCount >= 20,
    progress: Math.min(maxCount, 20),
    maxProgress: 20,
  };
}

// ==================== SOCIAL ACHIEVEMENTS ====================

async function checkHelper(studentId: string): Promise<AchievementCheck> {
  const count = await prisma.activityLog.count({
    where: { studentId, type: "HOMEWORK_CREATED" },
  });

  return {
    type: "HELPER",
    unlocked: count >= 25,
    progress: Math.min(count, 25),
    maxProgress: 25,
  };
}

async function checkSocialButterfly(studentId: string): Promise<AchievementCheck> {
  const count = await prisma.activityLog.count({
    where: { studentId },
  });

  return {
    type: "SOCIAL_BUTTERFLY",
    unlocked: count >= 100,
    progress: Math.min(count, 100),
    maxProgress: 100,
  };
}

async function checkTeamPlayer(studentId: string): Promise<AchievementCheck> {
  const count = await prisma.activityLog.count({
    where: { studentId },
  });

  return {
    type: "TEAM_PLAYER",
    unlocked: count >= 50,
    progress: Math.min(count, 50),
    maxProgress: 50,
  };
}

// ==================== CONSISTENCY ACHIEVEMENTS ====================

async function checkConsistency(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const streak = gamification?.streak || 0;

  return {
    type,
    unlocked: streak >= target,
    progress: Math.min(streak, target),
    maxProgress: target,
  };
}

async function checkPerfectionist(studentId: string): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const perfectWeeks = gamification?.perfectWeeks || 0;

  return {
    type: "PERFECTIONIST",
    unlocked: perfectWeeks >= 4,
    progress: Math.min(perfectWeeks, 4),
    maxProgress: 4,
  };
}

// ==================== SPECIAL ACHIEVEMENTS ====================

async function checkComebackKid(studentId: string): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const lastActivity = gamification?.lastActivityDate;
  if (!lastActivity) {
    return { type: "COMEBACK_KID", unlocked: false };
  }

  const daysSinceLastActivity = Math.floor(
    (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    type: "COMEBACK_KID",
    unlocked: daysSinceLastActivity >= 7 && gamification.streak > 0,
    progress: daysSinceLastActivity >= 7 ? 1 : 0,
    maxProgress: 1,
  };
}

async function checkExplorer(studentId: string): Promise<AchievementCheck> {
  const subjects = await prisma.grade.findMany({
    where: { studentId },
    distinct: ["subjectId"],
  });

  return {
    type: "EXPLORER",
    unlocked: subjects.length >= 5,
    progress: subjects.length,
    maxProgress: 5,
  };
}

async function checkOverachiever(studentId: string): Promise<AchievementCheck> {
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
  });

  const totalXP = gamification?.totalXPEarned || 0;

  return {
    type: "OVERACHIEVER",
    unlocked: totalXP >= 15000,
    progress: Math.min(totalXP, 15000),
    maxProgress: 15000,
  };
}

async function checkCollector(studentId: string): Promise<AchievementCheck> {
  const achievementCount = await prisma.achievement.count({
    where: {
      gamification: { studentId },
    },
  });

  return {
    type: "COLLECTOR",
    unlocked: achievementCount >= 20,
    progress: Math.min(achievementCount, 20),
    maxProgress: 20,
  };
}

async function checkTopStudent(studentId: string): Promise<AchievementCheck> {
  const allGamifications = await prisma.gamification.findMany({
    orderBy: { totalXPEarned: "desc" },
    take: 1,
  });

  const isTop = allGamifications.length > 0 && allGamifications[0]?.studentId === studentId;

  return {
    type: "TOP_STUDENT",
    unlocked: isTop,
    progress: isTop ? 1 : 0,
    maxProgress: 1,
  };
}

async function checkLeaderboardRank(
  studentId: string,
  type: AchievementType,
  target: number
): Promise<AchievementCheck> {
  const allGamifications = await prisma.gamification.findMany({
    where: { showOnLeaderboard: true },
    orderBy: { totalXPEarned: "desc" },
    take: target,
  });

  const rank = allGamifications.findIndex((g) => g.studentId === studentId) + 1;

  return {
    type,
    unlocked: rank > 0 && rank <= target,
    progress: rank > 0 ? target - rank + 1 : 0,
    maxProgress: target,
  };
}

// ==================== UNLOCK ACHIEVEMENT ====================

async function unlockAchievement(
  studentId: string,
  type: AchievementType
): Promise<void> {
  try {
    const gamification = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamification) {
      log.error("Gamification not found", { studentId });
      return;
    }

    const xpReward = getAchievementXP(type);

    await prisma.achievement.create({
      data: {
        gamificationId: gamification.id,
        type,
        title: getAchievementTitle(type),
        description: getAchievementDescription(type),
        xpReward,
        rarity: getAchievementRarity(type),
      },
    });

    await prisma.gamification.update({
      where: { studentId },
      data: {
        totalXPEarned: { increment: xpReward },
        xp: { increment: xpReward },
      },
    });

    await sendAchievementNotification(studentId, type);

    log.info("Achievement unlocked", { studentId, type, xpReward });
  } catch (error) {
    log.error("Error unlocking achievement", error, { studentId, type });
  }
}

// ==================== HELPER FUNCTIONS ====================

function getAchievementXP(type: AchievementType): number {
  const xpMap: Record<AchievementType, number> = {
    // Homework
    FIRST_HOMEWORK: 50,
    HOMEWORK_5: 100,
    HOMEWORK_10: 150,
    HOMEWORK_25: 300,
    HOMEWORK_50: 500,
    HOMEWORK_100: 1000,
    ALL_HOMEWORK_WEEK: 200,
    ALL_HOMEWORK_MONTH: 500,

    // Streaks
    STREAK_3: 100,
    STREAK_7: 200,
    STREAK_14: 400,
    STREAK_30: 800,
    STREAK_60: 1500,
    STREAK_100: 3000,

    // Levels
    LEVEL_5: 200,
    LEVEL_10: 400,
    LEVEL_20: 800,
    LEVEL_30: 1200,
    LEVEL_50: 2000,

    // XP milestones
    XP_500: 50,
    XP_1000: 100,
    XP_2500: 250,
    XP_5000: 500,
    XP_10000: 1000,

    // Grades
    FIRST_GRADE_5: 50,
    GRADE_5_STREAK_3: 150,
    GRADE_5_STREAK_5: 250,
    GRADE_5_STREAK_10: 500,
    PERFECT_WEEK: 400,
    PERFECT_MONTH: 1000,
    GRADE_AVG_45: 300,
    GRADE_AVG_48: 500,
    GRADE_AVG_50: 1000,

    // Time-based
    EARLY_BIRD: 100,
    NIGHT_OWL: 100,
    WEEKEND_WARRIOR: 150,
    EARLY_SUBMISSION: 50,
    EARLY_SUBMISSION_10: 200,
    EARLY_SUBMISSION_25: 500,

    // Speed
    SPEED_DEMON: 100,
    SPEEDRUNNER_5: 200,
    SPEEDRUNNER_10: 400,
    LIGHTNING_FAST: 600,

    // Subjects
    SUBJECT_MASTER: 400,
    ALL_SUBJECTS_5: 1500,
    SUBJECT_SPECIALIST: 300,

    // Social
    HELPER: 200,
    SOCIAL_BUTTERFLY: 300,
    TEAM_PLAYER: 250,

    // Consistency
    CONSISTENT_7: 200,
    CONSISTENT_30: 600,
    CONSISTENT_90: 1500,
    PERFECTIONIST: 800,

    // Special
    COMEBACK_KID: 300,
    EXPLORER: 250,
    OVERACHIEVER: 2000,
    COLLECTOR: 1000,
    TOP_STUDENT: 5000,
    LEADERBOARD_TOP_3: 2000,
    LEADERBOARD_TOP_10: 1000,
  };

  return xpMap[type] || 50;
}

function getAchievementRarity(type: AchievementType): "COMMON" | "RARE" | "EPIC" | "LEGENDARY" {
  const legendary = ["PERFECT_MONTH", "GRADE_AVG_50", "ALL_SUBJECTS_5", "TOP_STUDENT", "STREAK_100", "OVERACHIEVER"];
  const epic = ["HOMEWORK_100", "STREAK_60", "LEVEL_50", "PERFECTIONIST", "LEADERBOARD_TOP_3", "COLLECTOR"];
  const rare = ["HOMEWORK_50", "STREAK_30", "LEVEL_30", "PERFECT_WEEK", "SUBJECT_MASTER", "LEADERBOARD_TOP_10"];

  if (legendary.includes(type)) return "LEGENDARY";
  if (epic.includes(type)) return "EPIC";
  if (rare.includes(type)) return "RARE";
  return "COMMON";
}

function getAchievementTitle(type: AchievementType): string {
  const titles: Record<AchievementType, string> = {
    // Homework
    FIRST_HOMEWORK: "Prvi Domaći",
    HOMEWORK_5: "Marljiv Učenik",
    HOMEWORK_10: "Vredan Radnik",
    HOMEWORK_25: "Domaćinski Majstor",
    HOMEWORK_50: "Polusto Zadataka",
    HOMEWORK_100: "Stotinar",
    ALL_HOMEWORK_WEEK: "Nedeljni Šampion",
    ALL_HOMEWORK_MONTH: "Mesečni Kralj",

    // Streaks
    STREAK_3: "Početak Niza",
    STREAK_7: "Nedeljni Ratnik",
    STREAK_14: "Dvonedeljni Heroj",
    STREAK_30: "Mesečni Majstor",
    STREAK_60: "Dvomesečna Legenda",
    STREAK_100: "Stotinjak Niz",

    // Levels
    LEVEL_5: "Nivo Petolinka",
    LEVEL_10: "Nivo Desetka",
    LEVEL_20: "Nivo Dvadesetka",
    LEVEL_30: "Nivo Tridesetka",
    LEVEL_50: "Nivo Pola Stotine",

    // XP
    XP_500: "500 Poena",
    XP_1000: "Hiljadu Poena",
    XP_2500: "Dva i Po Hiljade",
    XP_5000: "Pet Hiljada",
    XP_10000: "Deset Hiljada",

    // Grades
    FIRST_GRADE_5: "Prva Petica",
    GRADE_5_STREAK_3: "Tri Petice Zaredom",
    GRADE_5_STREAK_5: "Pet Petica Zaredom",
    GRADE_5_STREAK_10: "Deset Petica Zaredom",
    PERFECT_WEEK: "Savršena Nedelja",
    PERFECT_MONTH: "Savršeni Mesec",
    GRADE_AVG_45: "Prosek 4.5",
    GRADE_AVG_48: "Prosek 4.8",
    GRADE_AVG_50: "Savršen Prosek",

    // Time-based
    EARLY_BIRD: "Ranoranilac",
    NIGHT_OWL: "Noćna Ptica",
    WEEKEND_WARRIOR: "Vikend Ratnik",
    EARLY_SUBMISSION: "Brza Predaja",
    EARLY_SUBMISSION_10: "Deset Brzih",
    EARLY_SUBMISSION_25: "Dvadeset Pet Brzih",

    // Speed
    SPEED_DEMON: "Demon Brzine",
    SPEEDRUNNER_5: "Pet Brzih Završetaka",
    SPEEDRUNNER_10: "Deset Brzih Završetaka",
    LIGHTNING_FAST: "Munja Brz",

    // Subjects
    SUBJECT_MASTER: "Majstor Predmeta",
    ALL_SUBJECTS_5: "Sve Petice",
    SUBJECT_SPECIALIST: "Specijalist Predmeta",

    // Social
    HELPER: "Pomoćnik",
    SOCIAL_BUTTERFLY: "Društveni Leptir",
    TEAM_PLAYER: "Timski Igrač",

    // Consistency
    CONSISTENT_7: "Nedeljni Konzistentan",
    CONSISTENT_30: "Mesečni Konzistentan",
    CONSISTENT_90: "Tromesečni Konzistentan",
    PERFECTIONIST: "Perfekcionist",

    // Special
    COMEBACK_KID: "Povratak",
    EXPLORER: "Istraživač",
    OVERACHIEVER: "Prekoračivač",
    COLLECTOR: "Kolekcionar",
    TOP_STUDENT: "Najbolji Učenik",
    LEADERBOARD_TOP_3: "Top 3",
    LEADERBOARD_TOP_10: "Top 10",
  };

  return titles[type];
}

function getAchievementDescription(type: AchievementType): string {
  const descriptions: Record<AchievementType, string> = {
    // Homework
    FIRST_HOMEWORK: "Završi svoj prvi domaći zadatak",
    HOMEWORK_5: "Završi 5 domaćih zadataka",
    HOMEWORK_10: "Završi 10 domaćih zadataka",
    HOMEWORK_25: "Završi 25 domaćih zadataka",
    HOMEWORK_50: "Završi 50 domaćih zadataka",
    HOMEWORK_100: "Završi 100 domaćih zadataka",
    ALL_HOMEWORK_WEEK: "Završi sve domaće zadatke tokom nedelje",
    ALL_HOMEWORK_MONTH: "Završi sve domaće zadatke tokom meseca",

    // Streaks
    STREAK_3: "Održi niz od 3 dana",
    STREAK_7: "Održi niz od 7 dana",
    STREAK_14: "Održi niz od 14 dana",
    STREAK_30: "Održi niz od 30 dana",
    STREAK_60: "Održi niz od 60 dana",
    STREAK_100: "Održi niz od 100 dana",

    // Levels
    LEVEL_5: "Dostini nivo 5",
    LEVEL_10: "Dostini nivo 10",
    LEVEL_20: "Dostini nivo 20",
    LEVEL_30: "Dostini nivo 30",
    LEVEL_50: "Dostini nivo 50",

    // XP
    XP_500: "Sakupi 500 XP poena",
    XP_1000: "Sakupi 1000 XP poena",
    XP_2500: "Sakupi 2500 XP poena",
    XP_5000: "Sakupi 5000 XP poena",
    XP_10000: "Sakupi 10000 XP poena",

    // Grades
    FIRST_GRADE_5: "Dobij svoju prvu peticu",
    GRADE_5_STREAK_3: "Dobij 3 petice zaredom",
    GRADE_5_STREAK_5: "Dobij 5 petica zaredom",
    GRADE_5_STREAK_10: "Dobij 10 petica zaredom",
    PERFECT_WEEK: "Dobij sve petice tokom nedelje",
    PERFECT_MONTH: "Dobij sve petice tokom meseca",
    GRADE_AVG_45: "Postini prosek ocena 4.5",
    GRADE_AVG_48: "Postini prosek ocena 4.8",
    GRADE_AVG_50: "Postini savršen prosek 5.0",

    // Time-based
    EARLY_BIRD: "Budi aktivan pre 7h ujutro 10 puta",
    NIGHT_OWL: "Budi aktivan posle 22h 10 puta",
    WEEKEND_WARRIOR: "Završi 10 zadataka tokom vikenda",
    EARLY_SUBMISSION: "Predaj domaći pre roka",
    EARLY_SUBMISSION_10: "Predaj 10 domaćih pre roka",
    EARLY_SUBMISSION_25: "Predaj 25 domaćih pre roka",

    // Speed
    SPEED_DEMON: "Završi zadatak veoma brzo",
    SPEEDRUNNER_5: "Završi 5 zadataka veoma brzo",
    SPEEDRUNNER_10: "Završi 10 zadataka veoma brzo",
    LIGHTNING_FAST: "Završi 20 zadataka munja brzo",

    // Subjects
    SUBJECT_MASTER: "Dostini prosek 4.8 iz jednog predmeta",
    ALL_SUBJECTS_5: "Dostini prosek 5.0 iz svih predmeta",
    SUBJECT_SPECIALIST: "Dobij 20 ocena iz jednog predmeta",

    // Social
    HELPER: "Pomozi drugim učenicima 25 puta",
    SOCIAL_BUTTERFLY: "Budi aktivan 100 puta",
    TEAM_PLAYER: "Budi aktivan 50 puta",

    // Consistency
    CONSISTENT_7: "Budi konzistentan 7 dana zaredom",
    CONSISTENT_30: "Budi konzistentan 30 dana zaredom",
    CONSISTENT_90: "Budi konzistentan 90 dana zaredom",
    PERFECTIONIST: "Imaj 4 savršene nedelje",

    // Special
    COMEBACK_KID: "Vrati se nakon pauze od 7+ dana",
    EXPLORER: "Dobij ocene iz 5+ različitih predmeta",
    OVERACHIEVER: "Sakupi 15000+ XP poena",
    COLLECTOR: "Otključaj 20+ postignuća",
    TOP_STUDENT: "Postani najbolji učenik",
    LEADERBOARD_TOP_3: "Uđi u top 3 na leaderboard-u",
    LEADERBOARD_TOP_10: "Uđi u top 10 na leaderboard-u",
  };

  return descriptions[type];
}

async function sendAchievementNotification(
  studentId: string,
  type: AchievementType
): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return;

    await prisma.notification.create({
      data: {
        userId: student.userId,
        type: "INFO" as NotificationType,
        title: `🏆 Novo Postignuće: ${getAchievementTitle(type)}`,
        message: getAchievementDescription(type),
      },
    });
  } catch (error) {
    log.error("Error sending achievement notification", error, { studentId, type });
  }
}

// Trigger achievement check on specific events
export async function triggerAchievementCheck(
  studentId: string,
  event: "HOMEWORK_COMPLETED" | "GRADE_RECEIVED" | "LEVEL_UP" | "XP_GAINED"
): Promise<void> {
  try {
    log.info("Triggering achievement check", { studentId, event });
    await checkAndUnlockAchievements(studentId);
  } catch (error) {
    log.error("Error triggering achievement check", error, { studentId, event });
  }
}
