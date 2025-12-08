/**
 * API Retry Logic - Exponential Backoff with Jitter
 *
 * Handles transient errors and implements smart retry strategy:
 * - Exponential backoff (100ms, 200ms, 400ms, 800ms, 1600ms)
 * - Jitter to prevent thundering herd
 * - Configurable retry conditions
 * - Request timeout handling
 *
 * Usage:
 * ```ts
 * const data = await fetchWithRetry('/api/homework');
 * ```
 */

import { log } from "@/lib/logger";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeout?: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export interface FetchOptions extends RequestInit {
  retryOptions?: RetryOptions;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 5000,
  timeout: 30000, // 30 seconds
  retryCondition: (error, attempt) => {
    // Retry only on network errors or 5xx server errors
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return attempt < 2; // Max 2 retries for timeouts
    }

    // Check if it's a fetch Response error
    if ("status" in error) {
      const status = (error as any).status;
      // Retry on 5xx and 429 (rate limit)
      return status >= 500 || status === 429;
    }

    return true; // Retry on unknown errors
  },
  onRetry: (error, attempt) => {
    log.warn("API request retry", {
      error: error.message,
      attempt,
    });
  },
};

/**
 * Calculate exponential backoff with jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
): number {
  const exponentialDelay = initialDelay * 2 ** attempt;
  const jitter = Math.random() * exponentialDelay * 0.1; // 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if ((error as Error).name === "AbortError") {
      const timeoutError = new Error(`Request timeout after ${timeout}ms`);
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }

    throw error;
  }
}

/**
 * Fetch with automatic retry logic
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { retryOptions, ...fetchOptions } = options;
  const config = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= config.maxRetries) {
    try {
      const response = await fetchWithTimeout(
        url,
        fetchOptions,
        config.timeout,
      );

      // Check if response is OK
      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status}: ${response.statusText}`,
        );
        (error as any).status = response.status;
        (error as any).response = response;

        // Check if we should retry
        if (
          attempt < config.maxRetries &&
          config.retryCondition(error, attempt)
        ) {
          lastError = error;
          const delay = calculateDelay(
            attempt,
            config.initialDelay,
            config.maxDelay,
          );

          config.onRetry(error, attempt + 1);
          await sleep(delay);

          attempt++;
          continue;
        }

        throw error;
      }

      // Success - parse response
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        return await response.json();
      }

      if (contentType?.includes("text/")) {
        return (await response.text()) as T;
      }

      // Return response object if no specific content type
      return response as T;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (
        attempt < config.maxRetries &&
        config.retryCondition(lastError, attempt)
      ) {
        const delay = calculateDelay(
          attempt,
          config.initialDelay,
          config.maxDelay,
        );

        config.onRetry(lastError, attempt + 1);
        await sleep(delay);

        attempt++;
        continue;
      }

      // No more retries - throw error
      log.error("API request failed after retries", {
        url,
        attempts: attempt + 1,
        error: lastError,
      });

      throw lastError;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error("Unknown error");
}

/**
 * GET request with retry
 */
export async function getWithRetry<T = any>(
  url: string,
  options?: FetchOptions,
): Promise<T> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: "GET",
  });
}

/**
 * POST request with retry
 */
export async function postWithRetry<T = any>(
  url: string,
  data?: any,
  options?: FetchOptions,
): Promise<T> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...(data && { body: JSON.stringify(data) }),
  });
}

/**
 * PUT request with retry
 */
export async function putWithRetry<T = any>(
  url: string,
  data?: any,
  options?: FetchOptions,
): Promise<T> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...(data && { body: JSON.stringify(data) }),
  });
}

/**
 * DELETE request with retry
 */
export async function deleteWithRetry<T = any>(
  url: string,
  options?: FetchOptions,
): Promise<T> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: "DELETE",
  });
}

/**
 * Batch requests with controlled concurrency
 * Useful for processing multiple API calls without overwhelming the server
 */
export async function batchFetchWithRetry<T = any>(
  urls: string[],
  options?: FetchOptions,
  concurrency: number = 3,
): Promise<T[]> {
  const results: T[] = [];
  const queue = [...urls];
  const inProgress: Promise<void>[] = [];

  async function processNext(): Promise<void> {
    const url = queue.shift();
    if (!url) return;

    try {
      const result = await fetchWithRetry<T>(url, options);
      results.push(result);
    } catch (error) {
      log.error("Batch fetch failed for URL", { url, error });
      throw error;
    }

    if (queue.length > 0) {
      await processNext();
    }
  }

  // Start initial batch
  for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
    inProgress.push(processNext());
  }

  await Promise.all(inProgress);
  return results;
}

/**
 * Retry-specific error class
 */
export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error,
  ) {
    super(message);
    this.name = "RetryError";
  }
}
