/**
 * ENHANCED PARENTAL INSIGHTS - ADVANCED ANALYTICS
 * Weekly digest emails, behavioral alerts, engagement scoring
 */

import { prisma } from "@/lib/db/prisma";
import { startOfWeek, endOfWeek, subWeeks, differenceInDays } from "date-fns";

/**
 * Calculate Student Engagement Score (0-100)
 * Factors: homework completion, login frequency, time spent, grade consistency
 */
export async function calculateEngagementScore(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  score: number;
  level: "low" | "medium" | "high";
  factors: {
    homeworkCompletion: number;
    loginFrequency: number;
    timeSpent: number;
    gradeConsistency: number;
  };
}> {
  // Homework completion rate (0-30 points)
  const homework = await prisma.homework.aggregate({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  const completedHomework = await prisma.homework.count({
    where: {
      studentId,
      status: "SUBMITTED",
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const homeworkCompletionScore = homework._count.id > 0 
    ? (completedHomework / homework._count.id) * 30 
    : 0;

  // Login frequency (0-25 points) - daily logins are best
  const activityLogs = await prisma.activityLog.groupBy({
    by: ["createdAt"],
    where: {
      studentId,
      action: "LOGIN",
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const daysBetween = differenceInDays(endDate, startDate);
  const uniqueDays = new Set(
    activityLogs.map((log: { createdAt: Date }) => log.createdAt.toISOString().split('T')[0])
  ).size;

  const loginFrequencyScore = daysBetween > 0 ? (uniqueDays / daysBetween) * 25 : 0;

  // Time spent (0-25 points) - 30+ min/day is optimal
  const totalMinutes = await prisma.activityLog.aggregate({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { duration: true },
  });

  const avgMinutesPerDay = totalMinutes._sum.duration 
    ? totalMinutes._sum.duration / daysBetween 
    : 0;

  const timeSpentScore = Math.min((avgMinutesPerDay / 30) * 25, 25);

  // Grade consistency (0-20 points) - less variance is better
  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { value: true },
  });

  let gradeConsistencyScore = 0;
  if (grades.length >= 3) {
    const values = grades.map((g: { value: number }) => g.value);
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    gradeConsistencyScore = Math.max(20 - (stdDev * 5), 0);
  }

  const totalScore = Math.round(
    homeworkCompletionScore + loginFrequencyScore + timeSpentScore + gradeConsistencyScore
  );

  const level: "low" | "medium" | "high" = 
    totalScore >= 75 ? "high" :
    totalScore >= 50 ? "medium" : "low";

  return {
    score: totalScore,
    level,
    factors: {
      homeworkCompletion: Math.round(homeworkCompletionScore),
      loginFrequency: Math.round(loginFrequencyScore),
      timeSpent: Math.round(timeSpentScore),
      gradeConsistency: Math.round(gradeConsistencyScore),
    },
  };
}

/**
 * Behavioral Alert Detection
 * Triggers: missed deadlines, grade drops, attendance issues
 */
export async function detectBehavioralAlerts(
  studentId: string
): Promise<Array<{
  type: "missing_deadlines" | "grade_drop" | "low_engagement" | "excessive_time";
  severity: "info" | "warning" | "critical";
  message: string;
  actionable: string;
}>> {
  const alerts: Array<{
    type: "missing_deadlines" | "grade_drop" | "low_engagement" | "excessive_time";
    severity: "info" | "warning" | "critical";
    message: string;
    actionable: string;
  }> = [];

  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const twoWeeksAgo = subWeeks(now, 2);

  // Check for missed deadlines (past 7 days)
  const overdueHomework = await prisma.homework.count({
    where: {
      studentId,
      dueDate: { lt: now, gte: oneWeekAgo },
      status: { not: "SUBMITTED" },
    },
  });

  if (overdueHomework >= 3) {
    alerts.push({
      type: "missing_deadlines",
      severity: "critical",
      message: `${overdueHomework} zadataka prekoračeno u poslednjoj nedelji`,
      actionable: "Kontaktirajte dete i napravite plan za nadoknadu",
    });
  } else if (overdueHomework >= 1) {
    alerts.push({
      type: "missing_deadlines",
      severity: "warning",
      message: `${overdueHomework} zadatak prekoračen`,
      actionable: "Podsetite dete na rok",
    });
  }

  // Check for grade drops (compare last 2 weeks)
  const recentGrades = await prisma.grade.aggregate({
    where: {
      studentId,
      createdAt: { gte: oneWeekAgo, lte: now },
    },
    _avg: { value: true },
  });

  const previousGrades = await prisma.grade.aggregate({
    where: {
      studentId,
      createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
    },
    _avg: { value: true },
  });

  if (recentGrades._avg.value && previousGrades._avg.value) {
    const drop = previousGrades._avg.value - recentGrades._avg.value;
    if (drop >= 1) {
      alerts.push({
        type: "grade_drop",
        severity: drop >= 1.5 ? "critical" : "warning",
        message: `Prosek ocena opao za ${drop.toFixed(1)} u poslednjoj nedelji`,
        actionable: "Razgovarajte sa detetom o poteškoćama u učenju",
      });
    }
  }

  // Check for low engagement
  const engagement = await calculateEngagementScore(studentId, oneWeekAgo, now);
  if (engagement.level === "low") {
    alerts.push({
      type: "low_engagement",
      severity: engagement.score < 30 ? "critical" : "warning",
      message: `Nizak nivo angažovanja (${engagement.score}/100)`,
      actionable: "Motovišite dete da aktivnije koristi platformu",
    });
  }

  // Check for excessive time (burnout risk)
  const totalTime = await prisma.activityLog.aggregate({
    where: {
      studentId,
      createdAt: { gte: oneWeekAgo, lte: now },
    },
    _sum: { duration: true },
  });

  const avgDailyMinutes = totalTime._sum.duration ? totalTime._sum.duration / 7 : 0;
  if (avgDailyMinutes > 120) {
    alerts.push({
      type: "excessive_time",
      severity: "info",
      message: `Dete provodi ${Math.round(avgDailyMinutes)} min/dan (možda predugo)`,
      actionable: "Proverite da li postoji balans sa drugim aktivnostima",
    });
  }

  return alerts;
}

/**
 * Time-on-Device Analytics
 * Detailed breakdown of time spent per activity type
 */
export async function getTimeOnDeviceAnalytics(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalMinutes: number;
  byActivity: Array<{
    action: string;
    minutes: number;
    percentage: number;
  }>;
  byTimeOfDay: Array<{
    hour: number;
    minutes: number;
  }>;
  longestSession: {
    date: Date;
    minutes: number;
  } | null;
}> {
  const activities = await prisma.activityLog.groupBy({
    by: ["action"],
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { duration: true },
  });

  const totalMinutes = activities.reduce((sum: number, a: { _sum: { duration: number | null } }) => sum + (a._sum.duration || 0), 0);

  const byActivity = activities.map((a: { action: string; _sum: { duration: number | null } }) => ({
    action: a.action,
    minutes: a._sum.duration || 0,
    percentage: totalMinutes > 0 ? ((a._sum.duration || 0) / totalMinutes) * 100 : 0,
  }));

  // Time of day breakdown
  const logs = await prisma.activityLog.findMany({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      createdAt: true,
      duration: true,
    },
  });

  const hourMap = new Map<number, number>();
  logs.forEach((log: { createdAt: Date; duration: number | null }) => {
    const hour = log.createdAt.getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + (log.duration || 0));
  });

  const byTimeOfDay = Array.from(hourMap.entries())
    .map(([hour, minutes]) => ({ hour, minutes }))
    .sort((a, b) => a.hour - b.hour);

  // Longest session
  const longestLog = await prisma.activityLog.findFirst({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { duration: "desc" },
    select: {
      createdAt: true,
      duration: true,
    },
  });

  return {
    totalMinutes,
    byActivity,
    byTimeOfDay,
    longestSession: longestLog 
      ? { date: longestLog.createdAt, minutes: longestLog.duration || 0 }
      : null,
  };
}

/**
 * Subject Focus Report
 * Which subjects are getting most/least attention
 */
export async function getSubjectFocusReport(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{
  subjectId: string;
  subjectName: string;
  homeworkCount: number;
  homeworkMinutes: number;
  gradeCount: number;
  attentionLevel: "low" | "medium" | "high";
}>> {
  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { homework: { some: { studentId } } },
        { grades: { some: { studentId } } },
      ],
    },
    include: {
      homework: {
        where: {
          studentId,
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      grades: {
        where: {
          studentId,
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    },
  });

  // Calculate attention metrics
  const subjectData = await Promise.all(
    subjects.map(async (subject: {
      id: string;
      name: string;
      homework: Array<{ id: string }>;
      grades: Array<{ id: string }>;
    }) => {
      // Estimate time from activity logs (rough approximation)
      const homeworkLogs = await prisma.activityLog.aggregate({
        where: {
          studentId,
          action: "HOMEWORK_WORK",
          metadata: {
            path: ["subjectId"],
            equals: subject.id,
          },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { duration: true },
      });

      const homeworkMinutes = homeworkLogs._sum.duration || 0;

      // Determine attention level based on homework frequency
      let attentionLevel: "low" | "medium" | "high";
      if (subject.homework.length >= 5 || homeworkMinutes >= 180) {
        attentionLevel = "high";
      } else if (subject.homework.length >= 2 || homeworkMinutes >= 60) {
        attentionLevel = "medium";
      } else {
        attentionLevel = "low";
      }

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        homeworkCount: subject.homework.length,
        homeworkMinutes,
        gradeCount: subject.grades.length,
        attentionLevel,
      };
    })
  );

  return subjectData.sort((a, b) => b.homeworkMinutes - a.homeworkMinutes);
}

/**
 * Homework Completion Rate Trend
 * Shows if student is improving or declining over time
 */
export async function getHomeworkCompletionTrend(
  studentId: string,
  weeks: number = 4
): Promise<{
  weeklyRates: Array<{
    weekStart: Date;
    weekEnd: Date;
    total: number;
    completed: number;
    rate: number;
  }>;
  trend: "improving" | "declining" | "stable";
  trendValue: number;
}> {
  const now = new Date();
  const weeklyData: Array<{
    weekStart: Date;
    weekEnd: Date;
    total: number;
    completed: number;
    rate: number;
  }> = [];

  for (let i = 0; i < weeks; i++) {
    const weekEnd = subWeeks(now, i);
    const weekStart = startOfWeek(weekEnd, { weekStartsOn: 1 });
    const actualWeekEnd = endOfWeek(weekEnd, { weekStartsOn: 1 });

    const total = await prisma.homework.count({
      where: {
        studentId,
        createdAt: { gte: weekStart, lte: actualWeekEnd },
      },
    });

    const completed = await prisma.homework.count({
      where: {
        studentId,
        status: "SUBMITTED",
        createdAt: { gte: weekStart, lte: actualWeekEnd },
      },
    });

    const rate = total > 0 ? (completed / total) * 100 : 0;

    weeklyData.push({
      weekStart,
      weekEnd: actualWeekEnd,
      total,
      completed,
      rate,
    });
  }

  // Calculate trend (linear regression on rates)
  const rates = weeklyData.map(w => w.rate);
  if (rates.length < 2) {
    return {
      weeklyRates: weeklyData.reverse(),
      trend: "stable",
      trendValue: 0,
    };
  }

  const firstHalf = rates.slice(0, Math.ceil(rates.length / 2));
  const secondHalf = rates.slice(Math.ceil(rates.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const trendValue = secondAvg - firstAvg;
  const trend: "improving" | "declining" | "stable" = 
    trendValue > 5 ? "improving" :
    trendValue < -5 ? "declining" : "stable";

  return {
    weeklyRates: weeklyData.reverse(),
    trend,
    trendValue: Math.round(trendValue),
  };
}
