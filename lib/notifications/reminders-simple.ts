/**
 * Notification Reminders Module - Simplified
 */

import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

/**
 * Get upcoming homework due soon
 */
export async function getUpcomingHomework(studentId: string) {
  log.info("Fetching upcoming homework", { studentId });

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const homework = await prisma.homework.findMany({
      where: {
        studentId,
        status: "ASSIGNED",
        dueDate: {
          lte: tomorrow,
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return homework;
  } catch (error) {
    log.error("Error fetching homework", error as Error);
    return [];
  }
}

/**
 * Get daily summary data
 */
export async function getDailySummary(studentId: string, date: Date) {
  log.info("Generating daily summary", { studentId, date });

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get homework due today
    const homeworkToday = await prisma.homework.findMany({
      where: {
        studentId,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
      },
    });

    // Get completed homework count
    const completedCount = await prisma.homework.count({
      where: {
        studentId,
        status: "SUBMITTED",
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return {
      homeworkDueToday: homeworkToday.length,
      completedToday: completedCount,
      homework: homeworkToday,
    };
  } catch (error) {
    log.error("Error generating daily summary", error as Error);
    return { homeworkDueToday: 0, completedToday: 0, homework: [] };
  }
}
