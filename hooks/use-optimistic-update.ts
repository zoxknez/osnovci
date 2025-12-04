/**
 * Optimistic Update Hook
 * Provides optimistic UI updates for better UX
 */

import { useState, useCallback, useRef } from "react";
import { showSuccessToast, showErrorToast } from "@/components/features/error-toast";

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollback: () => void) => void;
  rollbackOnError?: boolean;
}

export function useOptimisticUpdate<T>(
  updateFn: (data: T) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError, rollbackOnError = true } = options;
  const [isUpdating, setIsUpdating] = useState(false);
  const rollbackRef = useRef<(() => void) | null>(null);

  const update = useCallback(
    async (optimisticData: T, currentData: T) => {
      setIsUpdating(true);

      // Store current data for rollback
      if (rollbackOnError) {
        rollbackRef.current = () => {
          // Rollback logic would be implemented by caller
          return currentData;
        };
      }

      try {
        // Execute update
        const result = await updateFn(optimisticData);
        
        setIsUpdating(false);
        onSuccess?.(result);
        
        return { success: true, data: result };
      } catch (error) {
        setIsUpdating(false);
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (rollbackOnError && rollbackRef.current) {
          onError?.(err, rollbackRef.current);
        } else {
          onError?.(err, () => {});
        }

        showErrorToast({
          error: err,
          retry: () => update(optimisticData, currentData),
        });

        return { success: false, error: err };
      }
    },
    [updateFn, onSuccess, onError, rollbackOnError]
  );

  return {
    update,
    isUpdating,
  };
}

