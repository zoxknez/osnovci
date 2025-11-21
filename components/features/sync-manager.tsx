// Modern Background Sync Manager
"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { offlineStorage } from "@/lib/db/offline-storage";
import { useSyncStore } from "@/store";
import { syncHomeworkAction } from "@/app/actions/homework";

export function SyncManager() {
  const {
    isOnline,
    setOnline,
    isSyncing,
    setSyncing,
    setPendingCount,
    setLastSync,
  } = useSyncStore();
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  const processSyncItem = useCallback(async (item: any) => {
    if (item.entity === "homework") {
        const result = await syncHomeworkAction({
            type: item.type,
            data: item.data
        });
        if (result.error) throw new Error(result.error);
        return result.data;
    }

    // Fallback for legacy API routes if needed
    const endpoint = `/api/${item["entity"]}/sync`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: item["type"],
        data: item["data"],
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    return response.json();
  }, []);

  const syncData = useCallback(async () => {
    if (isSyncing) return;

    try {
      setSyncing(true);

      // Get pending sync items
      const queue = await offlineStorage.getSyncQueue();
      setPendingCount(queue.length);

      if (queue.length === 0) {
        setSyncing(false);
        return;
      }

      // Process each item
      for (const item of queue) {
        try {
          await processSyncItem(item);
          await offlineStorage.removeSyncItem(item.id);
        } catch {
          // Sync item failed

          // Increment retry count
          if (item.retries < 3) {
            await offlineStorage.addToSyncQueue({
              ...item,
              retries: item.retries + 1,
            });
          } else {
            // Max retries reached, BUT DO NOT DELETE DATA!
            // Just notify user and leave it in queue for manual retry or later sync
            // await offlineStorage.removeSyncItem(item.id); <--- PREVENT DATA LOSS
            toast.error(`Sinhronizacija nije uspela: ${item.entity}. Pokušaćemo ponovo kasnije.`);
          }
        }
      }

      setLastSync(new Date());
      setPendingCount(0);
      toast.success("Sve je sinhronizovano! ✅");
    } catch {
      // Sync error
    } finally {
      setSyncing(false);
    }
  }, [isSyncing, setSyncing, setPendingCount, setLastSync, processSyncItem]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncData();

      // Set up periodic sync every 5 minutes
      const interval = setInterval(
        () => {
          syncData();
        },
        5 * 60 * 1000,
      );

      return () => {
        clearInterval(interval);
      };
    }
    return undefined;
  }, [isOnline, isSyncing, syncData]);

  return null;
}
