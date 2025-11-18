/**
 * API Route: Unsubscribe from Push Notifications
 * POST /api/push/unsubscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
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
    const { endpoint } = unsubscribeSchema.parse(body);

    // Delete subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    });

    log.info('Push subscription deleted', {
      userId: session.user.id,
      endpoint,
    });

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription removed',
    });
  } catch (error) {
    log.error('Failed to delete push subscription', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
