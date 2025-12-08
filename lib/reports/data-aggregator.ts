/**
 * Data Aggregator for Reports
 * Prikuplja i agregira podatke studenta za generisanje izveštaja
 */

import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export interface AggregatedStudentData {
  student: {
    id: string;
    name: string;
    grade: string | null;
    school: string | null;
  };
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  grades: {
    all: Array<{
      subject: string;
      grade: string;
      date: Date;
      type: string | null;
    }>;
    bySubject: Array<{
      subject: string;
      grades: string[];
      average: number;
      count: number;
    }>;
    overallAverage: number;
    totalCount: number;
  };
  homework: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    bySubject: Array<{
      subject: string;
      total: number;
      completed: number;
      rate: number;
    }>;
  };
  gamification: {
    level: number;
    xp: number;
    totalXPEarned: number;
    streak: number;
    longestStreak: number;
    achievementsUnlocked: number;
    rank?: number;
  };
  activity: {
    activeDays: number;
    totalSessions: number;
    mostActiveDay: string | null;
    averageSessionMinutes: number;
  };
  achievements: Array<{
    title: string;
    description: string;
    unlockedAt: Date;
    rarity: string;
  }>;
}

/**
 * Aggregate all student data for report generation
 */
export async function aggregateStudentData(
  studentId: string,
  startDate: Date,
  endDate: Date,
  reportType: "weekly" | "monthly" | "semester" | "annual",
): Promise<AggregatedStudentData | null> {
  try {
    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        grade: true,
        school: true,
      },
    });

    if (!student) {
      log.error("Student not found for report", { studentId });
      return null;
    }

    // Get grades in period
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subject: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate grades by subject
    const gradesBySubject = new Map<
      string,
      { grades: string[]; sum: number }
    >();
    for (const grade of grades) {
      const subjectName = grade.subject.name;
      const existing = gradesBySubject.get(subjectName) || {
        grades: [],
        sum: 0,
      };
      existing.grades.push(grade.grade);
      existing.sum += parseFloat(grade.grade);
      gradesBySubject.set(subjectName, existing);
    }

    const gradesBySubjectArray = Array.from(gradesBySubject.entries()).map(
      ([subject, data]) => ({
        subject,
        grades: data.grades,
        average: data.grades.length > 0 ? data.sum / data.grades.length : 0,
        count: data.grades.length,
      }),
    );

    const overallAverage =
      grades.length > 0
        ? grades.reduce((sum, g) => sum + parseFloat(g.grade), 0) /
          grades.length
        : 0;

    // Get homework stats
    const homework = await prisma.homework.findMany({
      where: {
        studentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subject: {
          select: { name: true },
        },
      },
    });

    const now = new Date();
    const completedHomework = homework.filter(
      (h) => h.status === "DONE" || h.status === "SUBMITTED",
    );
    const pendingHomework = homework.filter(
      (h) =>
        h.status !== "DONE" && h.status !== "SUBMITTED" && h.dueDate >= now,
    );
    const overdueHomework = homework.filter(
      (h) => h.status !== "DONE" && h.status !== "SUBMITTED" && h.dueDate < now,
    );

    // Homework by subject
    const homeworkBySubject = new Map<
      string,
      { total: number; completed: number }
    >();
    for (const hw of homework) {
      const subjectName = hw.subject.name;
      const existing = homeworkBySubject.get(subjectName) || {
        total: 0,
        completed: 0,
      };
      existing.total++;
      if (hw.status === "DONE" || hw.status === "SUBMITTED") {
        existing.completed++;
      }
      homeworkBySubject.set(subjectName, existing);
    }

    const homeworkBySubjectArray = Array.from(homeworkBySubject.entries()).map(
      ([subject, data]) => ({
        subject,
        total: data.total,
        completed: data.completed,
        rate:
          data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }),
    );

    // Get gamification data
    const gamification = await prisma.gamification.findUnique({
      where: { studentId },
      include: {
        achievements: {
          where: {
            unlockedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { unlockedAt: "desc" },
        },
      },
    });

    // Calculate rank (position among all students)
    let rank: number | undefined;
    if (gamification) {
      const higherRanked = await prisma.gamification.count({
        where: {
          totalXPEarned: { gt: gamification.totalXPEarned },
          showOnLeaderboard: true,
        },
      });
      rank = higherRanked + 1;
    }

    // Get activity data
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        studentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Calculate active days
    const activeDays = new Set(
      activityLogs.map((log) => log.createdAt.toISOString().split("T")[0]),
    ).size;

    // Calculate most active day of week
    const dayOfWeekCounts = new Map<number, number>();
    for (const log of activityLogs) {
      const day = log.createdAt.getDay();
      dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1);
    }

    let mostActiveDay: string | null = null;
    let maxCount = 0;
    const dayNames = [
      "Nedelja",
      "Ponedeljak",
      "Utorak",
      "Sreda",
      "Četvrtak",
      "Petak",
      "Subota",
    ];
    for (const [day, count] of dayOfWeekCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = dayNames[day] ?? null;
      }
    }

    // Build period label
    const periodLabel = buildPeriodLabel(startDate, endDate, reportType);

    return {
      student: {
        id: student.id,
        name: student.name,
        grade: String(student.grade),
        school: student.school,
      },
      period: {
        startDate,
        endDate,
        label: periodLabel,
      },
      grades: {
        all: grades.map((g) => ({
          subject: g.subject.name,
          grade: g.grade,
          date: g.createdAt,
          type: g.category,
        })),
        bySubject: gradesBySubjectArray,
        overallAverage: Math.round(overallAverage * 100) / 100,
        totalCount: grades.length,
      },
      homework: {
        total: homework.length,
        completed: completedHomework.length,
        pending: pendingHomework.length,
        overdue: overdueHomework.length,
        completionRate:
          homework.length > 0
            ? Math.round((completedHomework.length / homework.length) * 100)
            : 0,
        bySubject: homeworkBySubjectArray,
      },
      gamification: {
        level: gamification?.level || 1,
        xp: gamification?.xp || 0,
        totalXPEarned: gamification?.totalXPEarned || 0,
        streak: gamification?.streak || 0,
        longestStreak: gamification?.longestStreak || 0,
        achievementsUnlocked: gamification?.achievements.length || 0,
        ...(rank !== undefined && { rank }),
      },
      activity: {
        activeDays,
        totalSessions: activityLogs.length,
        mostActiveDay,
        averageSessionMinutes: 0, // Would need session duration tracking
      },
      achievements:
        gamification?.achievements.map((a) => ({
          title: a.title,
          description: a.description || "",
          unlockedAt: a.unlockedAt,
          rarity: a.rarity,
        })) || [],
    };
  } catch (error) {
    log.error("Error aggregating student data", { error, studentId });
    return null;
  }
}

/**
 * Build human-readable period label
 */
function buildPeriodLabel(
  startDate: Date,
  endDate: Date,
  reportType: "weekly" | "monthly" | "semester" | "annual",
): string {
  const months = [
    "januar",
    "februar",
    "mart",
    "april",
    "maj",
    "jun",
    "jul",
    "avgust",
    "septembar",
    "oktobar",
    "novembar",
    "decembar",
  ];

  switch (reportType) {
    case "weekly":
      return `${startDate.getDate()}. - ${endDate.getDate()}. ${months[endDate.getMonth()]} ${endDate.getFullYear()}.`;
    case "monthly":
      return `${months[startDate.getMonth()]} ${startDate.getFullYear()}.`;
    case "semester": {
      const semesterNum = startDate.getMonth() < 6 ? "Drugo" : "Prvo";
      return `${semesterNum} polugodište ${startDate.getFullYear()}/${startDate.getFullYear() + 1}.`;
    }
    case "annual":
      return `Školska godina ${startDate.getFullYear()}/${startDate.getFullYear() + 1}.`;
    default:
      return `${startDate.toLocaleDateString("sr-Latn-RS")} - ${endDate.toLocaleDateString("sr-Latn-RS")}`;
  }
}

/**
 * Get date range for report type
 */
export function getReportDateRange(
  reportType: "weekly" | "monthly" | "semester" | "annual",
  referenceDate?: Date,
): { startDate: Date; endDate: Date } {
  const now = referenceDate || new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (reportType) {
    case "weekly":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "semester":
      // First semester: Sep 1 - Jan 31, Second: Feb 1 - Jun 30
      if (now.getMonth() >= 8 || now.getMonth() === 0) {
        // First semester
        startDate = new Date(
          now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1,
          8,
          1,
        );
        endDate = new Date(
          now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear(),
          0,
          31,
        );
      } else {
        // Second semester
        startDate = new Date(now.getFullYear(), 1, 1);
        endDate = new Date(now.getFullYear(), 5, 30);
      }
      break;
    case "annual":
      // School year: Sep 1 - Jun 30
      if (now.getMonth() >= 8) {
        startDate = new Date(now.getFullYear(), 8, 1);
        endDate = new Date(now.getFullYear() + 1, 5, 30);
      } else {
        startDate = new Date(now.getFullYear() - 1, 8, 1);
        endDate = new Date(now.getFullYear(), 5, 30);
      }
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, endDate };
}
