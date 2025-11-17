// Error Tracking - Sentry Integration
import { log } from "@/lib/logger";
import {
  addBreadcrumb as sentryAddBreadcrumb,
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  clearUser as sentryClearUser,
  setUser as sentrySetUser,
  startTransaction as sentryStartTransaction,
} from "@/lib/sentry";

export interface ErrorContext {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

/**
 * Capture exception with Sentry
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext,
) {
  // Structured logging
  log.error("Exception captured", {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error,
    ...context,
  });

  // Send to Sentry
  sentryCaptureException(error, {
    level: "error",
    ...(context?.user && { user: context.user }),
    ...(context?.tags && { tags: context.tags }),
    ...(context?.extra && { extra: context.extra }),
  });
}

/**
 * Capture message (non-error)
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: ErrorContext,
) {
  log[level === "warning" ? "warn" : level](message, context);

  // Send to Sentry
  sentryCaptureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; role?: string }) {
  sentrySetUser(user);
  log.debug("User context set", { userId: user.id });
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  sentryClearUser();
  log.debug("User context cleared");
}

/**
 * Add breadcrumb (track user actions)
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
) {
  sentryAddBreadcrumb(message, category, "info", data);
  log.debug("Breadcrumb", { message, category, data });
}

/**
 * Performance monitoring
 */
export function startTransaction(name: string, op: string) {
  const startTime = Date.now();

  return {
    finish: () => {
      const duration = Date.now() - startTime;
      log.info("Transaction completed", { name, op, duration });

      // Send to Sentry (spans are automatically tracked)
      sentryStartTransaction(name, op);
    },
  };
}

// Exports for easy Sentry replacement
export const ErrorTracking = {
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
};

export default ErrorTracking;
