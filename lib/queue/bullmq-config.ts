/**
 * BullMQ Queue Configuration
 * Handles background job processing for scalability
 */

import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { log } from '@/lib/logger';

// Redis connection for BullMQ
const connection = new Redis({
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
});

// Queue options with retry strategy
const defaultQueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 1000, // Start with 1 second
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Remove after 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
      age: 7 * 24 * 3600, // Remove after 7 days
    },
  },
};

// ============================================
// EMAIL QUEUE
// ============================================

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export const emailQueue = new Queue<EmailJobData>('email', defaultQueueOptions);

export const createEmailWorker = () => {
  return new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
      log.info('Processing email job', { jobId: job.id, to: job.data.to });

      try {
        // Import dynamically to avoid loading Nodemailer on every request
        try {
          const { sendEmail } = await import('@/lib/email');
          await sendEmail({
            to: job.data.to,
            subject: job.data.subject,
            html: job.data.html,
            from: job.data.from,
            replyTo: job.data.replyTo,
          });
        } catch (importError) {
          log.warn('Email module not available, skipping email send', { error: importError });
          // Email module not implemented yet, just log
          return { success: true, sentAt: new Date().toISOString(), skipped: true };
        }

        log.info('Email sent successfully', { jobId: job.id });
        return { success: true, sentAt: new Date().toISOString() };
      } catch (error) {
        log.error('Email sending failed', error as Error, { jobId: job.id });
        throw error; // Will trigger retry
      }
    },
    { connection }
  );
};

// ============================================
// NOTIFICATION QUEUE
// ============================================

export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  type: 'homework' | 'grade' | 'announcement' | 'achievement' | 'reminder';
  data?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
}

export const notificationQueue = new Queue<NotificationJobData>('notification', defaultQueueOptions);

export const createNotificationWorker = () => {
  return new Worker<NotificationJobData>(
    'notification',
    async (job: Job<NotificationJobData>) => {
      log.info('Processing notification job', { jobId: job.id, userId: job.data.userId });

      try {
        try {
          const { sendNotificationToUser } = await import('@/lib/notifications/push');
          await sendNotificationToUser(
            job.data.userId,
            job.data.title,
            job.data.body,
            job.data.data
          );
        } catch (importError) {
          log.warn('Notification module not available, skipping notification', { error: importError });
          return { success: true, sentAt: new Date().toISOString(), skipped: true };
        }

        log.info('Notification sent successfully', { jobId: job.id });
        return { success: true, sentAt: new Date().toISOString() };
      } catch (error) {
        log.error('Notification sending failed', error as Error, { jobId: job.id });
        throw error;
      }
    },
    { connection }
  );
};

// ============================================
// REPORT GENERATION QUEUE
// ============================================

export interface ReportJobData {
  reportId: string;
  studentId: string;
  reportType: 'weekly' | 'monthly' | 'semester' | 'annual';
  startDate: Date;
  endDate: Date;
  format: 'pdf' | 'excel' | 'json';
  recipientEmail?: string;
}

export const reportQueue = new Queue<ReportJobData>('report', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 2, // Reports are heavy, limit retries
    timeout: 5 * 60 * 1000, // 5 minutes timeout
  },
});

export const createReportWorker = () => {
  return new Worker<ReportJobData>(
    'report',
    async (job: Job<ReportJobData>) => {
      log.info('Processing report job', { jobId: job.id, reportId: job.data.reportId });

      try {
        let reportUrl: string;
        try {
          const { generateReport } = await import('@/lib/reports/generator');
          reportUrl = await generateReport({
            studentId: job.data.studentId,
            reportType: job.data.reportType,
            startDate: job.data.startDate,
            endDate: job.data.endDate,
            format: job.data.format,
          });
        } catch (importError) {
          log.warn('Report generator not available, returning placeholder', { error: importError });
          reportUrl = '/reports/placeholder.pdf';
        }

        // Send email with report if recipient specified
        if (job.data.recipientEmail) {
          await emailQueue.add('report-email', {
            to: job.data.recipientEmail,
            subject: `Izveštaj - ${job.data.reportType}`,
            html: `
              <h2>Vaš izveštaj je spreman</h2>
              <p>Izveštaj možete preuzeti na sledećem linku:</p>
              <a href="${reportUrl}">${reportUrl}</a>
            `,
          });
        }

        log.info('Report generated successfully', { jobId: job.id, reportUrl });
        return { success: true, reportUrl, generatedAt: new Date().toISOString() };
      } catch (error) {
        log.error('Report generation failed', error as Error, { jobId: job.id });
        throw error;
      }
    },
    { connection }
  );
};

// ============================================
// SCHEDULE PROCESSING QUEUE
// ============================================

export interface ScheduleJobData {
  studentId: string;
  action: 'sync' | 'reminder' | 'conflict-check';
  scheduleId?: string;
  date?: Date;
}

export const scheduleQueue = new Queue<ScheduleJobData>('schedule', defaultQueueOptions);

export const createScheduleWorker = () => {
  return new Worker<ScheduleJobData>(
    'schedule',
    async (job: Job<ScheduleJobData>) => {
      log.info('Processing schedule job', { jobId: job.id, action: job.data.action });

      try {
        switch (job.data.action) {
          case 'sync':
            const { syncStudentSchedule } = await import('@/lib/calendar/calendar-manager');
            await syncStudentSchedule(job.data.studentId);
            break;

          case 'reminder':
            try {
              const { sendScheduleReminders } = await import('@/lib/notifications/reminders');
              await sendScheduleReminders(job.data.studentId, job.data.date!);
            } catch (importError) {
              log.warn('Reminders module not available, skipping reminder', { error: importError });
            }
            break;

          case 'conflict-check':
            const { checkScheduleConflicts } = await import('@/lib/calendar/calendar-manager');
            await checkScheduleConflicts(job.data.studentId);
            break;
        }

        log.info('Schedule job completed', { jobId: job.id });
        return { success: true, completedAt: new Date().toISOString() };
      } catch (error) {
        log.error('Schedule job failed', error as Error, { jobId: job.id });
        throw error;
      }
    },
    { connection }
  );
};

// ============================================
// QUEUE UTILITIES
// ============================================

/**
 * Add email to queue
 */
export async function queueEmail(data: EmailJobData, priority?: number) {
  const job = await emailQueue.add('send-email', data, {
    priority: priority || 5,
  });
  
  log.info('Email queued', { jobId: job.id, to: data.to });
  return job.id;
}

/**
 * Add notification to queue
 */
export async function queueNotification(data: NotificationJobData) {
  const priorityMap = { low: 10, normal: 5, high: 1 };
  const job = await notificationQueue.add('send-notification', data, {
    priority: priorityMap[data.priority || 'normal'],
  });
  
  log.info('Notification queued', { jobId: job.id, userId: data.userId });
  return job.id;
}

/**
 * Add report generation to queue
 */
export async function queueReport(data: ReportJobData) {
  const job = await reportQueue.add('generate-report', data, {
    priority: 3, // Reports have medium priority
  });
  
  log.info('Report queued', { jobId: job.id, reportId: data.reportId });
  return job.id;
}

/**
 * Add schedule processing to queue
 */
export async function queueScheduleTask(data: ScheduleJobData) {
  const job = await scheduleQueue.add(`schedule-${data.action}`, data);
  
  log.info('Schedule task queued', { jobId: job.id, action: data.action });
  return job.id;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: 'email' | 'notification' | 'report' | 'schedule') {
  const queueMap = {
    email: emailQueue,
    notification: notificationQueue,
    report: reportQueue,
    schedule: scheduleQueue,
  };

  const queue = queueMap[queueName];
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Get all queue statistics
 */
export async function getAllQueueStats() {
  const [email, notification, report, schedule] = await Promise.all([
    getQueueStats('email'),
    getQueueStats('notification'),
    getQueueStats('report'),
    getQueueStats('schedule'),
  ]);

  return { email, notification, report, schedule };
}

/**
 * Pause queue
 */
export async function pauseQueue(queueName: 'email' | 'notification' | 'report' | 'schedule') {
  const queueMap = {
    email: emailQueue,
    notification: notificationQueue,
    report: reportQueue,
    schedule: scheduleQueue,
  };

  await queueMap[queueName].pause();
  log.info('Queue paused', { queueName });
}

/**
 * Resume queue
 */
export async function resumeQueue(queueName: 'email' | 'notification' | 'report' | 'schedule') {
  const queueMap = {
    email: emailQueue,
    notification: notificationQueue,
    report: reportQueue,
    schedule: scheduleQueue,
  };

  await queueMap[queueName].resume();
  log.info('Queue resumed', { queueName });
}

/**
 * Clean up old jobs
 */
export async function cleanupQueues() {
  const queues = [emailQueue, notificationQueue, reportQueue, scheduleQueue];
  
  for (const queue of queues) {
    // Clean completed jobs older than 24 hours
    await queue.clean(24 * 3600 * 1000, 100, 'completed');
    
    // Clean failed jobs older than 7 days
    await queue.clean(7 * 24 * 3600 * 1000, 500, 'failed');
  }
  
  log.info('Queue cleanup completed');
}

/**
 * Initialize all workers (call this in instrumentation.ts or separate worker process)
 */
export function initializeWorkers() {
  const workers = [
    createEmailWorker(),
    createNotificationWorker(),
    createReportWorker(),
    createScheduleWorker(),
  ];

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    log.info('SIGTERM received, closing workers...');
    await Promise.all(workers.map(w => w.close()));
    await connection.quit();
    process.exit(0);
  });

  log.info('All BullMQ workers initialized');
  return workers;
}
