/**
 * Error Feedback API
 * 
 * Receives user feedback about errors for better debugging
 */

import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    // Log feedback
    log.info("Error feedback received", {
      error: data.error,
      feedback: data.feedback,
      url: data.url,
      timestamp: data.timestamp,
    });

    // Send to Sentry
    captureMessage(
      `User feedback: ${data.feedback}`,
      "info",
      {
        tags: {
          type: "error_feedback",
        },
        extra: {
          error: data.error,
          stack: data.stack,
          url: data.url,
          timestamp: data.timestamp,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }

    log.error("Error feedback API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
