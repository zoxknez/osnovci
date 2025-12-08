/**
 * Generic Offline Data Hook
 * Base utility for offline-first data management
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncStore } from "@/store";

export interface UseOfflineDataOptions<T> {
  /** Key for storing data in offline storage */
  storageKey: string;
  /** Function to fetch data from API */
  fetchData: () => Promise<T | null>;
  /** Function to load data from offline storage */
  loadOffline: () => Promise<T | null>;
  /** Function to save data to offline storage */
  saveOffline: (data: T) => Promise<void>;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
  /** Stale time in ms before refetching */
  staleTime?: number;
}

export interface UseOfflineDataReturn<T> {
  /** The current data */
  data: T | null;
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Whether data is from offline cache */
  isOffline: boolean;
  /** Manually refetch data */
  refetch: () => Promise<void>;
  /** Update data locally */
  setData: (data: T) => void;
  /** Sync offline data to server */
  sync: () => Promise<boolean>;
}

/**
 * Generic hook for offline-first data management
 * Provides caching, auto-sync, and offline fallback
 */
export function useOfflineData<T>({
  storageKey,
  fetchData,
  loadOffline,
  saveOffline,
  autoFetch = true,
  staleTime = 5 * 60 * 1000, // 5 minutes default
}: UseOfflineDataOptions<T>): UseOfflineDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const { isOnline } = useSyncStore();
  const lastFetchTime = useRef<number>(0);
  const isMounted = useRef(true);

  // Load data from offline storage first
  const loadFromOffline = useCallback(async (): Promise<T | null> => {
    try {
      const offlineData = await loadOffline();
      if (offlineData && isMounted.current) {
        setData(offlineData);
        setIsOffline(true);
        return offlineData;
      }
      return null;
    } catch (err) {
      console.error(
        `[useOfflineData:${storageKey}] Failed to load offline data:`,
        err,
      );
      return null;
    }
  }, [loadOffline, storageKey]);

  // Fetch fresh data from API
  const fetchFreshData = useCallback(async (): Promise<T | null> => {
    if (!isOnline) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const freshData = await fetchData();

      if (freshData && isMounted.current) {
        setData(freshData);
        setIsOffline(false);
        lastFetchTime.current = Date.now();

        // Cache to offline storage
        try {
          await saveOffline(freshData);
        } catch (cacheErr) {
          console.warn(
            `[useOfflineData:${storageKey}] Failed to cache data:`,
            cacheErr,
          );
        }

        return freshData;
      }

      return null;
    } catch (err) {
      if (isMounted.current) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch data"),
        );
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchData, isOnline, saveOffline, storageKey]);

  // Main fetch logic with offline fallback
  const refetch = useCallback(async () => {
    setIsLoading(true);

    // Try online first
    if (isOnline) {
      const fresh = await fetchFreshData();
      if (fresh) {
        return;
      }
    }

    // Fallback to offline
    await loadFromOffline();
    setIsLoading(false);
  }, [isOnline, fetchFreshData, loadFromOffline]);

  // Sync offline changes to server
  const sync = useCallback(async (): Promise<boolean> => {
    if (!isOnline || !data) {
      return false;
    }

    try {
      // This would typically involve sending pending changes to server
      // For now, just refetch to get latest
      await fetchFreshData();
      return true;
    } catch {
      return false;
    }
  }, [isOnline, data, fetchFreshData]);

  // Auto-fetch on mount
  useEffect(() => {
    isMounted.current = true;

    if (autoFetch) {
      void refetch();
    }

    return () => {
      isMounted.current = false;
    };
  }, [autoFetch, refetch]);

  // Refetch when coming online if data is stale
  useEffect(() => {
    if (isOnline && isOffline) {
      const isStale = Date.now() - lastFetchTime.current > staleTime;
      if (isStale) {
        void fetchFreshData();
      }
    }
  }, [isOnline, isOffline, staleTime, fetchFreshData]);

  return {
    data,
    isLoading,
    error,
    isOffline,
    refetch,
    setData,
    sync,
  };
}

/**
 * Simple hook for checking if user is online
 */
export function useIsOnline(): boolean {
  const { isOnline } = useSyncStore();
  return isOnline;
}

/**
 * Hook for tracking data freshness
 */
export function useDataFreshness(
  lastUpdated: Date | null,
  staleTime: number = 5 * 60 * 1000,
) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!lastUpdated) {
      setIsStale(true);
      return;
    }

    const checkFreshness = () => {
      const age = Date.now() - lastUpdated.getTime();
      setIsStale(age > staleTime);
    };

    checkFreshness();
    const interval = setInterval(checkFreshness, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [lastUpdated, staleTime]);

  return isStale;
}
