// Learning Analytics - AI-powered insights for students
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export interface LearningInsights {
  strengths: string[]; // Subjects they're good at
  weaknesses: string[]; // Subjects needing improvement
  completionRate: number; // % homework completed
  averageTimeToComplete: number; // Hours
  bestTimeToStudy: string; // "08:00-10:00" based on patterns
  streak: number;
  recommendedActions: string[];
  motivationalMessage: string;
  totalFocusTime: number; // Total minutes focused
  focusSessionsCount: number; // Number of focus sessions
}

/**
 * Analyze student's learning patterns
 * Mobile-optimized: Simple, actionable insights
 */
export async function analyzeLearningPatterns(
  studentId: string,
): Promise<LearningInsights> {
  try {
    // Get homework data
    const homework = await prisma.homework.findMany({
      where: { studentId },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
      take: 100, // Last 100 assignments
    });

    // Get focus sessions
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        studentId,
        status: "COMPLETED",
      },
      orderBy: { startTime: "desc" },
      take: 50,
    });

    const totalFocusTime = focusSessions.reduce(
      (acc, session) => acc + (session.duration || 0),
      0,
    );

    // Get gamification data
    const gamif = await prisma.gamification.findUnique({
      where: { studentId },
    });

    // Calculate completion rate
    const completed = homework.filter(
      (h) => h.status === "DONE" || h.status === "SUBMITTED",
    ).length;
    const completionRate =
      homework.length > 0 ? (completed / homework.length) * 100 : 0;

    // Find strengths (subjects with high completion rate)
    const subjectStats = new Map<
      string,
      { completed: number; total: number }
    >();

    for (const hw of homework) {
      const subject = hw.subject.name;
      const stats = subjectStats.get(subject) || { completed: 0, total: 0 };

      stats.total++;
      if (hw.status === "DONE" || hw.status === "SUBMITTED") {
        stats.completed++;
      }

      subjectStats.set(subject, stats);
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const [subject, stats] of subjectStats.entries()) {
      const rate = stats.completed / stats.total;

      if (rate >= 0.8 && stats.total >= 5) {
        strengths.push(subject);
      } else if (rate < 0.5 && stats.total >= 5) {
        weaknesses.push(subject);
      }
    }

    // Best time to study (mock - would need real time tracking)
    const bestTimeToStudy = "08:00-10:00"; // Morning is usually best for kids

    // Generate recommendations
    const recommendedActions: string[] = [];

    if (weaknesses.length > 0) {
      recommendedActions.push(
        `Probaj da radiš ${weaknesses[0]} ujutru kada si najsvežiji! 🌅`,
      );
    }

    if (completionRate < 70) {
      recommendedActions.push(
        "Započni sa najlakšim zadatkom - mala pobeda = velika motivacija! 💪",
      );
    }

    if (gamif && gamif.streak === 0) {
      recommendedActions.push(
        "Pokušaj da radiš barem 1 zadatak svaki dan! Streak je moćna stvar! 🔥",
      );
    }

    if (strengths.length > 0) {
      recommendedActions.push(
        `${strengths[0]} ti odlično ide! Možda možeš da pomogneš drugovima? 🌟`,
      );
    }

    if (totalFocusTime > 60) {
      recommendedActions.push(
        "Odličan fokus! 🧠 Tvoj mozak je kao mišić, što ga više vežbaš, to je jači!",
      );
    }

    // Motivational message based on performance
    let motivationalMessage = "";

    if (completionRate >= 90) {
      motivationalMessage = "Ti si superstar! Odličan si! 🌟 Nastavi tako!";
    } else if (completionRate >= 70) {
      motivationalMessage = "Ide ti dobro! 👍 Još malo truda i biće savršeno!";
    } else if (completionRate >= 50) {
      motivationalMessage = "Dobar pokušaj! 😊 Svaki dan si sve bolji!";
    } else {
      motivationalMessage =
        "Ne brini! 💙 Učenje je put, ne destinacija. Probaj malo svaki dan!";
    }

    return {
      strengths,
      weaknesses,
      completionRate: Math.round(completionRate),
      averageTimeToComplete: 2.5, // Mock - would calculate from actual data
      bestTimeToStudy,
      streak: gamif?.streak || 0,
      recommendedActions,
      motivationalMessage,
      totalFocusTime,
      focusSessionsCount: focusSessions.length,
    };
  } catch (error) {
    log.error("Failed to analyze learning patterns", { error, studentId });

    // Return default insights on error
    return {
      strengths: [],
      weaknesses: [],
      completionRate: 0,
      averageTimeToComplete: 0,
      bestTimeToStudy: "08:00-10:00",
      streak: 0,
      recommendedActions: ["Počni sa jednim zadatkom! Možeš to! 💪"],
      motivationalMessage: "Hajde da počnemo! Verujem u tebe! 🚀",
      totalFocusTime: 0,
      focusSessionsCount: 0,
    };
  }
}

/**
 * Get weekly summary for student
 * Used for parent reports
 */
export async function getWeeklySummary(studentId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [homeworkThisWeek, activitiesThisWeek, gamif] = await Promise.all([
    prisma.homework.findMany({
      where: {
        studentId,
        createdAt: { gte: weekAgo },
      },
      include: { subject: true },
    }),
    prisma.activityLog.findMany({
      where: {
        studentId,
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.gamification.findUnique({
      where: { studentId },
      include: {
        achievements: {
          where: {
            unlockedAt: { gte: weekAgo },
          },
        },
      },
    }),
  ]);

  const completed = homeworkThisWeek.filter(
    (h: (typeof homeworkThisWeek)[number]) =>
      h.status === "DONE" || h.status === "SUBMITTED",
  ).length;

  return {
    homeworkAssigned: homeworkThisWeek.length,
    homeworkCompleted: completed,
    completionRate:
      homeworkThisWeek.length > 0
        ? (completed / homeworkThisWeek.length) * 100
        : 0,
    activitiesCount: activitiesThisWeek.length,
    xpGained: gamif?.xp || 0,
    currentLevel: gamif?.level || 1,
    streak: gamif?.streak || 0,
    newAchievements: gamif?.achievements || [],
  };
}
