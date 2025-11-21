// Web Push Notifications - Cross-platform
"use client";

import { subscribeToPushAction, unsubscribeFromPushAction } from "@/app/actions/notifications";

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error("Push notifications nisu podržane u ovom browseru");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn("Push notifications nisu podržane");
    return null;
  }

  try {
    // Request permission first
    const permission = await requestNotificationPermission();

    if (permission !== "granted") {
      console.warn("Notifikacije nisu odobrene");
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      const vapidPublicKey = process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"];

      if (!vapidPublicKey) {
        console.error("VAPID public key nije konfigurisan");
        return null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as BufferSource,
      });
    }

    // Save subscription to server
    await saveSubscription(subscription);

    return subscription;
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await deleteSubscription(subscription);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
    return false;
  }
}

/**
 * Show local notification (doesn't require push subscription)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions,
): Promise<void> {
  if (!isPushSupported()) {
    return;
  }

  const permission = await requestNotificationPermission();

  if (permission === "granted") {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
      badge: "/icons/icon-96x96.svg",
      icon: "/icons/icon-192x192.svg",
      tag: "osnovci-notification",
      requireInteraction: false,
      ...options,
    });
  }
}

/**
 * Schedule a notification for later
 */
export function scheduleNotification(
  title: string,
  options: NotificationOptions,
  delayMs: number,
): NodeJS.Timeout {
  return setTimeout(() => {
    showLocalNotification(title, options);
  }, delayMs);
}

/**
 * Save subscription to server
 */
async function saveSubscription(subscription: PushSubscription): Promise<void> {
  try {
    const result = await subscribeToPushAction(subscription.toJSON() as any);
    if (result.error) throw new Error(result.error);
  } catch (error) {
    console.error("Error saving subscription:", error);
    throw error;
  }
}

/**
 * Delete subscription from server
 */
async function deleteSubscription(
  subscription: PushSubscription,
): Promise<void> {
  try {
    const result = await unsubscribeFromPushAction(subscription.endpoint);
    if (result.error) throw new Error(result.error);
  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Notification templates za česte slučajeve
 */
export const notificationTemplates = {
  homeworkReminder: (title: string, dueDate: string) => ({
    title: "Podsetnik: Domaći zadatak! 📚",
    body: `${title} - Rok: ${dueDate}`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    data: { type: "homework_reminder" },
    actions: [
      { action: "view", title: "Pogledaj" },
      { action: "snooze", title: "Podseti me za 1h" },
    ],
  }),

  homeworkSubmitted: (title: string) => ({
    title: "Bravo! 🎉",
    body: `Urađen domaći: ${title}. Dobio si +10 XP!`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    data: { type: "homework_completed" },
  }),

  examReminder: (subject: string, time: string) => ({
    title: "Kontrolni sutra! 📝",
    body: `${subject} - ${time}. Ponovio si?`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    data: { type: "exam_reminder" },
    vibrate: [300, 100, 300, 100, 300],
  }),

  streakMilestone: (days: number) => ({
    title: "Neverovatno! 🔥",
    body: `${days} dana uzastopnog rada! Ti si šampion!`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    data: { type: "streak_milestone" },
  }),

  levelUp: (newLevel: number) => ({
    title: "Level Up! 🎮",
    body: `Čestitamo! Dostigao si Level ${newLevel}!`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    data: { type: "level_up" },
  }),
};

