// Hook za offline schedule management
"use client";

import { useCallback, useEffect, useState } from "react";
import { offlineStorage, type StoredSchedule } from "@/lib/db/offline-storage";

// Re-export StoredSchedule type for use in components
export type { StoredSchedule };

export function useOfflineSchedule() {
  const [offlineSchedule, setOfflineSchedule] = useState<StoredSchedule[]>([]);

  const loadOfflineSchedule = useCallback(async () => {
    try {
      const items = await offlineStorage.getSchedule();
      setOfflineSchedule(items);
    } catch {
      // Failed to load offline schedule
    }
  }, []);

  const cacheSchedule = useCallback(
    async (schedule: StoredSchedule[]) => {
      try {
        await offlineStorage.saveSchedule(schedule);
        setOfflineSchedule(schedule);
      } catch {
        // Failed to cache schedule
      }
    },
    [],
  );

  // Load offline items on mount
  useEffect(() => {
    void loadOfflineSchedule();
  }, [loadOfflineSchedule]);

  return {
    offlineSchedule,
    cacheSchedule,
    hasOfflineSchedule: offlineSchedule.length > 0,
  };
}
