"use server";

import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

export async function getParentalAnalyticsAction(
  studentId: string,
  period: "week" | "month" | "custom" = "week",
  customStart?: string,
  customEnd?: string,
): Promise<ActionResponse> {
  const session = await auth();

  try {
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Verify guardian has access to this student
    const guardian = await prisma.guardian.findUnique({
      where: { userId: session.user.id },
      include: {
        links: {
          where: {
            studentId,
            isActive: true,
          },
        },
      },
    });

    if (!guardian || guardian.links.length === 0) {
      return { error: "Access denied" };
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "custom":
        if (!customStart || !customEnd) {
          return { error: "Custom period requires startDate and endDate" };
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    }

    // Fetch all analytics data in parallel
    const [
      homeworkStats,
      gradeStats,
      timeSpentData,
      subjectPerformance,
      weeklyComparison,
      achievementProgress,
    ] = await Promise.all([
      getHomeworkStatistics(studentId, startDate, endDate),
      getGradeStatistics(studentId, startDate, endDate),
      getTimeSpentAnalytics(studentId, startDate, endDate),
      getSubjectPerformance(studentId, startDate, endDate),
      getWeeklyComparison(studentId),
      getAchievementProgress(studentId),
    ]);

    const analytics = {
      period: {
        type: period,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      },
      homework: homeworkStats,
      grades: gradeStats,
      timeSpent: timeSpentData,
      subjectPerformance,
      weeklyComparison,
      achievements: achievementProgress,
      generatedAt: new Date().toISOString(),
    };

    log.info("Parental analytics generated", {
      guardianId: guardian.id,
      studentId,
      period,
    });

    return { data: analytics };
  } catch (error) {
    log.error("Error fetching parental analytics", error, {
      userId: session?.user?.id,
    });
    return { error: "Failed to fetch analytics" };
  }
}

/**
 * Homework completion statistics
 */
async function getHomeworkStatistics(
  studentId: string,
  startDate: Date,
  endDate: Date,
) {
  const homework = await prisma.homework.findMany({
    where: {
      studentId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      subject: true,
      attachments: true,
    },
  });

  const total = homework.length;
  const completed = homework.filter(
    (h) => h.status === "DONE" || h.status === "REVIEWED",
  ).length;
  const pending = homework.filter(
    (h) => h.status === "ASSIGNED" || h.status === "IN_PROGRESS",
  ).length;
  const overdue = homework.filter(
    (h) =>
      h.status !== "DONE" &&
      h.status !== "REVIEWED" &&
      new Date(h.dueDate) < new Date(),
  ).length;

  // Completion rate by day
  const dailyCompletion: {
    [key: string]: { completed: number; assigned: number };
  } = {};
  homework.forEach((h) => {
    const day = format(new Date(h.createdAt), "yyyy-MM-dd");
    if (!dailyCompletion[day]) {
      dailyCompletion[day] = { completed: 0, assigned: 0 };
    }
    dailyCompletion[day].assigned++;
    if (h.status === "DONE" || h.status === "REVIEWED") {
      dailyCompletion[day].completed++;
    }
  });

  // Average completion time (not available without completedAt field)
  const avgCompletionTime = 0;

  return {
    total,
    completed,
    pending,
    overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    dailyCompletion: Object.entries(dailyCompletion).map(([date, data]) => ({
      date,
      ...data,
      rate:
        data.assigned > 0
          ? Math.round((data.completed / data.assigned) * 100)
          : 0,
    })),
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10, // Round to 1 decimal
    withAttachments: homework.filter((h) => h.attachments.length > 0).length,
  };
}

/**
 * Grade statistics and trends
 */
async function getGradeStatistics(
  studentId: string,
  startDate: Date,
  endDate: Date,
) {
  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      subject: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  if (grades.length === 0) {
    return {
      count: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      trend: "stable",
      bySubject: [],
      byType: [],
      timeline: [],
    };
  }

  const gradeNumbers = grades.map((g) => parseFloat(g.grade) || 0);
  const average =
    gradeNumbers.reduce((sum, n) => sum + n, 0) / gradeNumbers.length;
  const highest = Math.max(...gradeNumbers);
  const lowest = Math.min(...gradeNumbers);

  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(gradeNumbers.length / 2);
  const firstHalfAvg =
    gradeNumbers.slice(0, midpoint).reduce((sum, n) => sum + n, 0) / midpoint;
  const secondHalfAvg =
    gradeNumbers.slice(midpoint).reduce((sum, n) => sum + n, 0) /
    (gradeNumbers.length - midpoint);
  const trend =
    secondHalfAvg > firstHalfAvg + 0.5
      ? "improving"
      : secondHalfAvg < firstHalfAvg - 0.5
        ? "declining"
        : "stable";

  // Group by subject
  const bySubject: {
    [key: string]: { count: number; sum: number; name: string };
  } = {};
  grades.forEach((g) => {
    if (!bySubject[g.subjectId]) {
      bySubject[g.subjectId] = { count: 0, sum: 0, name: g.subject.name };
    }
    const subj = bySubject[g.subjectId];
    if (subj) {
      subj.count++;
      subj.sum += parseFloat(g.grade) || 0;
    }
  });

  // Group by category
  const byCategory: { [key: string]: { count: number; sum: number } } = {};
  grades.forEach((g) => {
    if (!byCategory[g.category]) {
      byCategory[g.category] = { count: 0, sum: 0 };
    }
    const cat = byCategory[g.category];
    if (cat) {
      cat.count++;
      cat.sum += parseFloat(g.grade) || 0;
    }
  });

  return {
    count: grades.length,
    average: Math.round(average * 100) / 100,
    highest,
    lowest,
    trend,
    bySubject: Object.entries(bySubject).map(([id, data]) => ({
      subjectId: id,
      subjectName: data.name,
      count: data.count,
      average: Math.round((data.sum / data.count) * 100) / 100,
    })),
    byType: Object.entries(byCategory).map(([type, data]) => ({
      type,
      count: data.count,
      average: Math.round((data.sum / data.count) * 100) / 100,
    })),
    timeline: grades.map((g) => ({
      date: format(new Date(g.date), "yyyy-MM-dd"),
      grade: parseFloat(g.grade) || 0,
      subject: g.subject.name,
      type: g.category,
    })),
  };
}

/**
 * Time spent analytics (from activity logs)
 */
async function getTimeSpentAnalytics(
  studentId: string,
  startDate: Date,
  endDate: Date,
) {
  const activities = await prisma.activityLog.findMany({
    where: {
      studentId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      type: {
        in: ["HOMEWORK_CREATED", "HOMEWORK_UPDATED", "PROFILE_UPDATED"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Estimate time spent by grouping activities within 30-minute sessions
  const sessions: { start: Date; end: Date; actions: number }[] = [];
  let currentSession: { start: Date; end: Date; actions: number } | null = null;

  activities.forEach((activity) => {
    const timestamp = new Date(activity.createdAt);
    if (!currentSession) {
      currentSession = { start: timestamp, end: timestamp, actions: 1 };
    } else {
      const timeDiff =
        (timestamp.getTime() - currentSession.end.getTime()) / (1000 * 60); // minutes
      if (timeDiff <= 30) {
        currentSession.end = timestamp;
        currentSession.actions++;
      } else {
        sessions.push(currentSession!);
        currentSession = { start: timestamp, end: timestamp, actions: 1 };
      }
    }
  });
  if (currentSession) sessions.push(currentSession);

  const totalMinutes = sessions.reduce((sum, s) => {
    const duration = (s.end.getTime() - s.start.getTime()) / (1000 * 60);
    return sum + duration;
  }, 0);

  // Daily breakdown
  const dailyTime: { [key: string]: number } = {};
  sessions.forEach((s) => {
    const day = format(s.start, "yyyy-MM-dd");
    const duration = (s.end.getTime() - s.start.getTime()) / (1000 * 60);
    dailyTime[day] = (dailyTime[day] || 0) + duration;
  });

  return {
    totalMinutes: Math.round(totalMinutes),
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    sessions: sessions.length,
    avgSessionMinutes:
      sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
    dailyBreakdown: Object.entries(dailyTime).map(([date, minutes]) => ({
      date,
      minutes: Math.round(minutes),
      hours: Math.round((minutes / 60) * 10) / 10,
    })),
  };
}

/**
 * Subject performance comparison
 */
async function getSubjectPerformance(
  studentId: string,
  startDate: Date,
  endDate: Date,
) {
  const [grades, homework] = await Promise.all([
    prisma.grade.findMany({
      where: {
        studentId,
        date: { gte: startDate, lte: endDate },
      },
      include: { subject: true },
    }),
    prisma.homework.findMany({
      where: {
        studentId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { subject: true },
    }),
  ]);

  const subjects: {
    [key: string]: {
      name: string;
      gradeCount: number;
      gradeSum: number;
      homeworkTotal: number;
      homeworkCompleted: number;
    };
  } = {};

  grades.forEach((g) => {
    if (!subjects[g.subjectId]) {
      subjects[g.subjectId] = {
        name: g.subject.name,
        gradeCount: 0,
        gradeSum: 0,
        homeworkTotal: 0,
        homeworkCompleted: 0,
      };
    }
    const subj = subjects[g.subjectId];
    if (subj) {
      subj.gradeCount++;
      subj.gradeSum += parseFloat(g.grade) || 0;
    }
  });

  homework.forEach((h) => {
    if (!subjects[h.subjectId]) {
      subjects[h.subjectId] = {
        name: h.subject.name,
        gradeCount: 0,
        gradeSum: 0,
        homeworkTotal: 0,
        homeworkCompleted: 0,
      };
    }
    const subj = subjects[h.subjectId];
    if (subj) {
      subj.homeworkTotal++;
      if (h.status === "DONE" || h.status === "REVIEWED") {
        subj.homeworkCompleted++;
      }
    }
  });

  return Object.entries(subjects).map(([id, data]) => ({
    subjectId: id,
    subjectName: data.name,
    gradeAverage:
      data.gradeCount > 0
        ? Math.round((data.gradeSum / data.gradeCount) * 100) / 100
        : null,
    gradeCount: data.gradeCount,
    homeworkCompletionRate:
      data.homeworkTotal > 0
        ? Math.round((data.homeworkCompleted / data.homeworkTotal) * 100)
        : null,
    homeworkTotal: data.homeworkTotal,
  }));
}

/**
 * Weekly comparison (current vs previous week)
 */
async function getWeeklyComparison(studentId: string) {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
  const previousWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });

  const [
    currentWeekHomework,
    previousWeekHomework,
    currentWeekGrades,
    previousWeekGrades,
  ] = await Promise.all([
    prisma.homework.findMany({
      where: {
        studentId,
        createdAt: { gte: currentWeekStart, lte: currentWeekEnd },
      },
    }),
    prisma.homework.findMany({
      where: {
        studentId,
        createdAt: { gte: previousWeekStart, lte: previousWeekEnd },
      },
    }),
    prisma.grade.findMany({
      where: {
        studentId,
        date: { gte: currentWeekStart, lte: currentWeekEnd },
      },
    }),
    prisma.grade.findMany({
      where: {
        studentId,
        date: { gte: previousWeekStart, lte: previousWeekEnd },
      },
    }),
  ]);

  const currentCompleted = currentWeekHomework.filter(
    (h) => h.status === "DONE" || h.status === "REVIEWED",
  ).length;
  const previousCompleted = previousWeekHomework.filter(
    (h) => h.status === "DONE" || h.status === "REVIEWED",
  ).length;

  const currentGradeAvg =
    currentWeekGrades.length > 0
      ? currentWeekGrades.reduce(
          (sum, g) => sum + (parseFloat(g.grade) || 0),
          0,
        ) / currentWeekGrades.length
      : 0;
  const previousGradeAvg =
    previousWeekGrades.length > 0
      ? previousWeekGrades.reduce(
          (sum, g) => sum + (parseFloat(g.grade) || 0),
          0,
        ) / previousWeekGrades.length
      : 0;

  return {
    currentWeek: {
      homeworkTotal: currentWeekHomework.length,
      homeworkCompleted: currentCompleted,
      gradeAverage: Math.round(currentGradeAvg * 100) / 100,
      gradeCount: currentWeekGrades.length,
    },
    previousWeek: {
      homeworkTotal: previousWeekHomework.length,
      homeworkCompleted: previousCompleted,
      gradeAverage: Math.round(previousGradeAvg * 100) / 100,
      gradeCount: previousWeekGrades.length,
    },
    changes: {
      homework: currentCompleted - previousCompleted,
      grade: Math.round((currentGradeAvg - previousGradeAvg) * 100) / 100,
    },
  };
}

/**
 * Achievement progress
 */
async function getAchievementProgress(studentId: string) {
  // Get gamification for student
  const gamification = await prisma.gamification.findUnique({
    where: { studentId },
    include: {
      achievements: {
        orderBy: { unlockedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!gamification) {
    return { total: 0, totalPoints: 0, recent: [] };
  }

  const totalPoints = gamification.achievements.reduce(
    (sum, a) => sum + a.xpReward,
    0,
  );

  return {
    total: gamification.achievements.length,
    totalPoints,
    recent: gamification.achievements.map((a) => ({
      id: a.id,
      name: a.title,
      description: a.description || "",
      points: a.xpReward,
      unlockedAt: a.unlockedAt?.toISOString() || new Date().toISOString(),
    })),
  };
}
