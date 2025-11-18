/**
 * API Route: Send Push Notification
 * POST /api/push/send
 * 
 * Send push notifications to users
 * Only accessible by admins/system
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import webpush from 'web-push';

// Configure web-push
const vapidPublicKey = process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY'];
const vapidPrivateKey = process.env['VAPID_PRIVATE_KEY'];
const vapidSubject = process.env['VAPID_SUBJECT'] || 'mailto:kontakt@osnovci.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('[Push] VAPID keys not configured - push notifications disabled');
}

const notificationSchema = z.object({
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  icon: z.string().optional(),
  url: z.string().optional(),
  requireInteraction: z.boolean().optional(),
  actions: z.array(z.object({
    action: z.string(),
    title: z.string(),
    icon: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Only admins can send push notifications
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const notification = notificationSchema.parse(body);

    // Determine target users
    let targetUserIds: string[] = [];
    if (notification.userId) {
      targetUserIds = [notification.userId];
    } else if (notification.userIds) {
      targetUserIds = notification.userIds;
    } else {
      return NextResponse.json(
        { error: 'Must specify userId or userIds' },
        { status: 400 }
      );
    }

    // Get push subscriptions for target users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: targetUserIds },
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions found',
        sent: 0,
      });
    }

    // Prepare push payload
    const pushPayload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.svg',
      url: notification.url || '/',
      requireInteraction: notification.requireInteraction || false,
      actions: notification.actions || [],
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          );

          // Update lastUsed timestamp
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { lastUsed: new Date() },
          });

          return { success: true, subscriptionId: sub.id };
        } catch (error: any) {
          // Handle expired/invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired - delete it
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
            
            log.warn('Push subscription expired and removed', {
              subscriptionId: sub.id,
              userId: sub.userId,
            });
          }

          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    log.info('Push notifications sent', {
      targetUsers: targetUserIds.length,
      subscriptions: subscriptions.length,
      successful,
      failed,
    });

    return NextResponse.json({
      success: true,
      message: 'Push notifications sent',
      sent: successful,
      failed,
      totalSubscriptions: subscriptions.length,
    });
  } catch (error) {
    log.error('Failed to send push notification', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid notification data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
