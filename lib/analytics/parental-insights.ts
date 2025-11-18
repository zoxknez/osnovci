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
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const daysBetween = differenceInDays(endDate, startDate);
  const uniqueDays = new Set(
    activityLogs.map((log: { createdAt: Date }) => log.createdAt.toISOString().split('T')[0])
  ).size;

  const loginFrequencyScore = daysBetween > 0 ? (uniqueDays / daysBetween) * 25 : 0;

  // Time spent (0-25 points) - based on activity frequency
  const totalActivities = await prisma.activityLog.count({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  // Estimate: assume each activity = ~5 minutes
  const estimatedMinutes = totalActivities * 5;
  const avgMinutesPerDay = daysBetween > 0 ? estimatedMinutes / daysBetween : 0;

  const timeSpentScore = Math.min((avgMinutesPerDay / 30) * 25, 25);

  // Grade consistency (0-20 points) - less variance is better
  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { grade: true },
  });

  let gradeConsistencyScore = 0;
  if (grades.length >= 3) {
    // Convert string grades to numbers (1-5 scale)
    const values = grades
      .map((g) => parseInt(g.grade, 10))
      .filter((v) => !isNaN(v));
    
    if (values.length >= 3) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Lower standard deviation = higher consistency
      gradeConsistencyScore = Math.max(20 - (stdDev * 5), 0);
    }
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
  const recentGradesRaw = await prisma.grade.findMany({
    where: {
      studentId,
      createdAt: { gte: oneWeekAgo, lte: now },
    },
    select: { grade: true },
  });

  const previousGradesRaw = await prisma.grade.findMany({
    where: {
      studentId,
      createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
    },
    select: { grade: true },
  });

  // Calculate averages manually
  const recentValues = recentGradesRaw.map((g) => parseInt(g.grade, 10)).filter((v) => !isNaN(v));
  const previousValues = previousGradesRaw.map((g) => parseInt(g.grade, 10)).filter((v) => !isNaN(v));

  if (recentValues.length > 0 && previousValues.length > 0) {
    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length;
    const drop = previousAvg - recentAvg;
    
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
  const activityCount = await prisma.activityLog.count({
    where: {
      studentId,
      createdAt: { gte: oneWeekAgo, lte: now },
    },
  });

  // Estimate: ~5 min per activity
  const avgDailyMinutes = (activityCount * 5) / 7;
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
  // Group by activity type and count occurrences
  const activities = await prisma.activityLog.groupBy({
    by: ["type"],
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  // Estimate minutes: each activity ~5 min
  const totalCount = activities.reduce((sum, a) => sum + a._count.id, 0);
  const totalMinutes = totalCount * 5;

  const byActivity = activities.map((a) => ({
    action: a.type,
    minutes: a._count.id * 5,
    percentage: totalCount > 0 ? (a._count.id / totalCount) * 100 : 0,
  }));

  // Time of day breakdown
  const logs = await prisma.activityLog.findMany({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      createdAt: true,
    },
  });

  const hourMap = new Map<number, number>();
  logs.forEach((log) => {
    const hour = log.createdAt.getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 5); // ~5 min per activity
  });

  const byTimeOfDay = Array.from(hourMap.entries())
    .map(([hour, minutes]) => ({ hour, minutes }))
    .sort((a, b) => a.hour - b.hour);

  return {
    totalMinutes,
    byActivity,
    byTimeOfDay,
    longestSession: null, // TODO: Calculate from consecutive activity timestamps
  };
}/**
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
      // Estimate time: ~15 min per homework
      const homeworkMinutes = subject.homework.length * 15;

      // Determine attention level based on homework frequency
      let attentionLevel: "low" | "medium" | "high";
      if (subject.homework.length >= 5) {
        attentionLevel = "high";
      } else if (subject.homework.length >= 2) {
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
