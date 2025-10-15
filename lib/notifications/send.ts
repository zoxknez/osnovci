// Push Notification Sending
import { log } from "@/lib/logger";
import { showLocalNotification } from "@/lib/notifications/push";

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
}

/**
 * Send push notification to user
 * For now, uses local notifications (client-side)
 * TODO: Implement server-side push when VAPID keys are configured
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload,
) {
  try {
    // TODO: Get user's push subscription from database
    // const subscription = await prisma.pushSubscription.findFirst({
    //   where: { userId },
    // });

    // For now, rely on client-side local notifications
    // The client will show notifications when in-app
    
    log.info("Push notification queued", {
      userId,
      title: payload.title,
    });

    return { success: true };
  } catch (error) {
    log.error("Failed to send push notification", { error, userId });
    return { success: false, error };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushNotificationPayload,
) {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushNotification(userId, payload)),
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  log.info("Bulk push notifications sent", {
    total: userIds.length,
    successful,
    failed,
  });

  return { successful, failed, total: userIds.length };
}

/**
 * Schedule notification for later
 */
export async function schedulePushNotification(
  userId: string,
  payload: PushNotificationPayload,
  sendAt: Date,
) {
  const delay = sendAt.getTime() - Date.now();

  if (delay <= 0) {
    // Send immediately
    return sendPushNotification(userId, payload);
  }

  // TODO: Use a proper job queue (BullMQ, Agenda, etc) for production
  // For now, use setTimeout (works only while server is running)
  setTimeout(() => {
    sendPushNotification(userId, payload);
  }, delay);

  log.info("Push notification scheduled", {
    userId,
    sendAt,
    delayMs: delay,
  });

  return { success: true, scheduledAt: sendAt };
}

/**
 * Notification templates
 */
export const NotificationTemplates = {
  homeworkDue: (title: string, dueDate: string): PushNotificationPayload => ({
    title: "Podsetnik: Domaći zadatak! 📚",
    body: `${title} - Rok: ${dueDate}`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    tag: "homework-reminder",
    data: { type: "homework_due" },
  }),

  homeworkSubmitted: (title: string): PushNotificationPayload => ({
    title: "Bravo! 🎉",
    body: `Urađen domaći: ${title}. Dobio si +10 XP!`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    tag: "homework-done",
    data: { type: "homework_submitted" },
  }),

  examReminder: (subject: string, time: string): PushNotificationPayload => ({
    title: "Kontrolni sutra! 📝",
    body: `${subject} - ${time}. Ponovio si?`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    tag: "exam-reminder",
    data: { type: "exam_reminder" },
  }),

  parentLinked: (parentName: string): PushNotificationPayload => ({
    title: "Novi roditelj povezan! 👨‍👩‍👧",
    body: `${parentName} sada prati tvoj napredak`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    tag: "parent-linked",
    data: { type: "parent_linked" },
  }),
};

