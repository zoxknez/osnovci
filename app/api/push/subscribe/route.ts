/**
 * API Route: Subscribe to Push Notifications
 * POST /api/push/subscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const subscription = subscriptionSchema.parse(body);

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      // Update existing subscription
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          lastUsed: new Date(),
        },
      });

      log.info('Push subscription updated', {
        userId: session.user.id,
        endpoint: subscription.endpoint,
      });
    } else {
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

      log.info('Push subscription created', {
        userId: session.user.id,
        endpoint: subscription.endpoint,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription saved',
    });
  } catch (error) {
    log.error('Failed to save push subscription', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
