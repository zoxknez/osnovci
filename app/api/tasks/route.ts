/**
 * API ROUTE: Task Management++ Operations
 * Handles subtasks, dependencies, templates, bulk actions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { z } from "zod";
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

export const dynamic = "force-dynamic";

// ============================================
// SUBTASKS
// ============================================

const createSubtasksSchema = z.object({
  action: z.literal("create_subtasks"),
  parentId: z.string(),
  subtasks: z.array(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      estimatedMinutes: z.number().int().positive().optional(),
      order: z.number().int().nonnegative().optional(),
    })
  ),
});

const reorderSubtasksSchema = z.object({
  action: z.literal("reorder_subtasks"),
  parentId: z.string(),
  subtaskIds: z.array(z.string()),
});

const getProgressSchema = z.object({
  action: z.literal("get_progress"),
  homeworkId: z.string(),
});

// ============================================
// DEPENDENCIES
// ============================================

const createDependencySchema = z.object({
  action: z.literal("create_dependency"),
  taskId: z.string(),
  dependsOnId: z.string(),
  dependencyType: z.enum(["FINISH_TO_START", "START_TO_START", "FINISH_TO_FINISH"]).optional(),
});

const removeDependencySchema = z.object({
  action: z.literal("remove_dependency"),
  dependencyId: z.string(),
});

const canStartSchema = z.object({
  action: z.literal("can_start"),
  taskId: z.string(),
});

const getDependencyGraphSchema = z.object({
  action: z.literal("get_dependency_graph"),
  studentId: z.string(),
});

// ============================================
// TEMPLATES
// ============================================

const createTemplateSchema = z.object({
  action: z.literal("create_template"),
  studentId: z.string(),
  subjectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  subtasks: z.array(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      estimatedMinutes: z.number().int().positive().optional(),
    })
  ).optional(),
});

const createFromTemplateSchema = z.object({
  action: z.literal("create_from_template"),
  templateId: z.string(),
  dueDate: z.string().datetime(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
});

const getTemplatesSchema = z.object({
  action: z.literal("get_templates"),
  studentId: z.string(),
  subjectId: z.string().optional(),
});

// ============================================
// RECURRING TASKS
// ============================================

const createRecurringSchema = z.object({
  action: z.literal("create_recurring"),
  studentId: z.string(),
  subjectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  recurrenceRule: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// BULK ACTIONS
// ============================================

const bulkCompleteSchema = z.object({
  action: z.literal("bulk_complete"),
  homeworkIds: z.array(z.string()).min(1),
});

const bulkUpdatePrioritySchema = z.object({
  action: z.literal("bulk_update_priority"),
  homeworkIds: z.array(z.string()).min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]),
});

const bulkUpdateDueDateSchema = z.object({
  action: z.literal("bulk_update_due_date"),
  homeworkIds: z.array(z.string()).min(1),
  dueDate: z.string().datetime(),
});

const bulkDeleteSchema = z.object({
  action: z.literal("bulk_delete"),
  homeworkIds: z.array(z.string()).min(1),
});

const bulkPreviewSchema = z.object({
  action: z.literal("bulk_preview"),
  homeworkIds: z.array(z.string()).min(1),
});

// ============================================
// ANALYTICS
// ============================================

const getAnalyticsSchema = z.object({
  action: z.literal("get_analytics"),
  studentId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// Union of all schemas
const requestSchema = z.discriminatedUnion("action", [
  createSubtasksSchema,
  reorderSubtasksSchema,
  getProgressSchema,
  createDependencySchema,
  removeDependencySchema,
  canStartSchema,
  getDependencyGraphSchema,
  createTemplateSchema,
  createFromTemplateSchema,
  getTemplatesSchema,
  createRecurringSchema,
  bulkCompleteSchema,
  bulkUpdatePrioritySchema,
  bulkUpdateDueDateSchema,
  bulkDeleteSchema,
  bulkPreviewSchema,
  getAnalyticsSchema,
]);

export async function POST(request: NextRequest) {
  const session = await auth();

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = requestSchema.parse(body);

    switch (data.action) {
      case "create_subtasks": {
        const result = await createSubtasks(
          data.parentId, 
          data.subtasks.map(s => ({
            title: s.title,
            ...(s.description && { description: s.description }),
            ...(s.estimatedMinutes && { estimatedMinutes: s.estimatedMinutes }),
            ...(s.order !== undefined && { order: s.order }),
          }))
        );
        log.info("Subtasks created", { parentId: data.parentId, count: result.length });
        return NextResponse.json(result);
      }

      case "reorder_subtasks": {
        await reorderSubtasks(data.parentId, data.subtaskIds);
        log.info("Subtasks reordered", { parentId: data.parentId });
        return NextResponse.json({ success: true });
      }

      case "get_progress": {
        const progress = await calculateHomeworkProgress(data.homeworkId);
        return NextResponse.json(progress);
      }

      case "create_dependency": {
        const result = await createDependency(
          data.taskId,
          data.dependsOnId,
          data.dependencyType
        );
        log.info("Dependency created", { taskId: data.taskId, dependsOnId: data.dependsOnId });
        return NextResponse.json(result);
      }

      case "remove_dependency": {
        await removeDependency(data.dependencyId);
        log.info("Dependency removed", { dependencyId: data.dependencyId });
        return NextResponse.json({ success: true });
      }

      case "can_start": {
        const result = await canStartTask(data.taskId);
        return NextResponse.json(result);
      }

      case "get_dependency_graph": {
        const graph = await getDependencyGraph(data.studentId);
        return NextResponse.json(graph);
      }

      case "create_template": {
        const result = await createTaskTemplate(data.studentId, data.subjectId, {
          title: data.title,
          ...(data.description && { description: data.description }),
          ...(data.estimatedMinutes && { estimatedMinutes: data.estimatedMinutes }),
          ...(data.subtasks && { 
            subtasks: data.subtasks.map(s => ({
              title: s.title,
              ...(s.description && { description: s.description }),
              ...(s.estimatedMinutes && { estimatedMinutes: s.estimatedMinutes }),
            }))
          }),
        });
        log.info("Template created", { templateId: result.id, title: result.title });
        return NextResponse.json(result);
      }

      case "create_from_template": {
        const result = await createFromTemplate(
          data.templateId,
          new Date(data.dueDate),
          data.priority
        );
        log.info("Homework created from template", { templateId: data.templateId, homeworkId: result.id });
        return NextResponse.json(result);
      }

      case "get_templates": {
        const templates = await getTemplates(data.studentId, data.subjectId);
        return NextResponse.json(templates);
      }

      case "create_recurring": {
        const result = await createRecurringTask(data.studentId, data.subjectId, {
          title: data.title,
          ...(data.description && { description: data.description }),
          ...(data.estimatedMinutes && { estimatedMinutes: data.estimatedMinutes }),
          recurrenceRule: data.recurrenceRule,
          startDate: new Date(data.startDate),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
        });
        log.info("Recurring task created", { taskId: result.id, rule: data.recurrenceRule });
        return NextResponse.json(result);
      }

      case "bulk_complete": {
        const result = await bulkCompleteHomework(data.homeworkIds);
        log.info("Bulk complete", { count: result.count, ids: data.homeworkIds });
        return NextResponse.json(result);
      }

      case "bulk_update_priority": {
        const result = await bulkUpdatePriority(data.homeworkIds, data.priority);
        log.info("Bulk update priority", { count: result.count, priority: data.priority });
        return NextResponse.json(result);
      }

      case "bulk_update_due_date": {
        const result = await bulkUpdateDueDate(data.homeworkIds, new Date(data.dueDate));
        log.info("Bulk update due date", { count: result.count });
        return NextResponse.json(result);
      }

      case "bulk_delete": {
        const result = await bulkDeleteHomework(data.homeworkIds);
        log.info("Bulk delete", { count: result.count, ids: data.homeworkIds });
        return NextResponse.json(result);
      }

      case "bulk_preview": {
        const preview = await getBulkActionPreview(data.homeworkIds);
        return NextResponse.json(preview);
      }

      case "get_analytics": {
        const analytics = await getTaskAnalytics(
          data.studentId,
          new Date(data.startDate),
          new Date(data.endDate)
        );
        return NextResponse.json(analytics);
      }

      default: {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error("Validation error in task-manager", error);
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    log.error("Error in task-manager", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const homeworkId = searchParams.get("homeworkId");

    if (!homeworkId) {
      return NextResponse.json({ error: "homeworkId required" }, { status: 400 });
    }

    // Get homework with subtasks
    const homework = await getHomeworkWithSubtasks(homeworkId);

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    return NextResponse.json(homework);
  } catch (error) {
    log.error("Error getting homework details", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
