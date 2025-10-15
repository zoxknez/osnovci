// Notification Creation Helpers
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export type NotificationType =
  | "HOMEWORK_DUE"
  | "HOMEWORK_SUBMITTED"
  | "HOMEWORK_REVIEWED"
  | "EVENT_REMINDER"
  | "SCHEDULE_CHANGE"
  | "LINK_REQUEST";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
        isRead: false,
      },
    });

    log.info("Notification created", {
      notificationId: notification.id,
      userId,
      type,
    });

    return notification;
  } catch (error) {
    log.error("Failed to create notification", { error, userId, type });
    throw error;
  }
}

/**
 * Create homework due reminder notification
 */
export async function notifyHomeworkDue(
  userId: string,
  homeworkId: string,
  title: string,
  dueDate: Date,
) {
  const hoursUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
    return createNotification({
      userId,
      type: "HOMEWORK_DUE",
      title: "Rok za domaći uskoro!",
      message: `${title} - rok: ${dueDate.toLocaleDateString("sr-RS")}`,
      data: { homeworkId, dueDate },
    });
  }

  return null;
}

/**
 * Create homework submitted notification
 */
export async function notifyHomeworkSubmitted(
  userId: string,
  homeworkId: string,
  title: string,
) {
  return createNotification({
    userId,
    type: "HOMEWORK_SUBMITTED",
    title: "Bravo! 🎉",
    message: `Završen domaći: ${title}. Dobio si +10 XP!`,
    data: { homeworkId },
  });
}

/**
 * Create homework reviewed notification
 */
export async function notifyHomeworkReviewed(
  userId: string,
  homeworkId: string,
  title: string,
  reviewNote?: string,
) {
  return createNotification({
    userId,
    type: "HOMEWORK_REVIEWED",
    title: "Domaći pregledan!",
    message: reviewNote || `Domaći "${title}" je pregledan od strane roditelja.`,
    data: { homeworkId, reviewNote },
  });
}

/**
 * Create event reminder notification
 */
export async function notifyEventReminder(
  userId: string,
  eventId: string,
  title: string,
  dateTime: Date,
) {
  return createNotification({
    userId,
    type: "EVENT_REMINDER",
    title: "Podsetnik: Događaj uskoro!",
    message: `${title} - ${dateTime.toLocaleString("sr-RS")}`,
    data: { eventId, dateTime },
  });
}

/**
 * Create family link request notification
 */
export async function notifyLinkRequest(
  userId: string,
  guardianName: string,
  linkCode: string,
) {
  return createNotification({
    userId,
    type: "LINK_REQUEST",
    title: "Novi roditelj želi da se poveže!",
    message: `${guardianName} želi da prati tvoj napredak. Koristi kod: ${linkCode}`,
    data: { guardianName, linkCode },
  });
}

/**
 * Batch create notifications for multiple users
 */
export async function createNotifications(notifications: CreateNotificationParams[]) {
  try {
    const created = await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data || {},
        isRead: false,
      })),
    });

    log.info("Batch notifications created", { count: created.count });

    return created;
  } catch (error) {
    log.error("Failed to create batch notifications", { error });
    throw error;
  }
}

