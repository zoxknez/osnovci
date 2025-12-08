/**
 * Server-side Push Notification Sending
 * Uses web-push library to send notifications to subscribed users
 */

import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";

// Configure web-push VAPID details
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:noreply@osnovci.app",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
} else {
  log.warn("VAPID keys not configured - push notifications disabled");
}

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Send push notification to user
 * Sends to all active subscriptions for the user
 */
export async function sendPushNotification(
  payload: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  const { userId, title, body, data, icon, badge, actions } = payload;

  // Check if VAPID keys are configured
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    log.warn("[PUSH] VAPID keys not configured - skipping push notification", {
      userId,
    });
    return { sent: 0, failed: 0 };
  }

  try {
    // Get all active push subscriptions for user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      log.info("[PUSH] No active subscriptions for user", { userId });
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Send notification to each subscription
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        const notificationPayload = JSON.stringify({
          title,
          body,
          icon: icon || "/icons/icon-192x192.svg",
          badge: badge || "/icons/icon-96x96.svg",
          data: data || {},
          actions: actions || [],
        });

        await webpush.sendNotification(pushSubscription, notificationPayload);

        // Update last used timestamp
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { lastUsed: new Date() },
        });

        sent++;

        log.info("[PUSH] Notification sent successfully", {
          userId,
          subscriptionId: subscription.id,
        });
      } catch (error) {
        failed++;

        // Handle expired/invalid subscriptions
        const webPushError = error as { statusCode?: number };
        if (
          webPushError.statusCode === 410 ||
          webPushError.statusCode === 404
        ) {
          // Subscription expired or invalid - mark as inactive
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false },
          });

          log.warn("[PUSH] Subscription expired - marked as inactive", {
            userId,
            subscriptionId: subscription.id,
            statusCode: webPushError.statusCode,
          });
        } else {
          log.error("[PUSH] Failed to send notification", error as Error, {
            userId,
            subscriptionId: subscription.id,
          });
        }
      }
    }

    return { sent, failed };
  } catch (error) {
    log.error("[PUSH] Failed to send push notifications", error as Error, {
      userId,
    });

    return { sent: 0, failed: 0 };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationBatch(
  payloads: PushNotificationPayload[],
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const payload of payloads) {
    const result = await sendPushNotification(payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed };
}
