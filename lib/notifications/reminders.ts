/**
 * Notification Reminders Module - Server-side stubs
 * Client-side notification logic handled by push.ts
 */

import { log } from '@/lib/logger';

/**
 * Schedule reminder stub - triggers client-side notification
 */
export async function sendScheduleReminders(
  studentId: string,
  date: Date
): Promise<void> {
  log.info('Schedule reminder triggered', { studentId, date });
  // Client-side handling via service worker
}

/**
 * Homework reminder stub - triggers client-side notification
 */
export async function sendHomeworkReminders(studentId: string): Promise<void> {
  log.info('Homework reminder triggered', { studentId });
  // Client-side handling via service worker
}

/**
 * Daily digest stub - triggers client-side notification
 */
export async function sendDailyDigest(studentId: string): Promise<void> {
  log.info('Daily digest triggered', { studentId });
  // Client-side handling via service worker
}
