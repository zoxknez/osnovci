"use server";

import { NotificationEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  bulkUpdatePreferences,
  createDefaultPreferences,
  getGroupedPreferences,
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/notifications/preferences";

export type ActionState = {
  success?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  data?: any;
};

export async function getNotificationsAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
        count: notifications.length,
      },
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return { error: "Greška prilikom učitavanja notifikacija" };
  }
}

export async function markNotificationsAsReadAction(
  notificationIds: string[],
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return { error: "Greška prilikom označavanja notifikacija" };
  }
}

export async function getNotificationPreferencesAction(
  grouped: boolean = false,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    if (grouped) {
      const preferences = await getGroupedPreferences(session.user.id);
      return { success: true, data: preferences };
    }

    const preferences = await getNotificationPreferences(session.user.id);
    return { success: true, data: preferences };
  } catch (error) {
    console.error("Get preferences error:", error);
    return { error: "Greška prilikom učitavanja podešavanja" };
  }
}

const updatePreferenceSchema = z.object({
  eventType: z.nativeEnum(NotificationEventType),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  quietHoursStart: z.number().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().min(0).max(23).nullable().optional(),
  digest: z.boolean().optional(),
  instantOnly: z.boolean().optional(),
});

export async function updateNotificationPreferenceAction(
  data: z.infer<typeof updatePreferenceSchema>,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = updatePreferenceSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  try {
    const { eventType, ...updates } = validated.data;
    // Filter out undefined values
    const filteredUpdates: Record<string, boolean | number | null> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    const result = await updateNotificationPreference({
      userId: session.user.id,
      eventType,
      ...filteredUpdates,
    } as Parameters<typeof updateNotificationPreference>[0]);

    if (!result.success) {
      return { error: result.error || "Greška prilikom ažuriranja" };
    }

    revalidatePath("/podesavanja/notifikacije");
    return { success: true, data: result.preference };
  } catch (error) {
    console.error("Update preference error:", error);
    return { error: "Greška prilikom ažuriranja podešavanja" };
  }
}

const bulkUpdateSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});

export async function bulkUpdateNotificationPreferencesAction(
  data: z.infer<typeof bulkUpdateSchema>,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = bulkUpdateSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  try {
    // Filter out undefined values
    const filteredData: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      inAppEnabled?: boolean;
    } = {};
    if (validated.data.emailEnabled !== undefined)
      filteredData.emailEnabled = validated.data.emailEnabled;
    if (validated.data.pushEnabled !== undefined)
      filteredData.pushEnabled = validated.data.pushEnabled;
    if (validated.data.inAppEnabled !== undefined)
      filteredData.inAppEnabled = validated.data.inAppEnabled;

    const result = await bulkUpdatePreferences(session.user.id, filteredData);

    if (!result.success) {
      return { error: result.error || "Greška prilikom ažuriranja" };
    }

    revalidatePath("/podesavanja/notifikacije");
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error("Bulk update error:", error);
    return { error: "Greška prilikom ažuriranja podešavanja" };
  }
}

export async function resetNotificationPreferencesAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    await prisma.notificationPreference.deleteMany({
      where: { userId: session.user.id },
    });

    const preferences = await createDefaultPreferences(session.user.id);

    revalidatePath("/podesavanja/notifikacije");
    return { success: true, data: preferences };
  } catch (error) {
    console.error("Reset preferences error:", error);
    return { error: "Greška prilikom resetovanja podešavanja" };
  }
}

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function subscribeToPushAction(
  data: z.infer<typeof SubscriptionSchema>,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = SubscriptionSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: validated.data.endpoint },
      update: {
        userId: session.user.id,
        p256dh: validated.data.keys.p256dh,
        auth: validated.data.keys.auth,
        isActive: true,
        lastUsed: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: validated.data.endpoint,
        p256dh: validated.data.keys.p256dh,
        auth: validated.data.keys.auth,
        isActive: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Subscribe push error:", error);
    return { error: "Greška prilikom prijave na notifikacije" };
  }
}

export async function unsubscribeFromPushAction(
  endpoint: string,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: endpoint,
        userId: session.user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Unsubscribe push error:", error);
    return { error: "Greška prilikom odjave sa notifikacija" };
  }
}
