/**
 * Background Sync Manager
 *
 * Handles synchronization of offline changes when connection is restored
 * Uses Service Worker Background Sync API when available
 */

import { log } from "@/lib/logger";
import {
  getPendingActions,
  incrementPendingActionRetries,
  removePendingAction,
} from "./indexeddb";

const MAX_RETRIES = 5;
const SYNC_TAG = "osnovci-sync";

interface SyncResult {
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * Register background sync with service worker
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    log.warn("[Sync] Background Sync API not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Type assertion for experimental API
    const syncManager = (registration as any).sync;
    if (!syncManager) {
      log.warn("[Sync] Sync Manager not available");
      return false;
    }

    await syncManager.register(SYNC_TAG);
    log.info("[Sync] Background sync registered");
    return true;
  } catch (error) {
    log.error("[Sync] Failed to register background sync", error as Error);
    return false;
  }
}

/**
 * Manually trigger sync (called when online)
 */
export async function syncPendingActions(): Promise<SyncResult> {
  const result: SyncResult = {
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    const actions = await getPendingActions();

    if (actions.length === 0) {
      log.info("[Sync] No pending actions to sync");
      return result;
    }

    log.info("[Sync] Starting sync", { actionCount: actions.length });

    for (const action of actions) {
      // Skip if max retries exceeded
      if (action.retries >= MAX_RETRIES) {
        log.warn("[Sync] Action exceeded max retries - skipping", {
          actionId: action.id,
          retries: action.retries,
        });
        result.failed++;
        result.errors.push(`Action ${action.id} exceeded max retries`);
        continue;
      }

      try {
        await processPendingAction(action);
        await removePendingAction(action.id);
        result.succeeded++;

        log.info("[Sync] Action synced successfully", {
          actionId: action.id,
          action: action.action,
          entity: action.entity,
        });
      } catch (error) {
        await incrementPendingActionRetries(action.id);
        result.failed++;

        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Action ${action.id}: ${errorMsg}`);

        log.error("[Sync] Failed to sync action", error as Error, {
          actionId: action.id,
          retries: action.retries + 1,
        });
      }
    }

    log.info("[Sync] Sync completed", result);
    return result;
  } catch (error) {
    log.error("[Sync] Sync process failed", error as Error);
    throw error;
  }
}

/**
 * Process individual pending action
 */
async function processPendingAction(action: any): Promise<void> {
  const { action: actionType, entity, data } = action;

  let endpoint = "";
  let method = "POST";
  let body: any = data;

  // Determine API endpoint and method based on action
  switch (entity) {
    case "homework":
      endpoint =
        actionType === "create" ? "/api/homework" : `/api/homework/${data.id}`;
      method =
        actionType === "create"
          ? "POST"
          : actionType === "update"
            ? "PUT"
            : "DELETE";
      break;

    case "attachment": {
      endpoint = "/api/upload";
      method = "POST";

      // Convert data to FormData for file upload
      const formData = new FormData();
      if (data.file instanceof Blob) {
        formData.append("file", data.file, data.fileName);
        formData.append("homeworkId", data.homeworkId);
      }
      body = formData;
      break;
    }

    case "note":
      endpoint = `/api/homework/${data.homeworkId}`;
      method = "PATCH";
      body = { notes: data.notes };
      break;

    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }

  // Make API request
  const response = await fetch(endpoint, {
    method,
    ...(body instanceof FormData
      ? { body }
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Check if sync is needed (has pending actions)
 */
export async function hasPendingSync(): Promise<boolean> {
  try {
    const actions = await getPendingActions();
    return actions.length > 0;
  } catch (error) {
    log.error("[Sync] Failed to check pending sync", error as Error);
    return false;
  }
}

/**
 * Get pending sync stats
 */
export async function getPendingSyncStats(): Promise<{
  total: number;
  byEntity: Record<string, number>;
  oldestAction: number | null;
}> {
  try {
    const actions = await getPendingActions();

    const stats = {
      total: actions.length,
      byEntity: {} as Record<string, number>,
      oldestAction:
        actions.length > 0
          ? Math.min(...actions.map((a) => a.createdAt))
          : null,
    };

    // Count by entity type
    for (const action of actions) {
      stats.byEntity[action.entity] = (stats.byEntity[action.entity] || 0) + 1;
    }

    return stats;
  } catch (error) {
    log.error("[Sync] Failed to get sync stats", error as Error);
    return {
      total: 0,
      byEntity: {},
      oldestAction: null,
    };
  }
}

/**
 * Listen for online/offline events
 */
export function setupSyncListeners(): void {
  if (typeof window === "undefined") return;

  // Sync when coming online
  window.addEventListener("online", async () => {
    log.info("[Sync] Connection restored - triggering sync");

    try {
      const hasPending = await hasPendingSync();
      if (hasPending) {
        await syncPendingActions();

        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent("osnovci-sync-complete"));
      }
    } catch (error) {
      log.error("[Sync] Auto-sync failed", error as Error);
    }
  });

  // Log when going offline
  window.addEventListener("offline", () => {
    log.info("[Sync] Connection lost - offline mode active");
    window.dispatchEvent(new CustomEvent("osnovci-offline"));
  });

  log.info("[Sync] Sync listeners initialized");
}

/**
 * Force sync now (for manual trigger button)
 */
export async function forceSyncNow(): Promise<SyncResult> {
  if (!navigator.onLine) {
    throw new Error("Cannot sync while offline");
  }

  log.info("[Sync] Manual sync triggered");
  return await syncPendingActions();
}
