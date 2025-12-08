/**
 * Sync Button Component
 * Manual sync trigger with pending changes indicator
 */

"use client";

import { Check, Cloud, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOfflineMode } from "@/hooks/use-offline-mode";

interface SyncButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function SyncButton({
  variant = "ghost",
  size = "icon",
  showLabel = false,
}: SyncButtonProps) {
  const {
    isOnline,
    hasPendingChanges,
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncNow,
  } = useOfflineMode();

  const handleSync = async () => {
    await syncNow();
  };

  const tooltipText = !isOnline
    ? "Offline - sinhronizacija nije moguća"
    : isSyncing
      ? "Sinhronizacija u toku..."
      : hasPendingChanges
        ? `${pendingCount} nesinhronizovan${pendingCount === 1 ? "a promena" : "ih promena"}`
        : lastSyncTime
          ? `Poslednja sinhronizacija: ${new Date(lastSyncTime).toLocaleTimeString("sr-Latn-RS")}`
          : "Sinhronizuj podatke";

  if (!showLabel && size === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleSync}
              disabled={!isOnline || isSyncing || !hasPendingChanges}
              className="relative"
            >
              {isSyncing ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : hasPendingChanges && isOnline ? (
                <>
                  <Cloud className="h-5 w-5" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </>
              ) : (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={!isOnline || isSyncing || !hasPendingChanges}
      className="gap-2"
    >
      {isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Sinhronizacija...
        </>
      ) : hasPendingChanges && isOnline ? (
        <>
          <Cloud className="h-4 w-4" />
          Sinhronizuj ({pendingCount})
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          Sinhronizovano
        </>
      )}
    </Button>
  );
}
