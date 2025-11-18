// Notification Preferences System - Granular Control per Event Type
// Manage user preferences for email, push, and in-app notifications

import { NotificationChannel, NotificationEventType } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { log } from "@/lib/logger";

// ============================================
// DEFAULT PREFERENCES
// ============================================

/**
 * Default notification preferences for new users
 * All channels enabled by default, can be customized per event
 */
export const DEFAULT_PREFERENCES: Record<
  NotificationEventType,
  {
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }
> = {
  // Homework events - High priority
  HOMEWORK_ASSIGNED: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },
  HOMEWORK_DUE_SOON: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },
  HOMEWORK_OVERDUE: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },
  HOMEWORK_SUBMITTED: {
    emailEnabled: true, // For guardians
    pushEnabled: false,
    inAppEnabled: true,
  },
  HOMEWORK_REVIEWED: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },

  // Grade events - High priority
  GRADE_ADDED: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },
  GRADE_UPDATED: {
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
  },

  // Schedule events - Medium priority
  SCHEDULE_CHANGED: {
    emailEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
  },
  EVENT_REMINDER: {
    emailEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
  },

  // Family events - Medium priority
  LINK_REQUEST: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },
  LINK_APPROVED: {
    emailEnabled: false,
    pushEnabled: false,
    inAppEnabled: true,
  },

  // Safety & moderation - Critical priority
  CONTENT_MODERATION: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },
  SAFETY_ALERT: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },

  // Account events - Security priority
  LOGIN_NEW_DEVICE: {
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
  },
  PASSWORD_CHANGED: {
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
  },
  TWO_FACTOR_ENABLED: {
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
  },
};

// ============================================
// GET PREFERENCES
// ============================================

/**
 * Get notification preferences for a user
 * Creates defaults if none exist
 */
export async function getNotificationPreferences(userId: string) {
  try {
    let preferences = await prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { eventType: "asc" },
    });

    // Create defaults if no preferences exist
    if (preferences.length === 0) {
      preferences = await createDefaultPreferences(userId);
    }

    return preferences;
  } catch (error) {
    log.error("Error fetching notification preferences", error, { userId });
    return [];
  }
}

/**
 * Get preference for specific event type
 */
export async function getPreferenceForEvent(
  userId: string,
  eventType: NotificationEventType,
) {
  try {
    let preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_eventType: { userId, eventType },
      },
    });

    // Create default if doesn't exist
    if (!preference) {
      const defaults = DEFAULT_PREFERENCES[eventType];
      preference = await prisma.notificationPreference.create({
        data: {
          userId,
          eventType,
          ...defaults,
        },
      });
    }

    return preference;
  } catch (error) {
    log.error("Error fetching event preference", error, { userId, eventType });
    return null;
  }
}

/**
 * Check if notification should be sent via specific channel
 */
export async function shouldNotify(
  userId: string,
  eventType: NotificationEventType,
  channel: NotificationChannel,
): Promise<boolean> {
  try {
    const preference = await getPreferenceForEvent(userId, eventType);

    if (!preference) {
      // Fallback to defaults if preference not found
      const defaults = DEFAULT_PREFERENCES[eventType];
      switch (channel) {
        case NotificationChannel.EMAIL:
          return defaults.emailEnabled;
        case NotificationChannel.PUSH:
          return defaults.pushEnabled;
        case NotificationChannel.IN_APP:
          return defaults.inAppEnabled;
        default:
          return false;
      }
    }

    // Check quiet hours (if configured)
    if (preference.quietHoursStart && preference.quietHoursEnd) {
      const now = new Date();
      const currentHour = now.getHours();
      const start = preference.quietHoursStart;
      const end = preference.quietHoursEnd;

      // Handle quiet hours spanning midnight
      const isQuietTime =
        start < end
          ? currentHour >= start && currentHour < end
          : currentHour >= start || currentHour < end;

      if (isQuietTime) {
        // During quiet hours, only allow in-app notifications
        if (channel !== NotificationChannel.IN_APP) {
          return false;
        }
      }
    }

    // Check channel-specific preference
    switch (channel) {
      case NotificationChannel.EMAIL:
        return preference.emailEnabled;
      case NotificationChannel.PUSH:
        return preference.pushEnabled;
      case NotificationChannel.IN_APP:
        return preference.inAppEnabled;
      default:
        return false;
    }
  } catch (error) {
    log.error("Error checking notification preference", error, {
      userId,
      eventType,
      channel,
    });
    return false;
  }
}

// ============================================
// UPDATE PREFERENCES
// ============================================

export interface UpdatePreferenceParams {
  userId: string;
  eventType: NotificationEventType;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  quietHoursStart?: number | null;
  quietHoursEnd?: number | null;
  digest?: boolean;
  instantOnly?: boolean;
}

/**
 * Update notification preference for specific event type
 */
export async function updateNotificationPreference({
  userId,
  eventType,
  emailEnabled,
  pushEnabled,
  inAppEnabled,
  quietHoursStart,
  quietHoursEnd,
  digest,
  instantOnly,
}: UpdatePreferenceParams) {
  try {
    // Validate quiet hours
    if (quietHoursStart !== undefined && quietHoursStart !== null) {
      if (quietHoursStart < 0 || quietHoursStart > 23) {
        return {
          success: false,
          error: "Invalid quiet hours start (must be 0-23)",
        };
      }
    }
    if (quietHoursEnd !== undefined && quietHoursEnd !== null) {
      if (quietHoursEnd < 0 || quietHoursEnd > 23) {
        return { success: false, error: "Invalid quiet hours end (must be 0-23)" };
      }
    }

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_eventType: { userId, eventType },
      },
      update: {
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(inAppEnabled !== undefined && { inAppEnabled }),
        ...(quietHoursStart !== undefined && { quietHoursStart }),
        ...(quietHoursEnd !== undefined && { quietHoursEnd }),
        ...(digest !== undefined && { digest }),
        ...(instantOnly !== undefined && { instantOnly }),
      },
      create: {
        userId,
        eventType,
        emailEnabled: emailEnabled ?? DEFAULT_PREFERENCES[eventType].emailEnabled,
        pushEnabled: pushEnabled ?? DEFAULT_PREFERENCES[eventType].pushEnabled,
        inAppEnabled: inAppEnabled ?? DEFAULT_PREFERENCES[eventType].inAppEnabled,
        quietHoursStart: quietHoursStart ?? null,
        quietHoursEnd: quietHoursEnd ?? null,
        digest: digest ?? false,
        instantOnly: instantOnly ?? false,
      },
    });

    log.info("Notification preference updated", {
      userId,
      eventType,
      preferenceId: preference.id,
    });

    return { success: true, preference };
  } catch (error) {
    log.error("Error updating notification preference", error, {
      userId,
      eventType,
    });
    return { success: false, error: "Failed to update preference" };
  }
}

/**
 * Bulk update preferences (e.g., disable all email notifications)
 */
export async function bulkUpdatePreferences(
  userId: string,
  updates: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
  },
) {
  try {
    const result = await prisma.notificationPreference.updateMany({
      where: { userId },
      data: updates,
    });

    log.info("Bulk preference update", {
      userId,
      updatedCount: result.count,
      updates,
    });

    return { success: true, count: result.count };
  } catch (error) {
    log.error("Error bulk updating preferences", error, { userId });
    return { success: false, error: "Failed to bulk update" };
  }
}

// ============================================
// CREATE DEFAULTS
// ============================================

/**
 * Create default preferences for all event types
 */
export async function createDefaultPreferences(userId: string) {
  try {
    const preferences = await prisma.$transaction(
      Object.entries(DEFAULT_PREFERENCES).map(([eventType, defaults]) =>
        prisma.notificationPreference.create({
          data: {
            userId,
            eventType: eventType as NotificationEventType,
            ...defaults,
          },
        }),
      ),
    );

    log.info("Default notification preferences created", {
      userId,
      count: preferences.length,
    });

    return preferences;
  } catch (error) {
    log.error("Error creating default preferences", error, { userId });
    return [];
  }
}

// ============================================
// DELETE PREFERENCES
// ============================================

/**
 * Delete all preferences for a user (cleanup on account deletion)
 */
export async function deleteUserPreferences(userId: string) {
  try {
    const result = await prisma.notificationPreference.deleteMany({
      where: { userId },
    });

    log.info("User notification preferences deleted", {
      userId,
      deletedCount: result.count,
    });

    return { success: true, count: result.count };
  } catch (error) {
    log.error("Error deleting user preferences", error, { userId });
    return { success: false, error: "Failed to delete preferences" };
  }
}

// ============================================
// GROUPED PREFERENCES (for UI)
// ============================================

export interface GroupedPreferences {
  homework: Array<{
    eventType: NotificationEventType;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }>;
  grades: Array<{
    eventType: NotificationEventType;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }>;
  schedule: Array<{
    eventType: NotificationEventType;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }>;
  family: Array<{
    eventType: NotificationEventType;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }>;
  safety: Array<{
    eventType: NotificationEventType;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }>;
  account: Array<{
    eventType: NotificationEventType;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }>;
}

/**
 * Get preferences grouped by category for easier UI display
 */
export async function getGroupedPreferences(
  userId: string,
): Promise<GroupedPreferences> {
  const preferences = await getNotificationPreferences(userId);

  const grouped: GroupedPreferences = {
    homework: [],
    grades: [],
    schedule: [],
    family: [],
    safety: [],
    account: [],
  };

  for (const pref of preferences) {
    const item = {
      eventType: pref.eventType,
      emailEnabled: pref.emailEnabled,
      pushEnabled: pref.pushEnabled,
      inAppEnabled: pref.inAppEnabled,
    };

    if (pref.eventType.startsWith("HOMEWORK_")) {
      grouped.homework.push(item);
    } else if (pref.eventType.startsWith("GRADE_")) {
      grouped.grades.push(item);
    } else if (
      pref.eventType.startsWith("SCHEDULE_") ||
      pref.eventType.startsWith("EVENT_")
    ) {
      grouped.schedule.push(item);
    } else if (pref.eventType.startsWith("LINK_")) {
      grouped.family.push(item);
    } else if (
      pref.eventType === "CONTENT_MODERATION" ||
      pref.eventType === "SAFETY_ALERT"
    ) {
      grouped.safety.push(item);
    } else {
      grouped.account.push(item);
    }
  }

  return grouped;
}
