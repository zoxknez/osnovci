/**
 * Enhanced Error Handling Utilities
 * Centralizovano upravljanje greškama
 */

import { log } from "@/lib/logger";

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  userMessage?: string; // Child-friendly message
  retryable?: boolean;
}

/**
 * Create user-friendly error message
 */
export function createUserFriendlyError(error: unknown): AppError {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return {
        code: "NETWORK_ERROR",
        message: error.message,
        userMessage: "Nema interneta. Proveri konekciju i pokušaj ponovo.",
        retryable: true,
      };
    }

    // Timeout errors
    if (error.message.includes("timeout")) {
      return {
        code: "TIMEOUT_ERROR",
        message: error.message,
        userMessage: "Zahtev traje predugo. Pokušaj ponovo.",
        retryable: true,
      };
    }

    // Permission errors
    if (error.message.includes("permission") || error.message.includes("unauthorized")) {
      return {
        code: "PERMISSION_ERROR",
        message: error.message,
        userMessage: "Nemaš dozvolu za ovu akciju.",
        retryable: false,
      };
    }

    // Generic error
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
      userMessage: "Nešto nije u redu. Pokušaj ponovo kasnije.",
      retryable: true,
    };
  }

  // Non-Error objects
  return {
    code: "UNKNOWN_ERROR",
    message: String(error),
    userMessage: "Nešto nije u redu. Pokušaj ponovo kasnije.",
    retryable: true,
  };
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const appError = createUserFriendlyError(error);
  log.error("Application error", {
    ...appError,
    ...context,
  });
  return appError;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError;
}

/**
 * Safe async function wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const appError = logError(error);
    return { error: appError, data: fallback };
  }
}

