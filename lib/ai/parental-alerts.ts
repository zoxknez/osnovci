/**
 * Smart Parental Alerts
 * Automatska upozorenja za roditelje o potencijalnim problemima
 */

import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

interface Alert {
  id: string;
  type:
    | "grade_drop"
    | "homework_backlog"
    | "study_time"
    | "behavior_change"
    | "achievement";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details: Record<string, any>;
  recommendations: string[];
  timestamp: Date;
  studentId: string;
}

/**
 * Check for grade drops
 */
async function checkGradeDrop(studentId: string): Promise<boolean> {
  // Get grades from last 30 days and previous 30 days
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentGrades = await prisma.grade.findMany({
    where: {
      studentId,
      date: { gte: last30Days },
    },
  });

  const previousGrades = await prisma.grade.findMany({
    where: {
      studentId,
      date: { gte: previous30Days, lt: last30Days },
    },
  });

  if (recentGrades.length === 0 || previousGrades.length === 0) {
    return false;
  }

  const recentAverage =
    recentGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) /
    recentGrades.length;
  const previousAverage =
    previousGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) /
    previousGrades.length;

  // Alert if average dropped by more than 0.5
  return recentAverage < previousAverage - 0.5;
}

/**
 * Check for homework backlog
 */
async function checkHomeworkBacklog(studentId: string): Promise<boolean> {
  const overdueCount = await prisma.homework.count({
    where: {
      studentId,
      status: { notIn: ["DONE", "SUBMITTED"] },
      dueDate: { lt: new Date() },
    },
  });

  // Alert if more than 3 overdue assignments
  return overdueCount > 3;
}

/**
 * Check for study time decrease
 */
async function checkStudyTimeDecrease(studentId: string): Promise<boolean> {
  // Get study sessions from last 7 days and previous 7 days
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // TODO: Implement study time tracking
  // For now, use homework completion as proxy
  const recentHomework = await prisma.homework.count({
    where: {
      studentId,
      createdAt: { gte: last7Days },
      status: { in: ["DONE", "SUBMITTED"] },
    },
  });

  const previousHomework = await prisma.homework.count({
    where: {
      studentId,
      createdAt: { gte: previous7Days, lt: last7Days },
      status: { in: ["DONE", "SUBMITTED"] },
    },
  });

  // Alert if completion decreased by more than 50%
  return recentHomework < previousHomework * 0.5;
}

/**
 * Generate grade drop alert
 */
async function generateGradeDropAlert(
  studentId: string,
  data: { recentAverage: number; previousAverage: number },
): Promise<Alert> {
  const drop = data.previousAverage - data.recentAverage;
  const severity =
    drop > 1.5
      ? "critical"
      : drop > 1.0
        ? "high"
        : drop > 0.5
          ? "medium"
          : "low";

  return {
    id: `alert-${Date.now()}`,
    type: "grade_drop",
    severity,
    message: `Prosek ocena je pao sa ${data.previousAverage.toFixed(2)} na ${data.recentAverage.toFixed(2)}`,
    details: {
      recentAverage: data.recentAverage,
      previousAverage: data.previousAverage,
      drop,
    },
    recommendations: [
      "Razgovarajte sa detetom o padu ocena",
      "Proverite da li ima problema sa određenim predmetima",
      "Pomozite detetu da organizuje vreme za učenje",
      "Kontaktirajte nastavnika ako pad nastavlja",
    ],
    timestamp: new Date(),
    studentId,
  };
}

/**
 * Generate homework backlog alert
 */
async function generateHomeworkBacklogAlert(
  studentId: string,
  data: { overdueCount: number },
): Promise<Alert> {
  const severity =
    data.overdueCount > 7
      ? "critical"
      : data.overdueCount > 5
        ? "high"
        : data.overdueCount > 3
          ? "medium"
          : "low";

  return {
    id: `alert-${Date.now()}`,
    type: "homework_backlog",
    severity,
    message: `Ima ${data.overdueCount} zadataka sa prošlim rokom`,
    details: {
      overdueCount: data.overdueCount,
    },
    recommendations: [
      "Pomozite detetu da prioritizuje zadatke",
      "Razložite zadatke na manje delove",
      "Postavite dnevni cilj za završavanje zadataka",
      "Proverite da li dete razume zahteve zadataka",
    ],
    timestamp: new Date(),
    studentId,
  };
}

/**
 * Check all alert rules and generate alerts
 */
export async function checkParentalAlerts(studentId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    // Check grade drop
    if (await checkGradeDrop(studentId)) {
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentGrades = await prisma.grade.findMany({
        where: { studentId, date: { gte: last30Days } },
      });
      const previousGrades = await prisma.grade.findMany({
        where: { studentId, date: { gte: previous30Days, lt: last30Days } },
      });

      const recentAverage =
        recentGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) /
        recentGrades.length;
      const previousAverage =
        previousGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) /
        previousGrades.length;

      alerts.push(
        await generateGradeDropAlert(studentId, {
          recentAverage,
          previousAverage,
        }),
      );
    }

    // Check homework backlog
    if (await checkHomeworkBacklog(studentId)) {
      const overdueCount = await prisma.homework.count({
        where: {
          studentId,
          status: { notIn: ["DONE", "SUBMITTED"] },
          dueDate: { lt: new Date() },
        },
      });

      alerts.push(
        await generateHomeworkBacklogAlert(studentId, { overdueCount }),
      );
    }

    // Check study time decrease
    if (await checkStudyTimeDecrease(studentId)) {
      // TODO: Generate study time alert
    }

    log.info("Parental alerts checked", {
      studentId,
      alertCount: alerts.length,
    });

    return alerts;
  } catch (error) {
    log.error("Error checking parental alerts", error);
    return [];
  }
}

/**
 * Send alert to parent (email/push notification)
 */
export async function sendParentalAlert(
  guardianId: string,
  alert: Alert,
): Promise<void> {
  // TODO: Implement email/push notification
  log.info("Parental alert generated", {
    guardianId,
    alertType: alert.type,
    severity: alert.severity,
  });
}
