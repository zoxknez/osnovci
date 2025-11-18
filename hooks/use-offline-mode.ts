/**
 * useOfflineMode Hook
 * 
 * Provides offline functionality and sync status to React components
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  initOfflineDB,
  cacheHomework,
  getCachedHomework,
  cacheSchedule,
  getCachedSchedule,
  cacheGrades,
  getCachedGrades,
  cacheEvents,
  getCachedEvents,
  addPendingAction,
  getStorageEstimate,
  isOfflineModeAvailable,
} from "@/lib/offline/indexeddb";
import {
  registerBackgroundSync,
  hasPendingSync,
  getPendingSyncStats,
  setupSyncListeners,
  forceSyncNow,
} from "@/lib/offline/sync-manager";

interface OfflineState {
  isOnline: boolean;
  isOfflineModeEnabled: boolean;
  hasPendingChanges: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  storageUsage: {
    used: number;
    total: number;
    percentUsed: number;
  };
  isSyncing: boolean;
}

export function useOfflineMode() {
  const { data: session } = useSession();
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isOfflineModeEnabled: false,
    hasPendingChanges: false,
    pendingCount: 0,
    lastSyncTime: null,
    storageUsage: { used: 0, total: 0, percentUsed: 0 },
    isSyncing: false,
  });

  // Initialize offline mode
  useEffect(() => {
    if (typeof window === "undefined" || !isOfflineModeAvailable()) {
      return;
    }

    const init = async () => {
      try {
        await initOfflineDB();
        setState((prev) => ({ ...prev, isOfflineModeEnabled: true }));

        // Setup sync listeners
        setupSyncListeners();

        // Register background sync
        await registerBackgroundSync();

        // Check for pending changes
        await updatePendingStats();

        // Update storage usage
        await updateStorageUsage();
      } catch (error) {
        console.error("[useOfflineMode] Initialization failed", error);
      }
    };

    init();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    const handleSyncComplete = async () => {
      setState((prev) => ({ ...prev, lastSyncTime: new Date(), isSyncing: false }));
      await updatePendingStats();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("osnovci-sync-complete", handleSyncComplete);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("osnovci-sync-complete", handleSyncComplete);
    };
  }, []);

  // Update pending stats
  const updatePendingStats = useCallback(async () => {
    try {
      const hasPending = await hasPendingSync();
      const stats = await getPendingSyncStats();

      setState((prev) => ({
        ...prev,
        hasPendingChanges: hasPending,
        pendingCount: stats.total,
      }));
    } catch (error) {
      console.error("[useOfflineMode] Failed to update pending stats", error);
    }
  }, []);

  // Update storage usage
  const updateStorageUsage = useCallback(async () => {
    try {
      const estimate = await getStorageEstimate();
      setState((prev) => ({
        ...prev,
        storageUsage: {
          used: estimate.usage,
          total: estimate.quota,
          percentUsed: estimate.percentUsed,
        },
      }));
    } catch (error) {
      console.error("[useOfflineMode] Failed to update storage usage", error);
    }
  }, []);

  // Cache data for offline use
  const cacheDataForOffline = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch and cache homework
      const homeworkRes = await fetch("/api/homework");
      if (homeworkRes.ok) {
        const homework = await homeworkRes.json();
        await cacheHomework(homework);
      }

      // Fetch and cache schedule
      const scheduleRes = await fetch("/api/schedule");
      if (scheduleRes.ok) {
        const schedule = await scheduleRes.json();
        await cacheSchedule(schedule);
      }

      // Fetch and cache grades
      const gradesRes = await fetch("/api/grades");
      if (gradesRes.ok) {
        const grades = await gradesRes.json();
        await cacheGrades(grades);
      }

      // Fetch and cache events
      const eventsRes = await fetch("/api/events");
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        await cacheEvents(events);
      }

      await updateStorageUsage();
      console.log("[useOfflineMode] Data cached for offline use");
    } catch (error) {
      console.error("[useOfflineMode] Failed to cache data", error);
      throw error;
    }
  }, [session, updateStorageUsage]);

  // Get offline data
  const getOfflineData = useCallback(
    async <T,>(type: "homework" | "schedule" | "grades" | "events"): Promise<T[]> => {
      if (!session?.user?.id) return [];

      try {
        switch (type) {
          case "homework":
            return (await getCachedHomework(session.user.id)) as T[];
          case "schedule":
            return (await getCachedSchedule(session.user.id)) as T[];
          case "grades":
            return (await getCachedGrades(session.user.id)) as T[];
          case "events":
            return (await getCachedEvents(session.user.id)) as T[];
          default:
            return [];
        }
      } catch (error) {
        console.error(`[useOfflineMode] Failed to get offline ${type}`, error);
        return [];
      }
    },
    [session]
  );

  // Add offline action
  const addOfflineAction = useCallback(
    async (
      action: "create" | "update" | "delete" | "upload",
      entity: "homework" | "attachment" | "note",
      data: any
    ) => {
      try {
        const actionId = await addPendingAction(action, entity, data);
        await updatePendingStats();
        
        console.log("[useOfflineMode] Offline action added", { actionId, action, entity });
        return actionId;
      } catch (error) {
        console.error("[useOfflineMode] Failed to add offline action", error);
        throw error;
      }
    },
    [updatePendingStats]
  );

  // Sync now
  const syncNow = useCallback(async () => {
    if (!state.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    try {
      setState((prev) => ({ ...prev, isSyncing: true }));
      const result = await forceSyncNow();
      
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
      }));

      await updatePendingStats();
      await updateStorageUsage();

      console.log("[useOfflineMode] Sync completed", result);
      return result;
    } catch (error) {
      setState((prev) => ({ ...prev, isSyncing: false }));
      console.error("[useOfflineMode] Sync failed", error);
      throw error;
    }
  }, [state.isOnline, updatePendingStats, updateStorageUsage]);

  return {
    // State
    isOnline: state.isOnline,
    isOfflineModeEnabled: state.isOfflineModeEnabled,
    hasPendingChanges: state.hasPendingChanges,
    pendingCount: state.pendingCount,
    lastSyncTime: state.lastSyncTime,
    storageUsage: state.storageUsage,
    isSyncing: state.isSyncing,

    // Actions
    cacheDataForOffline,
    getOfflineData,
    addOfflineAction,
    syncNow,
    updateStorageUsage,
  };
}
