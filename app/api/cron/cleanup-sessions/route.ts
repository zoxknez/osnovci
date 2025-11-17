/**
 * Cron Jobs - Automated Maintenance Tasks
 * 
 * Handles:
 * - Session cleanup (expired sessions)
 * - Weekly/Monthly XP resets
 * - Temporary file cleanup
 * - Database optimization
 * 
 * Deploy to Vercel: Add to vercel.json
 * Alternative: Use node-cron for self-hosted
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/auth/session-manager';
import { log } from '@/lib/logger';

// Security: Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env['CRON_SECRET'];

  if (!secret) {
    log.error('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${secret}`;
}

/**
 * Cleanup expired sessions
 * Run: Every 6 hours
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    log.info('Cron job started: cleanup-sessions');

    const deletedCount = await cleanupExpiredSessions();

    log.info('Cron job completed: cleanup-sessions', {
      deletedSessions: deletedCount,
    });

    return NextResponse.json({
      success: true,
      deletedSessions: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Cron job failed: cleanup-sessions', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
