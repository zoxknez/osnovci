// Activity Logger - Track student actions for parental oversight
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export type ActivityType =
  | "LOGIN"
  | "HOMEWORK_CREATED"
  | "HOMEWORK_UPDATED"
  | "HOMEWORK_DELETED"
  | "PHOTO_UPLOADED"
  | "PASSWORD_CHANGED"
  | "PROFILE_UPDATED"
  | "PARENT_LINKED"
  | "PARENT_REMOVED";

interface LogActivityParams {
  studentId: string;
  type: ActivityType;
  description: string;
  metadata?: any;
  request?: NextRequest;
}

/**
 * Log student activity
 * Parents can see what child is doing
 */
export async function logActivity({
  studentId,
  type,
  description,
  metadata,
  request,
}: LogActivityParams) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        studentId,
        type,
        description,
        metadata: metadata || {},
        ipAddress:
          request?.headers.get("x-forwarded-for") ||
          request?.headers.get("x-real-ip") ||
          undefined,
        userAgent: request?.headers.get("user-agent") || undefined,
      },
    });

    log.debug("Activity logged", {
      activityId: activity.id,
      studentId,
      type,
    });

    // Check if parent should be notified
    await checkParentalNotification(studentId, type, description);

    return activity;
  } catch (error) {
    log.error("Failed to log activity", { error, studentId, type });
    // Don't throw - activity logging failure shouldn't break app
    return null;
  }
}

/**
 * Check if parent should be notified about this activity
 */
async function checkParentalNotification(
  studentId: string,
  type: ActivityType,
  description: string,
) {
  // Notify parent for sensitive activities
  const sensitiveActivities: ActivityType[] = [
    "PHOTO_UPLOADED",
    "PASSWORD_CHANGED",
    "PARENT_REMOVED",
    "PROFILE_UPDATED",
  ];

  if (sensitiveActivities.includes(type)) {
    // Get parent emails
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        links: {
          where: { isActive: true },
          include: {
            guardian: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!student) return;

    // Send notification to all linked parents
    for (const link of student.links) {
      const parentEmail = link.guardian.user.email;
      if (!parentEmail) continue;

      // TODO: Send email notification
      log.info("Parent notification queued", {
        parentEmail,
        activityType: type,
        studentId,
      });

      // Also create in-app notification
      await prisma.notification
        .create({
          data: {
            userId: link.guardian.userId,
            type: "SCHEDULE_CHANGE", // Reuse enum (or create new)
            title: `Aktivnost deteta: ${type}`,
            message: description,
            data: { studentId, activityType: type },
          },
        })
        .catch((err) => {
          log.warn("Failed to create parent notification", { error: err });
        });
    }
  }
}

/**
 * Get activity log for student (for parents)
 */
export async function getActivityLog(studentId: string, limit = 50) {
  return prisma.activityLog.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Helper to log common activities
 */
export const ActivityLogger = {
  login: (studentId: string, request?: NextRequest) =>
    logActivity({
      studentId,
      type: "LOGIN",
      description: "Prijava na nalog",
      request,
    }),

  homeworkCreated: (
    studentId: string,
    homeworkTitle: string,
    request?: NextRequest,
  ) =>
    logActivity({
      studentId,
      type: "HOMEWORK_CREATED",
      description: `Kreiran zadatak: ${homeworkTitle}`,
      metadata: { homeworkTitle },
      request,
    }),

  photoUploaded: (
    studentId: string,
    fileName: string,
    homeworkId: string,
    request?: NextRequest,
  ) =>
    logActivity({
      studentId,
      type: "PHOTO_UPLOADED",
      description: `Uploadovana slika: ${fileName}`,
      metadata: { fileName, homeworkId },
      request,
    }),

  passwordChanged: (studentId: string, request?: NextRequest) =>
    logActivity({
      studentId,
      type: "PASSWORD_CHANGED",
      description: "Promenjena lozinka",
      request,
    }),
};
