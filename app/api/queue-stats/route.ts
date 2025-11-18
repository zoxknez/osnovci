/**
 * Queue Statistics API Endpoint
 * Provides real-time queue metrics for monitoring
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getAllQueueStats } from '@/lib/queue/bullmq-config';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/queue-stats
 * Get statistics for all queues
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can view queue stats
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all queue statistics
    const stats = await getAllQueueStats();

    log.info('Queue stats retrieved', { userId: session.user.id });

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Failed to get queue stats', error as Error);
    
    return NextResponse.json(
      {
        error: 'Failed to get queue statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
