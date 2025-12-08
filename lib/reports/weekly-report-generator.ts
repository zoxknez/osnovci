/**
 * Weekly Report Generator - Simplified Version
 *
 * Generates weekly reports for students based on existing Prisma schema.
 * Uses actual fields: Homework (no grade/submittedAt), Student (has name),
 * Gamification (weeklyXP, streak), ActivityLog (type, not action)
 */

import { endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { sr } from "date-fns/locale";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export interface WeeklyReportData {
  student: {
    id: string;
    name: string;
    grade: number;
    avatar: string | null;
  };
  period: {
    startDate: Date;
    endDate: Date;
    weekNumber: number;
  };
  gamification: {
    weeklyXP: number;
    previousWeekXP: number;
    xpChange: number;
    currentLevel: number;
    currentStreak: number;
    achievementsUnlocked: number;
    totalHomeworkDone: number;
  };
  homework: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  subjects: Array<{
    name: string;
    homeworkCount: number;
    completionRate: number;
  }>;
  achievements: Array<{
    type: string;
    unlockedAt: Date;
  }>;
  recommendations: string[];
}

/**
 * Generate weekly report for a specific student
 */
export async function generateWeeklyReport(
  studentId: string,
  weekOffset: number = 0,
): Promise<WeeklyReportData> {
  try {
    const now = new Date();
    const targetDate = subWeeks(now, weekOffset);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

    log.info("Generating weekly report", { studentId, weekStart, weekEnd });

    // Fetch all data in a single optimized query
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        gamification: {
          include: {
            achievements: {
              where: {
                unlockedAt: {
                  gte: weekStart,
                  lte: weekEnd,
                },
              },
            },
          },
        },
        homework: {
          where: {
            dueDate: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          include: {
            subject: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const gamif = student.gamification;
    const homework = student.homework;

    // Get previous week gamification for comparison (still needs separate query as it's historical data)
    // Optimization: We could store history in a separate table to avoid this, but for now it's one extra query
    const prevGamif = await prisma.gamification.findUnique({
      where: { studentId },
      select: { weeklyXP: true },
    });

    // Calculate homework stats
    const completed = homework.filter(
      (h) => h.status === "SUBMITTED" || h.status === "REVIEWED",
    );

    // Group by subject
    const subjectMap = new Map<string, { count: number; completed: number }>();
    homework.forEach((h) => {
      const subjectName = h.subject.name;
      const existing = subjectMap.get(subjectName) || {
        count: 0,
        completed: 0,
      };
      existing.count++;
      if (h.status === "SUBMITTED" || h.status === "REVIEWED") {
        existing.completed++;
      }
      subjectMap.set(subjectName, existing);
    });

    const subjects = Array.from(subjectMap.entries()).map(([name, data]) => ({
      name,
      homeworkCount: data.count,
      completionRate: data.count > 0 ? (data.completed / data.count) * 100 : 0,
    }));

    // Generate recommendations
    const completionRate =
      homework.length > 0 ? (completed.length / homework.length) * 100 : 0;
    const recommendations = generateRecommendations({
      completionRate,
      currentStreak: gamif?.streak || 0,
      weeklyXP: gamif?.weeklyXP || 0,
      previousWeekXP: prevGamif?.weeklyXP || 0,
    });

    return {
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        avatar: student.avatar,
      },
      period: {
        startDate: weekStart,
        endDate: weekEnd,
        weekNumber: parseInt(format(weekStart, "w", { locale: sr }), 10),
      },
      gamification: {
        weeklyXP: gamif?.weeklyXP || 0,
        previousWeekXP: prevGamif?.weeklyXP || 0,
        xpChange: (gamif?.weeklyXP || 0) - (prevGamif?.weeklyXP || 0),
        currentLevel: gamif?.level || 1,
        currentStreak: gamif?.streak || 0,
        achievementsUnlocked: gamif?.achievements.length || 0,
        totalHomeworkDone: gamif?.totalHomeworkDone || 0,
      },
      homework: {
        total: homework.length,
        completed: completed.length,
        pending: homework.length - completed.length,
        completionRate,
      },
      subjects: subjects.sort((a, b) => b.completionRate - a.completionRate),
      achievements:
        gamif?.achievements.map((a) => ({
          type: a.type,
          unlockedAt: a.unlockedAt,
        })) || [],
      recommendations,
    };
  } catch (error) {
    log.error("Failed to generate weekly report", error, { studentId });
    throw error;
  }
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(data: {
  completionRate: number;
  currentStreak: number;
  weeklyXP: number;
  previousWeekXP: number;
}): string[] {
  const recommendations: string[] = [];

  // Completion rate
  if (data.completionRate < 70) {
    recommendations.push(
      "💡 Pokušaj da završiš više domaćih zadataka. Ciljaj 100%!",
    );
  } else if (data.completionRate >= 90) {
    recommendations.push(
      "🌟 Odličan procenat završenih zadataka! Nastavi tako!",
    );
  }

  // Streak
  if (data.currentStreak === 0) {
    recommendations.push(
      "🔥 Započni novi streak! Svaki dan rada donosi bonus XP.",
    );
  } else if (data.currentStreak >= 7 && data.currentStreak < 30) {
    recommendations.push(
      `🔥 Super streak od ${data.currentStreak} dana! Ciljaj 30!`,
    );
  } else if (data.currentStreak >= 30) {
    recommendations.push(
      `🔥 Neverovatnih ${data.currentStreak} dana! Ti si legenda!`,
    );
  }

  // XP trend
  const xpChange = data.weeklyXP - data.previousWeekXP;
  if (xpChange > 0) {
    recommendations.push(`📈 XP povećan za ${xpChange}! Nastavi tako!`);
  } else if (xpChange < 0) {
    recommendations.push("📉 Pokušaj da budeš aktivniji ove nedelje!");
  }

  if (recommendations.length === 0) {
    recommendations.push("🎉 Nastavi sa odličnim radom!");
  }

  return recommendations;
}

import { executeBatch } from "@/lib/db/prisma";

/**
 * Generate weekly reports for all active students
 */
export async function generateAllWeeklyReports(): Promise<
  Array<{
    studentId: string;
    report: WeeklyReportData;
  }>
> {
  try {
    log.info("Generating weekly reports for all students");

    const students = await prisma.student.findMany({
      where: { accountActive: true },
      select: { id: true },
    });

    // Use executeBatch to process in chunks and prevent DB overload
    const reports = await executeBatch(
      students.map(async (student) => {
        try {
          const report = await generateWeeklyReport(student.id);
          return { studentId: student.id, report };
        } catch (error) {
          log.error("Failed to generate report", error, {
            studentId: student.id,
          });
          return null;
        }
      }),
      10, // Process 10 students at a time
    );

    const successful = reports.filter((r) => r !== null) as Array<{
      studentId: string;
      report: WeeklyReportData;
    }>;

    log.info("Generated weekly reports", {
      total: students.length,
      successful: successful.length,
    });

    return successful;
  } catch (error) {
    log.error("Failed to generate all weekly reports", error);
    throw error;
  }
}
