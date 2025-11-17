// Sentry Server-side Configuration
// Error tracking for API routes and server components

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  ...(process.env["NEXT_PUBLIC_SENTRY_DSN"] && { dsn: process.env["NEXT_PUBLIC_SENTRY_DSN"] }),

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env["NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA"] || "development",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Server-specific: Profile every transaction
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Ignore common errors
  ignoreErrors: ["ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "ECONNREFUSED"],

  // Event filtering
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry Server]", event);
      return null; // Don't send in development
    }

    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    // Filter database connection strings
    if (event.contexts?.trace?.data) {
      const data = event.contexts.trace.data as Record<string, unknown>;
      if (data["DATABASE_URL"]) {
        data["DATABASE_URL"] = "[REDACTED]";
      }
    }

    return event;
  },
});
