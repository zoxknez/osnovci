/**
 * Enhanced Sentry Utilities
 *
 * Provides helper functions for Sentry error tracking:
 * - User context management
 * - Breadcrumb tracking
 * - Custom error capturing
 * - Performance tracking
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: {
  id: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    ...(user.username && { username: user.username }),
    ...(user.role && { role: user.role }),
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  level: "debug" | "info" | "warning" | "error" = "info",
) {
  Sentry.addBreadcrumb({
    message,
    level,
    ...(data && { data }),
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture error with context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  },
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Track page view
 */
export function trackPageView(url: string) {
  addBreadcrumb(`Page view: ${url}`, { url }, "info");
}

/**
 * Track user action
 */
export function trackAction(action: string, data?: Record<string, unknown>) {
  addBreadcrumb(`User action: ${action}`, data, "info");
}

/**
 * Track API call
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  status: number,
  duration: number,
) {
  addBreadcrumb(
    `API call: ${method} ${endpoint}`,
    {
      endpoint,
      method,
      status,
      duration: `${duration}ms`,
    },
    status >= 400 ? "error" : "info",
  );
}

/**
 * Track database query
 */
export function trackDatabaseQuery(
  query: string,
  duration: number,
  result?: string,
) {
  addBreadcrumb(
    `Database query: ${query}`,
    {
      query,
      duration: `${duration}ms`,
      ...(result && { result }),
    },
    duration > 500 ? "warning" : "debug",
  );
}
