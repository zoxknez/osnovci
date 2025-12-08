"use server";

import { z } from "zod";
import { log } from "@/lib/logger";
import { captureMessage } from "@/lib/monitoring/sentry-utils";

const feedbackSchema = z.object({
  error: z.string().optional(),
  stack: z.string().optional(),
  feedback: z.string().min(1).max(1000),
  url: z.string().url(),
  timestamp: z.string(),
});

type FeedbackInput = z.infer<typeof feedbackSchema>;

export async function submitErrorFeedbackAction(data: FeedbackInput) {
  try {
    const validated = feedbackSchema.parse(data);

    // Log feedback
    log.info("Error feedback received", {
      error: validated.error,
      feedback: validated.feedback,
      url: validated.url,
      timestamp: validated.timestamp,
    });

    // Send to Sentry
    captureMessage(`User feedback: ${validated.feedback}`, "info", {
      tags: {
        type: "error_feedback",
      },
      extra: {
        error: validated.error,
        stack: validated.stack,
        url: validated.url,
        timestamp: validated.timestamp,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Validation error", issues: error.issues };
    }

    log.error("Error feedback action error", error);
    return { error: "Internal server error" };
  }
}
