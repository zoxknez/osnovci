// Notification Preferences API - CRUD for user preferences

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NotificationEventType } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import {
  bulkUpdatePreferences,
  getGroupedPreferences,
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/notifications/preferences";
import prisma from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

// ============================================
// GET - Fetch user's notification preferences
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if grouped view is requested
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get("grouped") === "true";

    if (grouped) {
      const preferences = await getGroupedPreferences(user.id);
      return NextResponse.json({ success: true, preferences });
    }

    // Return flat list
    const preferences = await getNotificationPreferences(user.id);
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    log.error("Error fetching notification preferences", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

// ============================================
// POST - Update single preference
// ============================================

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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "notification-preferences",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers },
      );
    }

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validated = updatePreferenceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    // Update preference
    const { eventType, ...updates } = validated.data;
    const result = await updateNotificationPreference({
      userId: user.id,
      eventType,
      ...(updates.emailEnabled !== undefined && { emailEnabled: updates.emailEnabled }),
      ...(updates.pushEnabled !== undefined && { pushEnabled: updates.pushEnabled }),
      ...(updates.inAppEnabled !== undefined && { inAppEnabled: updates.inAppEnabled }),
      ...(updates.quietHoursStart !== undefined && { quietHoursStart: updates.quietHoursStart }),
      ...(updates.quietHoursEnd !== undefined && { quietHoursEnd: updates.quietHoursEnd }),
      ...(updates.digest !== undefined && { digest: updates.digest }),
      ...(updates.instantOnly !== undefined && { instantOnly: updates.instantOnly }),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update preference" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      preference: result.preference,
    });
  } catch (error) {
    log.error("Error updating notification preference", error);
    return NextResponse.json(
      { error: "Failed to update preference" },
      { status: 500 },
    );
  }
}

// ============================================
// PATCH - Bulk update preferences
// ============================================

const bulkUpdateSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "notification-preferences-bulk",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers },
      );
    }

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validated = bulkUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    // Bulk update (filter out undefined values)
    const updates: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      inAppEnabled?: boolean;
    } = {};
    
    if (validated.data.emailEnabled !== undefined) {
      updates.emailEnabled = validated.data.emailEnabled;
    }
    if (validated.data.pushEnabled !== undefined) {
      updates.pushEnabled = validated.data.pushEnabled;
    }
    if (validated.data.inAppEnabled !== undefined) {
      updates.inAppEnabled = validated.data.inAppEnabled;
    }
    
    const result = await bulkUpdatePreferences(user.id, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to bulk update" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} preferences`,
      count: result.count,
    });
  } catch (error) {
    log.error("Error bulk updating preferences", error);
    return NextResponse.json(
      { error: "Failed to bulk update" },
      { status: 500 },
    );
  }
}

// ============================================
// PUT - Reset to defaults
// ============================================

export async function PUT() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete existing preferences
    await prisma.notificationPreference.deleteMany({
      where: { userId: user.id },
    });

    // Create defaults
    const { createDefaultPreferences } = await import(
      "@/lib/notifications/preferences"
    );
    const preferences = await createDefaultPreferences(user.id);

    log.info("Notification preferences reset to defaults", {
      userId: user.id,
      count: preferences.length,
    });

    return NextResponse.json({
      success: true,
      message: "Preferences reset to defaults",
      preferences,
    });
  } catch (error) {
    log.error("Error resetting preferences to defaults", error);
    return NextResponse.json(
      { error: "Failed to reset preferences" },
      { status: 500 },
    );
  }
}
