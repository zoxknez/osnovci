/**
 * Retry Utilities
 * Modern retry logic with exponential backoff and jitter
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryable'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delay: number): number {
  const jitterAmount = delay * 0.1; // 10% jitter
  return delay + (Math.random() * jitterAmount * 2 - jitterAmount);
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  multiplier: number,
  maxDelay: number,
  jitter: boolean,
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const delay = Math.min(exponentialDelay, maxDelay);
  return jitter ? addJitter(delay) : delay;
}

/**
 * Check if error is retryable
 */
function isRetryable(
  error: unknown,
  retryable?: (error: unknown) => boolean,
): boolean {
  if (retryable) {
    return retryable(error);
  }

  // Default: retry on network errors, timeouts, and 5xx errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return true;
    }
  }

  // Retry on fetch errors (5xx status codes)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 && status < 600;
  }

  return false;
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryable(error, options.retryable)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.backoffMultiplier,
        opts.maxDelay,
        opts.jitter,
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry sync function (for non-async operations)
 */
export function retrySync<T>(
  fn: () => T,
  options: Omit<RetryOptions, 'retryable'> = {},
): T {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt >= opts.maxRetries) {
        break;
      }

      // For sync retries, use minimal delay (immediate retry for most cases)
      const delay = attempt === 0 ? 0 : opts.initialDelay;
      if (delay > 0) {
        // Use setTimeout for sync function delay
        // Note: This is less ideal, but needed for sync retries
        const start = Date.now();
        while (Date.now() - start < delay) {
          // Busy wait (not ideal, but works for sync)
        }
      }
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper function
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options?: RetryOptions,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    return retry(() => fn(...args), options);
  };
}

