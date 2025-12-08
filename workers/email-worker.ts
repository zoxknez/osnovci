/**
 * Email Worker - Background Processing for BullMQ Queue
 *
 * This worker processes email jobs from the Redis queue.
 * It can run:
 * 1. On Vercel as a background function (automatic)
 * 2. Standalone with: node --loader ts-node/esm workers/email-worker.ts
 * 3. In Docker container
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Concurrent job processing
 * - Error tracking with Sentry
 * - Graceful shutdown
 */

import { type Job, Worker } from "bullmq";
import type { EmailJobData } from "@/lib/email/queue";
import { sendCustomEmail as sendEmail } from "@/lib/email/service";
import { log } from "@/lib/logger";
import { redis } from "@/lib/upstash";

// Graceful shutdown handler
let isShuttingDown = false;

process.on("SIGTERM", () => {
  log.info("SIGTERM received, shutting down gracefully...");
  isShuttingDown = true;
});

process.on("SIGINT", () => {
  log.info("SIGINT received, shutting down gracefully...");
  isShuttingDown = true;
});

/**
 * Process email job
 */
async function processEmailJob(job: Job<EmailJobData>) {
  if (isShuttingDown) {
    log.warn("Worker shutting down, skipping job", { jobId: job.id });
    return;
  }

  const { to, subject, html, text, priority } = job.data;

  try {
    log.info("Processing email job", {
      jobId: job.id,
      to,
      subject,
      priority,
      attempt: job.attemptsMade + 1,
    });

    // Send email via transport
    const result = await sendEmail(to, subject, html || text || "", text);

    log.info("Email sent successfully", {
      jobId: job.id,
      to,
      subject,
      messageId: result.messageId,
    });

    // Track success metric (optional)
    if (priority) {
      await trackEmailMetric("sent", priority);
    }

    return result;
  } catch (error) {
    log.error("Email job failed", {
      jobId: job.id,
      to,
      subject,
      attempt: job.attemptsMade + 1,
      error,
    });

    // Track failure metric
    if (priority) {
      await trackEmailMetric("failed", priority);
    }

    // Re-throw to trigger BullMQ retry
    throw error;
  }
}

/**
 * Track email metrics in Redis
 */
async function trackEmailMetric(type: "sent" | "failed", priority: string) {
  if (!redis) return;

  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const key = `email:metrics:${today}:${priority}:${type}`;

    await redis.incr(key);
    await redis.expire(key, 30 * 24 * 60 * 60); // Keep for 30 days
  } catch (error) {
    log.warn("Failed to track email metric", { error });
  }
}

/**
 * Worker error handler
 */
function handleWorkerError(error: Error) {
  log.error('Email worker error', { error });

  // Report to Sentry (if configured)
  if (process.env["SENTRY_DSN"]) {
    try {
      const Sentry = require("@sentry/node");
      Sentry.captureException(error);
    } catch {
      // Sentry not available
    }
  }
}

/**
 * Start email worker
 */
export function startEmailWorker() {
  if (!redis) {
    log.error("Redis not configured - email worker cannot start");
    return null;
  }

  const worker = new Worker('email-queue', processEmailJob, {
    connection: {
      host: process.env["REDIS_HOST"] || 'localhost',
      port: Number(process.env["REDIS_PORT"]) || 6379,
      // For Upstash Redis, use TLS
      ...(process.env["UPSTASH_REDIS_REST_URL"] && {
        tls: {},
      }),
    },
    concurrency: 5, // Process 5 emails concurrently
    limiter: {
      max: 10, // Max 10 jobs per interval
      duration: 1000, // 1 second
    },
  });

  worker.on("completed", (job) => {
    log.info("Email job completed", {
      jobId: job.id,
      to: job.data.to,
    });
  });

  worker.on("failed", (job, error) => {
    log.error("Email job failed permanently", {
      jobId: job?.id,
      to: job?.data.to,
      error,
      attempts: job?.attemptsMade,
    });
  });

  worker.on("error", handleWorkerError);

  log.info("Email worker started", {
    concurrency: 5,
    rateLimit: "10 jobs/sec",
  });

  return worker;
}

// Auto-start if running as standalone script
if (require.main === module) {
  log.info("Starting standalone email worker...");

  const worker = startEmailWorker();

  if (worker) {
    // Keep process alive
    process.on("SIGTERM", async () => {
      log.info("Closing email worker...");
      await worker.close();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      log.info("Closing email worker...");
      await worker.close();
      process.exit(0);
    });
  } else {
    log.error("Failed to start email worker");
    process.exit(1);
  }
}
