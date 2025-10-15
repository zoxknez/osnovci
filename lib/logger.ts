// Structured Logging sa Pino
import pino from "pino";

// Create logger instance
export const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // Pretty print u development modu
  ...(process.env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }),

  // Production logging format
  ...(process.env.NODE_ENV === "production" && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  }),
});

// Typed logging functions
export const log = {
  // Info level
  info: (message: string, data?: object) => {
    logger.info(data || {}, message);
  },

  // Debug level
  debug: (message: string, data?: object) => {
    logger.debug(data || {}, message);
  },

  // Warning level
  warn: (message: string, data?: object) => {
    logger.warn(data || {}, message);
  },

  // Error level
  error: (message: string, error?: Error | unknown, data?: object) => {
    if (error instanceof Error) {
      logger.error(
        {
          ...data,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message,
      );
    } else {
      logger.error({ ...data, error }, message);
    }
  },

  // Fatal level
  fatal: (message: string, error?: Error | unknown, data?: object) => {
    if (error instanceof Error) {
      logger.fatal(
        {
          ...data,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message,
      );
    } else {
      logger.fatal({ ...data, error }, message);
    }
  },
};

// Request logger helper
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: object,
) {
  log.info(`${method} ${path} - ${statusCode}`, {
    method,
    path,
    statusCode,
    duration,
    ...metadata,
  });
}

// Database query logger
export function logQuery(query: string, duration: number, params?: unknown[]) {
  log.debug("Database query executed", {
    query,
    duration,
    params: params?.length || 0,
  });
}

// User action logger (za audit trail)
export function logUserAction(
  userId: string,
  action: string,
  resource: string,
  metadata?: object,
) {
  log.info(`User action: ${action}`, {
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

// Security event logger
export function logSecurityEvent(
  event:
    | "login_success"
    | "login_failure"
    | "logout"
    | "unauthorized_access"
    | "suspicious_activity",
  userId?: string,
  metadata?: object,
) {
  log.warn(`Security event: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}
