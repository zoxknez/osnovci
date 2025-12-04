/**
 * Retry Hook
 * Provides retry mechanism for failed operations
 */

import { useState, useCallback } from "react";
import { showErrorToast } from "@/components/features/error-toast";

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: () => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: UseRetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onSuccess,
    onFailure,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setIsRetrying(attempt > 0);
          setRetryCount(attempt);

          if (attempt > 0) {
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
            onRetry?.();
          }

          const result = await fn(...args);
          
          // Success
          setIsRetrying(false);
          setRetryCount(0);
          onSuccess?.();
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // If this was the last attempt, show error
          if (attempt === maxRetries) {
            setIsRetrying(false);
            setRetryCount(0);
            onFailure?.(lastError);

            showErrorToast({
              error: lastError,
              retry: () => executeWithRetry(...args),
            });

            return null;
          }
        }
      }

      return null;
    },
    [fn, maxRetries, retryDelay, onRetry, onSuccess, onFailure]
  );

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
  };
}

