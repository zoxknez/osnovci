// Modern Background Sync Manager
"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { offlineStorage } from "@/lib/db/offline-storage";
import { useSyncStore } from "@/store";

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

  const syncData = async () => {
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

      console.log(`Syncing ${queue.length} items...`);

      // Process each item
      for (const item of queue) {
        try {
          await processSyncItem(item);
          await offlineStorage.removeSyncItem(item.id);
        } catch (error) {
          console.error("Sync item failed:", error);

          // Increment retry count
          if (item.retries < 3) {
            await offlineStorage.addToSyncQueue({
              ...item,
              retries: item.retries + 1,
            });
          } else {
            // Max retries reached, remove from queue
            await offlineStorage.removeSyncItem(item.id);
            toast.error(`Sinhronizacija nije uspela: ${item.entity}`);
          }
        }
      }

      setLastSync(new Date());
      setPendingCount(0);
      toast.success("Sve je sinhronizovano! ✅");
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  const processSyncItem = async (item: any) => {
    const endpoint = `/api/${item.entity}/sync`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: item.type,
        data: item.data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    return response.json();
  };

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
  }, [isOnline, isSyncing]);

  return null;
}
