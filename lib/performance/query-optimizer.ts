/**
 * Database Query Optimizer
 * 
 * Provides optimized query functions with:
 * - Selective field loading (only necessary fields)
 * - Compound indexes utilization
 * - Batch loading for N+1 prevention
 * - Cursor-based pagination
 * - Query result caching
 */

import { prisma } from "@/lib/db/prisma";
import {
  getCachedHomework,
  setCachedHomework,
  getCachedSchedule,
  setCachedSchedule,
  getCachedGrades,
  setCachedGrades,
} from "@/lib/cache/redis";
import { log } from "@/lib/logger";

// ===========================================
// OPTIMIZED HOMEWORK QUERIES
// ===========================================

/**
 * Get homework list with minimal fields (for lists)
 */
export async function getHomeworkList(
  studentId: string,
  filters: {
    status?: string;
    priority?: string;
    subjectId?: string;
    fromDate?: Date;
    toDate?: Date;
  } = {}
) {
  const cacheKey = `${studentId}:${JSON.stringify(filters)}`;
  const cached = await getCachedHomework(studentId, cacheKey);
  if (cached) {
    log.info("Homework list cache hit", { studentId });
    return cached;
  }

  const homework = await prisma.homework.findMany({
    where: {
      studentId,
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.fromDate && {
        dueDate: {
          gte: filters.fromDate,
          ...(filters.toDate && { lte: filters.toDate }),
        },
      }),
    },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
      priority: true,
      subjectId: true,
      estimatedMinutes: true,
      createdAt: true,
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      _count: {
        select: {
          attachments: true,
          subtasks: true,
        },
      },
    },
    orderBy: [
      { priority: "desc" }, // HIGH first
      { dueDate: "asc" }, // Earliest due first
    ],
  });

  await setCachedHomework(studentId, cacheKey, homework);
  return homework;
}

/**
 * Get single homework with full details (for detail view)
 */
export async function getHomeworkDetail(homeworkId: string) {
  return prisma.homework.findUnique({
    where: { id: homeworkId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        },
      },
      attachments: {
        orderBy: { uploadedAt: "desc" },
      },
      subtasks: {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { subtasks: true },
          },
        },
      },
      dependencies: {
        include: {
          dependsOn: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
      blockedBy: {
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Batch load homework with subjects (prevents N+1)
 */
export async function batchLoadHomework(homeworkIds: string[]) {
  if (homeworkIds.length === 0) return [];

  return prisma.homework.findMany({
    where: {
      id: { in: homeworkIds },
    },
    include: {
      subject: true,
      _count: {
        select: {
          attachments: true,
          subtasks: true,
        },
      },
    },
  });
}

// ===========================================
// OPTIMIZED SCHEDULE QUERIES
// ===========================================

/**
 * Get weekly schedule (heavily cached)
 */
export async function getWeeklySchedule(studentId: string) {
  const cached = await getCachedSchedule(studentId);
  if (cached) {
    log.info("Schedule cache hit", { studentId });
    return cached;
  }

  const schedule = await prisma.scheduleEntry.findMany({
    where: { studentId },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      room: true,
      isAWeek: true,
      isBWeek: true,
      isCustomEvent: true,
      customTitle: true,
      customColor: true,
      customDate: true,
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        },
      },
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });

  await setCachedSchedule(studentId, schedule);
  return schedule;
}

// ===========================================
// OPTIMIZED GRADE QUERIES
// ===========================================

/**
 * Get grade statistics with aggregations
 */
export async function getGradeStatistics(
  studentId: string,
  period?: { from: Date; to: Date }
) {
  const cacheKey = period ? `${period.from}-${period.to}` : "all";
  const cached = await getCachedGrades(studentId, cacheKey);
  if (cached) {
    log.info("Grades cache hit", { studentId });
    return cached;
  }

  // Single query with aggregations
  const stats = await prisma.grade.groupBy({
    by: ["subjectId"],
    where: {
      studentId,
      ...(period && {
        date: {
          gte: period.from,
          lte: period.to,
        },
      }),
    },
    _avg: {
      value: true,
    },
    _count: {
      value: true,
    },
    _min: {
      value: true,
    },
    _max: {
      value: true,
    },
  });

  // Load subject names in single query
  const subjectIds = stats.map((s: { subjectId: string }) => s.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true, color: true },
  });

  const subjectMap = new Map(subjects.map((s: { id: string; name: string; color: string }) => [s.id, s]));

  const result = stats.map((stat: {
    subjectId: string;
    _avg: { value: number | null };
    _count: { value: number };
    _min: { value: number | null };
    _max: { value: number | null };
  }) => ({
    subject: subjectMap.get(stat.subjectId),
    average: stat._avg.value,
    count: stat._count.value,
    min: stat._min.value,
    max: stat._max.value,
  }));

  await setCachedGrades(studentId, result, cacheKey);
  return result;
}

/**
 * Get recent grades (for dashboard)
 */
export async function getRecentGrades(studentId: string, limit = 10) {
  return prisma.grade.findMany({
    where: { studentId },
    select: {
      id: true,
      value: true,
      type: true,
      date: true,
      weight: true,
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}

// ===========================================
// CURSOR-BASED PAGINATION
// ===========================================

/**
 * Paginated homework query (for infinite scroll)
 */
export async function getPaginatedHomework(
  studentId: string,
  options: {
    cursor?: string;
    limit?: number;
    status?: string;
  } = {}
) {
  const limit = options.limit ?? 20;

  const homework = await prisma.homework.findMany({
    where: {
      studentId,
      ...(options.status && { status: options.status }),
    },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
      priority: true,
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: limit + 1, // Take one extra to check if there's more
    ...(options.cursor && {
      cursor: { id: options.cursor },
      skip: 1, // Skip the cursor
    }),
  });

  const hasMore = homework.length > limit;
  const items = hasMore ? homework.slice(0, -1) : homework;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

// ===========================================
// BATCH OPERATIONS
// ===========================================

/**
 * Batch create homework (transaction with optimizations)
 */
export async function batchCreateHomework(
  studentId: string,
  homeworkList: Array<{
    title: string;
    description?: string;
    subjectId: string;
    dueDate: Date;
    priority?: string;
  }>
) {
  return prisma.$transaction(
    homeworkList.map((hw) =>
      prisma.homework.create({
        data: {
          studentId,
          ...hw,
        },
      })
    )
  );
}

/**
 * Batch update homework status
 */
export async function batchUpdateHomeworkStatus(
  homeworkIds: string[],
  status: string
) {
  return prisma.homework.updateMany({
    where: {
      id: { in: homeworkIds },
    },
    data: { status },
  });
}

// ===========================================
// ANALYTICS QUERIES (Optimized Aggregations)
// ===========================================

/**
 * Get homework completion statistics
 */
export async function getHomeworkCompletionStats(
  studentId: string,
  period: { from: Date; to: Date }
) {
  const [total, completed, inProgress, overdue] = await Promise.all([
    prisma.homework.count({
      where: {
        studentId,
        dueDate: {
          gte: period.from,
          lte: period.to,
        },
      },
    }),
    prisma.homework.count({
      where: {
        studentId,
        status: "COMPLETED",
        dueDate: {
          gte: period.from,
          lte: period.to,
        },
      },
    }),
    prisma.homework.count({
      where: {
        studentId,
        status: "IN_PROGRESS",
        dueDate: {
          gte: period.from,
          lte: period.to,
        },
      },
    }),
    prisma.homework.count({
      where: {
        studentId,
        status: "ASSIGNED",
        dueDate: {
          lt: new Date(),
          gte: period.from,
        },
      },
    }),
  ]);

  return {
    total,
    completed,
    inProgress,
    overdue,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

/**
 * Get subject workload distribution
 */
export async function getSubjectWorkload(studentId: string) {
  const workload = await prisma.homework.groupBy({
    by: ["subjectId"],
    where: {
      studentId,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    },
    _count: true,
    _sum: {
      estimatedMinutes: true,
    },
  });

  const subjectIds = workload.map((w: { subjectId: string }) => w.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true, color: true },
  });

  const subjectMap = new Map(subjects.map((s: { id: string; name: string; color: string }) => [s.id, s]));

  return workload.map((w: {
    subjectId: string;
    _count: number;
    _sum: { estimatedMinutes: number | null };
  }) => ({
    subject: subjectMap.get(w.subjectId),
    count: w._count,
    totalMinutes: w._sum.estimatedMinutes ?? 0,
  }));
}
