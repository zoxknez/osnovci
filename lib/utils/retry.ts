/**
 * Retry Utilities
 * Za automatsko ponavljanje neuspešnih operacija
 */

import { log } from "@/lib/logger";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );

        log.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          error: lastError.message,
        });

        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Retry with jitter (random delay variation)
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const baseDelay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );
        // Add jitter: random 0-30% of base delay
        const jitter = baseDelay * 0.3 * Math.random();
        const delay = baseDelay + jitter;

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error("Retry failed");
}
