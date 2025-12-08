/**
 * TASK MANAGEMENT++ - ADVANCED HOMEWORK FEATURES
 * Subtasks, dependencies, templates, recurring tasks, bulk actions
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

// ============================================
// SUBTASK MANAGEMENT
// ============================================

/**
 * Create subtasks for a homework
 */
export async function createSubtasks(
  parentId: string,
  subtasks: Array<{
    title: string;
    description?: string;
    estimatedMinutes?: number;
    order?: number;
  }>,
): Promise<Array<{ id: string; title: string; order: number }>> {
  // Get parent homework to copy relevant fields
  const parent = await prisma.homework.findUnique({
    where: { id: parentId },
    select: {
      studentId: true,
      subjectId: true,
      dueDate: true,
      priority: true,
    },
  });

  if (!parent) {
    throw new Error("Parent homework not found");
  }

  // Create subtasks with inherited fields
  const createdSubtasks = await Promise.all(
    subtasks.map((subtask, index) =>
      prisma.homework.create({
        data: {
          parentId,
          studentId: parent.studentId,
          subjectId: parent.subjectId,
          title: subtask.title,
          ...(subtask.description && { description: subtask.description }),
          dueDate: parent.dueDate,
          priority: parent.priority,
          ...(subtask.estimatedMinutes && {
            estimatedMinutes: subtask.estimatedMinutes,
          }),
          order: subtask.order ?? index,
          status: "ASSIGNED",
        },
        select: {
          id: true,
          title: true,
          order: true,
        },
      }),
    ),
  );

  return createdSubtasks;
}

/**
 * Reorder subtasks
 */
export async function reorderSubtasks(
  _parentId: string,
  subtaskIds: string[],
): Promise<void> {
  const updates = subtaskIds.map((id, index) =>
    prisma.homework.update({
      where: { id },
      data: { order: index },
    }),
  );

  await prisma.$transaction(updates);
}

/**
 * Get homework with all subtasks
 */
export async function getHomeworkWithSubtasks(homeworkId: string) {
  return prisma.homework.findUnique({
    where: { id: homeworkId },
    include: {
      subtasks: {
        orderBy: { order: "asc" },
        include: {
          attachments: true,
        },
      },
      attachments: true,
      subject: true,
      parent: true,
    },
  });
}

/**
 * Calculate completion percentage based on subtasks
 */
export async function calculateHomeworkProgress(homeworkId: string): Promise<{
  totalSubtasks: number;
  completedSubtasks: number;
  percentage: number;
}> {
  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: {
      subtasks: {
        select: { status: true },
      },
    },
  });

  if (!homework || homework.subtasks.length === 0) {
    return {
      totalSubtasks: 0,
      completedSubtasks: 0,
      percentage: 0,
    };
  }

  const totalSubtasks = homework.subtasks.length;
  const completedSubtasks = homework.subtasks.filter(
    (s) => s.status === "SUBMITTED",
  ).length;

  return {
    totalSubtasks,
    completedSubtasks,
    percentage: Math.round((completedSubtasks / totalSubtasks) * 100),
  };
}

// ============================================
// TASK DEPENDENCIES
// ============================================

/**
 * Create task dependency (A must be completed before B)
 */
export async function createDependency(
  taskId: string,
  dependsOnId: string,
  dependencyType:
    | "FINISH_TO_START"
    | "START_TO_START"
    | "FINISH_TO_FINISH" = "FINISH_TO_START",
): Promise<{ id: string }> {
  // Prevent circular dependencies
  const existingDependencies = await getAllDependencies(dependsOnId);
  if (existingDependencies.some((d) => d.dependsOnId === taskId)) {
    throw new Error("Circular dependency detected");
  }

  const dependency = await prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnId,
      dependencyType,
    },
  });

  return { id: dependency.id };
}

/**
 * Remove task dependency
 */
export async function removeDependency(dependencyId: string): Promise<void> {
  await prisma.taskDependency.delete({
    where: { id: dependencyId },
  });
}

/**
 * Get all dependencies for a task (recursive)
 */
async function getAllDependencies(
  taskId: string,
  visited = new Set<string>(),
): Promise<Array<{ taskId: string; dependsOnId: string }>> {
  if (visited.has(taskId)) return [];
  visited.add(taskId);

  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId },
    select: { taskId: true, dependsOnId: true },
  });

  const nested = await Promise.all(
    dependencies.map((d) => getAllDependencies(d.dependsOnId, visited)),
  );

  return [...dependencies, ...nested.flat()];
}

/**
 * Check if task can be started (all dependencies met)
 */
export async function canStartTask(taskId: string): Promise<{
  canStart: boolean;
  blockedBy: Array<{ id: string; title: string; status: string }>;
}> {
  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOnTask: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  const blockedBy = dependencies
    .filter((d) => {
      if (d.dependencyType === "FINISH_TO_START") {
        return d.dependsOnTask.status !== "SUBMITTED";
      }
      return false; // Other dependency types can be implemented later
    })
    .map((d) => d.dependsOnTask);

  return {
    canStart: blockedBy.length === 0,
    blockedBy,
  };
}

/**
 * Get dependency graph for visualization
 */
export async function getDependencyGraph(studentId: string): Promise<{
  nodes: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: Date;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}> {
  const homework = await prisma.homework.findMany({
    where: { studentId, status: { not: "SUBMITTED" } },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
    },
  });

  const dependencies = await prisma.taskDependency.findMany({
    where: {
      task: { studentId },
    },
    select: {
      taskId: true,
      dependsOnId: true,
      dependencyType: true,
    },
  });

  return {
    nodes: homework,
    edges: dependencies.map((d) => ({
      from: d.dependsOnId,
      to: d.taskId,
      type: d.dependencyType,
    })),
  };
}

// ============================================
// TASK TEMPLATES
// ============================================

/**
 * Create task template
 */
export async function createTaskTemplate(
  studentId: string,
  subjectId: string,
  data: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
    subtasks?: Array<{
      title: string;
      description?: string;
      estimatedMinutes?: number;
    }>;
  },
): Promise<{ id: string; title: string }> {
  // Create main template task
  const template = await prisma.homework.create({
    data: {
      studentId,
      subjectId,
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.estimatedMinutes && { estimatedMinutes: data.estimatedMinutes }),
      isTemplate: true,
      dueDate: new Date(), // Dummy date for templates
      status: "ASSIGNED",
    },
  });

  // Create subtask templates if provided
  if (data.subtasks && data.subtasks.length > 0) {
    await createSubtasks(
      template.id,
      data.subtasks.map((s, index) => ({ ...s, order: index })),
    );
  }

  return { id: template.id, title: template.title };
}

/**
 * Create homework from template
 */
export async function createFromTemplate(
  templateId: string,
  dueDate: Date,
  priority?: "LOW" | "NORMAL" | "HIGH",
): Promise<{ id: string; title: string }> {
  const template = await prisma.homework.findUnique({
    where: { id: templateId, isTemplate: true },
    include: {
      subtasks: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!template) {
    throw new Error("Template not found");
  }

  // Create main homework from template
  const homework = await prisma.homework.create({
    data: {
      studentId: template.studentId,
      subjectId: template.subjectId,
      title: template.title,
      ...(template.description && { description: template.description }),
      dueDate,
      priority: (priority || template.priority) as any,
      ...(template.estimatedMinutes && {
        estimatedMinutes: template.estimatedMinutes,
      }),
      templateId,
      status: "ASSIGNED",
    },
  });

  // Copy subtasks
  if (template.subtasks.length > 0) {
    await createSubtasks(
      homework.id,
      template.subtasks.map((s) => ({
        title: s.title,
        ...(s.description && { description: s.description }),
        ...(s.estimatedMinutes && { estimatedMinutes: s.estimatedMinutes }),
        order: s.order,
      })),
    );
  }

  return { id: homework.id, title: homework.title };
}

/**
 * Get all templates for a subject
 */
export async function getTemplates(
  studentId: string,
  subjectId?: string,
): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    estimatedMinutes: number | null;
    subtaskCount: number;
  }>
> {
  const templates = await prisma.homework.findMany({
    where: {
      studentId,
      isTemplate: true,
      ...(subjectId && { subjectId }),
    },
    include: {
      _count: {
        select: { subtasks: true },
      },
    },
    orderBy: { title: "asc" },
  });

  return templates.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    estimatedMinutes: t.estimatedMinutes,
    subtaskCount: t._count.subtasks,
  }));
}

// ============================================
// RECURRING TASKS
// ============================================

/**
 * Create recurring homework (e.g., "Read 30 min every day")
 */
export async function createRecurringTask(
  studentId: string,
  subjectId: string,
  data: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
    recurrenceRule: string; // "DAILY", "WEEKLY", "MONTHLY"
    startDate: Date;
    endDate?: Date;
  },
): Promise<{ id: string; title: string }> {
  const task = await prisma.homework.create({
    data: {
      studentId,
      subjectId,
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.estimatedMinutes && { estimatedMinutes: data.estimatedMinutes }),
      isRecurring: true,
      recurrenceRule: data.recurrenceRule,
      dueDate: data.startDate,
      status: "ASSIGNED",
    },
  });

  // Generate instances for the next 7 days (or until endDate)
  await generateRecurringInstances(task.id, data.startDate, data.endDate);

  return { id: task.id, title: task.title };
}

/**
 * Generate recurring task instances
 */
async function generateRecurringInstances(
  parentId: string,
  startDate: Date,
  endDate?: Date,
): Promise<void> {
  const parent = await prisma.homework.findUnique({
    where: { id: parentId, isRecurring: true },
  });

  if (!parent) return;

  const instances: Prisma.HomeworkCreateManyInput[] = [];
  const maxDate = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const currentDate = new Date(startDate);

  while (currentDate <= maxDate) {
    instances.push({
      studentId: parent.studentId,
      subjectId: parent.subjectId,
      title: parent.title,
      description: parent.description,
      dueDate: new Date(currentDate),
      priority: parent.priority,
      estimatedMinutes: parent.estimatedMinutes,
      templateId: parentId,
      status: "ASSIGNED",
    });

    // Increment based on recurrence rule
    if (parent.recurrenceRule === "DAILY") {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (parent.recurrenceRule === "WEEKLY") {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (parent.recurrenceRule === "MONTHLY") {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      break;
    }
  }

  await prisma.homework.createMany({
    data: instances,
  });
}

// ============================================
// BULK ACTIONS
// ============================================

/**
 * Mark multiple tasks as completed
 */
export async function bulkCompleteHomework(
  homeworkIds: string[],
): Promise<{ count: number }> {
  const result = await prisma.homework.updateMany({
    where: { id: { in: homeworkIds } },
    data: {
      status: "SUBMITTED",
      completedAt: new Date(),
    },
  });

  return { count: result.count };
}

/**
 * Bulk update priority
 */
export async function bulkUpdatePriority(
  homeworkIds: string[],
  priority: "NORMAL" | "IMPORTANT" | "URGENT",
): Promise<{ count: number }> {
  const result = await prisma.homework.updateMany({
    where: { id: { in: homeworkIds } },
    data: { priority },
  });

  return { count: result.count };
}

/**
 * Bulk update due date
 */
export async function bulkUpdateDueDate(
  homeworkIds: string[],
  dueDate: Date,
): Promise<{ count: number }> {
  const result = await prisma.homework.updateMany({
    where: { id: { in: homeworkIds } },
    data: { dueDate },
  });

  return { count: result.count };
}

/**
 * Bulk delete homework
 */
export async function bulkDeleteHomework(
  homeworkIds: string[],
): Promise<{ count: number }> {
  const result = await prisma.homework.deleteMany({
    where: { id: { in: homeworkIds } },
  });

  return { count: result.count };
}

/**
 * Get bulk action preview (what will be affected)
 */
export async function getBulkActionPreview(homeworkIds: string[]): Promise<{
  count: number;
  items: Array<{
    id: string;
    title: string;
    status: string;
    hasSubtasks: boolean;
    subtaskCount: number;
  }>;
}> {
  const homework = await prisma.homework.findMany({
    where: { id: { in: homeworkIds } },
    include: {
      _count: {
        select: { subtasks: true },
      },
    },
  });

  return {
    count: homework.length,
    items: homework.map((h) => ({
      id: h.id,
      title: h.title,
      status: h.status,
      hasSubtasks: h._count.subtasks > 0,
      subtaskCount: h._count.subtasks,
    })),
  };
}

// ============================================
// TASK ANALYTICS
// ============================================

/**
 * Get task completion analytics
 */
export async function getTaskAnalytics(
  studentId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
}> {
  const tasks = await prisma.homework.findMany({
    where: {
      studentId,
      createdAt: { gte: startDate, lte: endDate },
      isTemplate: false,
      parentId: null, // Only count parent tasks
    },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "SUBMITTED").length;

  const tasksByPriority = tasks.reduce(
    (acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const tasksByStatus = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate average completion time
  const completedWithTime = tasks.filter(
    (t) => t.status === "SUBMITTED" && t.actualMinutes,
  );
  const avgCompletionTime =
    completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => sum + (t.actualMinutes || 0), 0) /
        completedWithTime.length
      : 0;

  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    avgCompletionTime: Math.round(avgCompletionTime),
    tasksByPriority,
    tasksByStatus,
  };
}
