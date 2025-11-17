// Sentry Client-side Configuration
// Error tracking, performance monitoring, session replay

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  ...(process.env["NEXT_PUBLIC_SENTRY_DSN"] && { dsn: process.env["NEXT_PUBLIC_SENTRY_DSN"] }),

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env["NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA"] || "development",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay (optional, requires paid plan)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors

  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
    // Network errors
    "NetworkError",
    "Network request failed",
    "Failed to fetch",
    // ResizeObserver (common benign error)
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
  ],

  // Breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive data
    if (breadcrumb.category === "console") {
      return null;
    }
    return breadcrumb;
  },

  // Event filtering
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry]", event);
      return null; // Don't send in development
    }

    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    return event;
  },
});
