/**
 * Offline Status Banner
 * Shows user offline/online status and sync information
 */

"use client";

import { useOfflineMode } from "@/hooks/use-offline-mode";
import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from "lucide-react";

export function OfflineStatusBanner() {
  const {
    isOnline,
    hasPendingChanges,
    pendingCount,
    lastSyncTime,
    isSyncing,
    syncNow,
  } = useOfflineMode();

  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    try {
      setSyncError(null);
      await syncNow();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Sync failed");
    }
  };

  // Don't show banner if online and no pending changes
  if (isOnline && !hasPendingChanges && !syncError) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm font-medium text-white ${
        isOnline
          ? hasPendingChanges
            ? "bg-yellow-600"
            : "bg-green-600"
          : "bg-red-600"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Cloud className="h-5 w-5" />
              <span>Online</span>
            </>
          ) : (
            <>
              <CloudOff className="h-5 w-5" />
              <span>Offline Mode - Promene će biti sinhronizovane kasnije</span>
            </>
          )}

          {hasPendingChanges && (
            <span className="ml-4 rounded-full bg-white/20 px-3 py-1 text-xs">
              {pendingCount} nesinhronizovan{pendingCount === 1 ? "a promena" : "ih promena"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {syncError && (
            <div className="flex items-center gap-2 text-red-100">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">{syncError}</span>
            </div>
          )}

          {lastSyncTime && !hasPendingChanges && (
            <div className="flex items-center gap-2 text-xs opacity-90">
              <Check className="h-4 w-4" />
              <span>
                Poslednja sinhronizacija:{" "}
                {new Date(lastSyncTime).toLocaleTimeString("sr-Latn-RS")}
              </span>
            </div>
          )}

          {isOnline && hasPendingChanges && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/30 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sinhronizacija..." : "Sinhronizuj"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
