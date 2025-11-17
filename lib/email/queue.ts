/**
 * Email Queue System - BullMQ with Redis
 * Reliable email delivery with retry logic and failure handling
 * 
 * Features:
 * - Automatic retries with exponential backoff
 * - Failed job persistence for debugging
 * - Priority queue support
 * - Rate limiting (prevent spam)
 * - Email templates
 * 
 * Production: Requires Redis (Upstash or self-hosted)
 */

import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { log } from '@/lib/logger';
import { createTransporter } from '../email/transporter';

// Redis connection
const redisConnection = process.env['UPSTASH_REDIS_REST_URL']
  ? new Redis(process.env['UPSTASH_REDIS_REST_URL'])
  : null;

if (!redisConnection && typeof window === 'undefined') {
  log.warn('Redis not configured - email queue disabled (emails will be sent synchronously)');
}

// Email job data interface
export interface EmailJobData {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
  replyTo?: string;
  priority?: 'low' | 'normal' | 'high';
}

// Create queue
export const emailQueue = redisConnection
  ? new Queue<EmailJobData>('emails', { connection: redisConnection })
  : null;

/**
 * Add email to queue
 */
export async function queueEmail(
  emailData: EmailJobData
): Promise<{ queued: boolean; jobId?: string; sentImmediately?: boolean }> {
  if (!emailQueue) {
    // Fallback: Send immediately if queue not available
    log.warn('Email queue not available - sending synchronously');
    
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: emailData.from || process.env['EMAIL_FROM'] || 'noreply@osnovci.app',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });
      
      return { queued: false, sentImmediately: true };
    } catch (error) {
      log.error('Failed to send email synchronously', { error, to: emailData.to });
      throw error;
    }
  }

  // Add to queue with priority and retry config
  const job = await emailQueue.add(
    'send-email',
    emailData,
    {
      attempts: 5, // 5 retry attempts
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2s, then 4s, 8s, 16s, 32s
      },
      priority: emailData.priority === 'high' ? 1 : emailData.priority === 'low' ? 3 : 2,
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep max 1000 completed jobs
      },
      removeOnFail: false, // Keep failed jobs for debugging
    }
  );

  log.info('Email queued', {
    jobId: job.id,
    to: emailData.to,
    priority: emailData.priority || 'normal',
  });

  return {
    queued: true,
    ...(job.id && { jobId: job.id }),
  };
}

/**
 * Process email queue (worker)
 * Run this in a separate process or serverless function
 */
export const emailWorker = redisConnection
  ? new Worker<EmailJobData>(
      'emails',
      async (job: Job<EmailJobData>) => {
        const { to, subject, text, html, from, replyTo } = job.data;

        log.info('Processing email job', {
          jobId: job.id,
          to,
          attempt: job.attemptsMade + 1,
        });

        const transporter = createTransporter();

        try {
          const info = await transporter.sendMail({
            from: from || process.env['EMAIL_FROM'] || 'noreply@osnovci.app',
            to,
            subject,
            text,
            html,
            replyTo,
          });

          log.info('Email sent successfully', {
            jobId: job.id,
            to,
            messageId: info.messageId,
          });

          return { success: true, messageId: info.messageId };
        } catch (error) {
          log.error('Email sending failed', {
            jobId: job.id,
            to,
            attempt: job.attemptsMade + 1,
            error,
          });

          throw error; // Trigger retry
        }
      },
      {
        connection: redisConnection,
        concurrency: 5, // Process 5 emails concurrently
        limiter: {
          max: 10, // Max 10 emails
          duration: 1000, // per second (rate limiting)
        },
      }
    )
  : null;

// Worker event handlers
if (emailWorker) {
  emailWorker.on('completed', (job) => {
    log.info('Email job completed', {
      jobId: job.id,
      to: job.data.to,
    });
  });

  emailWorker.on('failed', (job, error) => {
    log.error('Email job failed after all retries', {
      jobId: job?.id,
      to: job?.data.to,
      attempts: job?.attemptsMade,
      error,
    });

    // TODO: Send notification to admin about failed emails
    // Could store in database for manual retry or investigation
  });

  emailWorker.on('error', (error) => {
    log.error('Email worker error', { error });
  });
}

/**
 * Get queue statistics
 */
export async function getEmailQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  if (!emailQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  const counts = await emailQueue.getJobCounts();

  return {
    waiting: counts['waiting'] || 0,
    active: counts['active'] || 0,
    completed: counts['completed'] || 0,
    failed: counts['failed'] || 0,
    delayed: counts['delayed'] || 0,
  };
}

/**
 * Get failed jobs for investigation
 */
export async function getFailedEmails(limit = 10): Promise<Array<{
  id: string;
  to: string;
  subject: string;
  attempts: number;
  failedReason: string;
  timestamp: Date;
}>> {
  if (!emailQueue) return [];

  const failedJobs = await emailQueue.getFailed(0, limit);

  return failedJobs.map(job => ({
    id: job.id || 'unknown',
    to: job.data.to,
    subject: job.data.subject,
    attempts: job.attemptsMade,
    failedReason: job.failedReason || 'Unknown',
    timestamp: new Date(job.timestamp),
  }));
}

/**
 * Retry failed email by ID
 */
export async function retryFailedEmail(jobId: string): Promise<boolean> {
  if (!emailQueue) return false;

  try {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.retry();
      log.info('Email job retried manually', { jobId });
      return true;
    }
    return false;
  } catch (error) {
    log.error('Failed to retry email job', { error, jobId });
    return false;
  }
}

/**
 * Clean old completed jobs (run periodically)
 */
export async function cleanOldJobs(): Promise<number> {
  if (!emailQueue) return 0;

  try {
    const cleaned = await emailQueue.clean(24 * 3600 * 1000, 1000, 'completed');
    log.info('Old email jobs cleaned', { count: cleaned.length });
    return cleaned.length;
  } catch (error) {
    log.error('Failed to clean old jobs', { error });
    return 0;
  }
}
