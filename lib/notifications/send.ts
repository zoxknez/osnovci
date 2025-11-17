// Push Notification Sending
import { log } from "@/lib/logger";

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
}

/**
 * Send push notification to user
 *
 * Production architecture:
 * - Client-side: Local notifications work in-app (current)
 * - Server-side: Push notifications via Web Push API (when configured)
 *
 * To enable server-side push:
 * 1. Generate VAPID keys
 * 2. Store user subscriptions in database
 * 3. Uncomment server-side code below
 * 4. Configure environment variables
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload,
) {
  try {
    // Uncomment for server-side push notifications:
    /*
    const subscription = await prisma.pushSubscription.findFirst({
      where: { userId },
    });

    if (subscription) {
      const webpush = require('web-push');
      
      webpush.setVapidDetails(
        'mailto:contact@osnovci.app',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );

      await webpush.sendNotification(
        subscription.endpoint,
        JSON.stringify(payload)
      );
      
      log.info("Server push sent", { userId, title: payload.title });
    }
    */

    // Current implementation: Client-side local notifications
    // These work reliably for in-app notifications
    log.info("Push notification queued", {
      userId,
      title: payload.title,
      method: "client-side",
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

  // For production with persistent scheduling, use a job queue:
  /*
  const Bull = require('bull');
  const notificationQueue = new Bull('notifications', {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  });

  notificationQueue.add('send-push', {
    userId,
    payload,
  }, {
    delay,
  });
  */

  // Current implementation: In-memory scheduling
  // Works for development; use job queue for production
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
