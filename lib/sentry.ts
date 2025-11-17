// Sentry Helper Functions
// Custom error tracking and performance monitoring

import * as Sentry from "@sentry/nextjs";

/**
 * Capture exception with context
 */
export function captureException(
  error: Error | unknown,
  context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  },
) {
  Sentry.withScope((scope) => {
    // Set level
    if (context?.level) {
      scope.setLevel(context.level);
    }

    // Set tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Set extra data
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    // Set user
    if (context?.user) {
      scope.setUser(context.user);
    }

    // Capture
    Sentry.captureException(error);
  });
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Start transaction (performance monitoring)
 */
export function startTransaction(name: string, operation: string) {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    () => {},
  );
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    ...(data !== undefined && { data }),
  });
}

/**
 * Track database query
 */
export function trackDatabaseQuery(
  query: string,
  duration: number,
  success: boolean,
) {
  addBreadcrumb(
    `Database query: ${query.substring(0, 50)}...`,
    "database",
    success ? "info" : "error",
    {
      query,
      duration,
      success,
    },
  );

  // Tracking via breadcrumbs is sufficient
  // Span tracking requires active transaction context
}

/**
 * Track API call
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
) {
  addBreadcrumb(
    `API call: ${method} ${endpoint}`,
    "http",
    statusCode >= 400 ? "error" : "info",
    {
      endpoint,
      method,
      statusCode,
      duration,
    },
  );
}

/**
 * Wrap async function with error tracking
 */
export function withSentry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operation: string,
): T {
  return (async (...args: unknown[]) => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      captureException(error, {
        level: "error",
        tags: {
          operation,
          function: fn.name,
        },
      });
      throw error;
    }
  }) as T;
}

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private spans: Map<string, { start: number; operation: string }> = new Map();
  private name: string;

  constructor(name: string, _operation = "function") {
    this.name = name;
  }

  startSpan(name: string, operation: string): void {
    this.spans.set(name, { start: Date.now(), operation });
  }

  finishSpan(name: string, status: "ok" | "error" = "ok"): void {
    const span = this.spans.get(name);
    if (span) {
      const duration = Date.now() - span.start;
      addBreadcrumb(
        `${this.name}: ${name} completed in ${duration}ms`,
        "performance",
        status === "ok" ? "info" : "error",
        { duration, operation: span.operation },
      );
      this.spans.delete(name);
    }
  }

  finish(status: "ok" | "error" = "ok"): void {
    // Finish any remaining spans
    for (const [name, span] of this.spans.entries()) {
      const duration = Date.now() - span.start;
      addBreadcrumb(
        `${this.name}: ${name} completed in ${duration}ms`,
        "performance",
        status === "ok" ? "info" : "error",
        { duration, operation: span.operation },
      );
    }
    this.spans.clear();
  }
}
