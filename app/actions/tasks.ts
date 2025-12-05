"use server";

import { auth } from "@/lib/auth/config";
import {
  createSubtasks,
  reorderSubtasks,
  getHomeworkWithSubtasks,
  calculateHomeworkProgress,
  createDependency,
  removeDependency,
  canStartTask,
  getDependencyGraph,
  createTaskTemplate,
  createFromTemplate,
  getTemplates,
  createRecurringTask,
  bulkCompleteHomework,
  bulkUpdatePriority,
  bulkUpdateDueDate,
  bulkDeleteHomework,
  getBulkActionPreview,
  getTaskAnalytics,
} from "@/lib/tasks/task-manager";
import { log } from "@/lib/logger";
import { revalidatePath } from "next/cache";

// Helper for consistent responses
type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ============================================
// SUBTASKS
// ============================================

export async function createSubtasksAction(
  parentId: string,
  subtasks: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
    order?: number;
  }[]
): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await createSubtasks(parentId, subtasks);
    log.info("Subtasks created", { parentId, count: result.length });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error creating subtasks", error);
    return { error: error instanceof Error ? error.message : "Failed to create subtasks" };
  }
}

export async function reorderSubtasksAction(
  parentId: string,
  subtaskIds: string[]
): Promise<ActionResponse> {
  try {
    await getSession();
    await reorderSubtasks(parentId, subtaskIds);
    log.info("Subtasks reordered", { parentId });
    revalidatePath("/dashboard/zadaci");
    return { data: { success: true } };
  } catch (error) {
    log.error("Error reordering subtasks", error);
    return { error: error instanceof Error ? error.message : "Failed to reorder subtasks" };
  }
}

export async function getHomeworkProgressAction(homeworkId: string): Promise<ActionResponse> {
  try {
    await getSession();
    const progress = await calculateHomeworkProgress(homeworkId);
    return { data: progress };
  } catch (error) {
    log.error("Error getting homework progress", error);
    return { error: error instanceof Error ? error.message : "Failed to get progress" };
  }
}

// ============================================
// DEPENDENCIES
// ============================================

export async function createDependencyAction(
  taskId: string,
  dependsOnId: string,
  dependencyType?: "FINISH_TO_START" | "START_TO_START" | "FINISH_TO_FINISH"
): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await createDependency(taskId, dependsOnId, dependencyType);
    log.info("Dependency created", { taskId, dependsOnId });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error creating dependency", error);
    return { error: error instanceof Error ? error.message : "Failed to create dependency" };
  }
}

export async function removeDependencyAction(dependencyId: string): Promise<ActionResponse> {
  try {
    await getSession();
    await removeDependency(dependencyId);
    log.info("Dependency removed", { dependencyId });
    revalidatePath("/dashboard/zadaci");
    return { data: { success: true } };
  } catch (error) {
    log.error("Error removing dependency", error);
    return { error: error instanceof Error ? error.message : "Failed to remove dependency" };
  }
}

export async function canStartTaskAction(taskId: string): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await canStartTask(taskId);
    return { data: result };
  } catch (error) {
    log.error("Error checking if task can start", error);
    return { error: error instanceof Error ? error.message : "Failed to check task status" };
  }
}

export async function getDependencyGraphAction(studentId: string): Promise<ActionResponse> {
  try {
    await getSession();
    const graph = await getDependencyGraph(studentId);
    return { data: graph };
  } catch (error) {
    log.error("Error getting dependency graph", error);
    return { error: error instanceof Error ? error.message : "Failed to get dependency graph" };
  }
}

// ============================================
// TEMPLATES
// ============================================

export async function createTaskTemplateAction(
  studentId: string,
  subjectId: string,
  data: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
    subtasks?: {
      title: string;
      description?: string;
      estimatedMinutes?: number;
    }[];
  }
): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await createTaskTemplate(studentId, subjectId, data);
    log.info("Template created", { templateId: result.id, title: result.title });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error creating template", error);
    return { error: error instanceof Error ? error.message : "Failed to create template" };
  }
}

export async function createFromTemplateAction(
  templateId: string,
  dueDate: Date,
  priority?: "LOW" | "NORMAL" | "HIGH"
): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await createFromTemplate(templateId, dueDate, priority);
    log.info("Homework created from template", { templateId, homeworkId: result.id });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error creating from template", error);
    return { error: error instanceof Error ? error.message : "Failed to create from template" };
  }
}

export async function getTemplatesAction(
  studentId: string,
  subjectId?: string
): Promise<ActionResponse> {
  try {
    await getSession();
    const templates = await getTemplates(studentId, subjectId);
    return { data: templates };
  } catch (error) {
    log.error("Error getting templates", error);
    return { error: error instanceof Error ? error.message : "Failed to get templates" };
  }
}

// ============================================
// RECURRING TASKS
// ============================================

export async function createRecurringTaskAction(
  studentId: string,
  subjectId: string,
  data: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
    recurrenceRule: "DAILY" | "WEEKLY" | "MONTHLY";
    startDate: Date;
    endDate?: Date;
  }
): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await createRecurringTask(studentId, subjectId, data);
    log.info("Recurring task created", { taskId: result.id, rule: data.recurrenceRule });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error creating recurring task", error);
    return { error: error instanceof Error ? error.message : "Failed to create recurring task" };
  }
}

// ============================================
// BULK ACTIONS
// ============================================

export async function bulkCompleteHomeworkAction(homeworkIds: string[]): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await bulkCompleteHomework(homeworkIds);
    log.info("Bulk complete", { count: result.count, ids: homeworkIds });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error bulk completing homework", error);
    return { error: error instanceof Error ? error.message : "Failed to complete tasks" };
  }
}

export async function bulkUpdatePriorityAction(
  homeworkIds: string[],
  priority: "NORMAL" | "IMPORTANT" | "URGENT"
): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await bulkUpdatePriority(homeworkIds, priority);
    log.info("Bulk update priority", { count: result.count, priority });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error bulk updating priority", error);
    return { error: error instanceof Error ? error.message : "Failed to update priority" };
  }
}

export async function bulkUpdateDueDateAction(
  homeworkIds: string[],
  dueDate: Date
): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await bulkUpdateDueDate(homeworkIds, dueDate);
    log.info("Bulk update due date", { count: result.count });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error bulk updating due date", error);
    return { error: error instanceof Error ? error.message : "Failed to update due date" };
  }
}

export async function bulkDeleteHomeworkAction(homeworkIds: string[]): Promise<ActionResponse> {
  try {
    await getSession();
    const result = await bulkDeleteHomework(homeworkIds);
    log.info("Bulk delete", { count: result.count, ids: homeworkIds });
    revalidatePath("/dashboard/zadaci");
    return { data: result };
  } catch (error) {
    log.error("Error bulk deleting homework", error);
    return { error: error instanceof Error ? error.message : "Failed to delete tasks" };
  }
}

export async function getBulkActionPreviewAction(homeworkIds: string[]): Promise<ActionResponse> {
  try {
    await getSession();
    const preview = await getBulkActionPreview(homeworkIds);
    return { data: preview };
  } catch (error) {
    log.error("Error getting bulk action preview", error);
    return { error: error instanceof Error ? error.message : "Failed to get preview" };
  }
}

// ============================================
// ANALYTICS
// ============================================

export async function getTaskAnalyticsAction(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResponse> {
  try {
    await getSession();
    const analytics = await getTaskAnalytics(studentId, startDate, endDate);
    return { data: analytics };
  } catch (error) {
    log.error("Error getting task analytics", error);
    return { error: error instanceof Error ? error.message : "Failed to get analytics" };
  }
}

export async function getHomeworkWithSubtasksAction(homeworkId: string): Promise<ActionResponse> {
  try {
    await getSession();
    const homework = await getHomeworkWithSubtasks(homeworkId);
    if (!homework) {
      return { error: "Homework not found" };
    }
    return { data: homework };
  } catch (error) {
    log.error("Error getting homework details", error);
    return { error: error instanceof Error ? error.message : "Failed to get homework details" };
  }
}
