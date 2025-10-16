// Error Tracking - Sentry-like interface (Ready for real Sentry)
import { log } from "@/lib/logger";

export interface ErrorContext {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

/**
 * Capture exception
 * TODO: Replace with real Sentry when ready
 * Installation: npm install @sentry/nextjs
 * Setup: npx @sentry/wizard@latest -i nextjs
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext,
) {
  // For now, use structured logging
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

  // TODO: Uncomment when Sentry is configured
  // if (typeof window === "undefined") {
  //   // Server-side
  //   Sentry.captureException(error, {
  //     user: context?.user,
  //     tags: context?.tags,
  //     extra: context?.extra,
  //   });
  // } else {
  //   // Client-side
  //   Sentry.captureException(error, {
  //     tags: context?.tags,
  //     extra: context?.extra,
  //   });
  // }
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

  // TODO: Uncomment when Sentry is configured
  // Sentry.captureMessage(message, { level, ...context });
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; role?: string }) {
  // TODO: Uncomment when Sentry is configured
  // Sentry.setUser(user);

  log.debug("User context set", { userId: user.id });
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  // TODO: Uncomment when Sentry is configured
  // Sentry.setUser(null);

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
  // TODO: Uncomment when Sentry is configured
  // Sentry.addBreadcrumb({
  //   message,
  //   category,
  //   data,
  //   timestamp: Date.now(),
  // });

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

      // TODO: Uncomment when Sentry is configured
      // const transaction = Sentry.startTransaction({ name, op });
      // transaction.finish();
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
