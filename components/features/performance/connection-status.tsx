/**
 * Connection Status Component
 * Prikazuje status konekcije i omogućava offline mode
 */

"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSyncStore } from "@/store";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const { isOnline } = useSyncStore();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Just came back online
      setTimeout(() => setWasOffline(false), 3000);
    }
  }, [isOnline, wasOffline]);

  if (!wasOffline && isOnline) {
    return null; // Don't show when online
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        wasOffline && isOnline ? "animate-bounce" : ""
      )}
    >
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={cn(
          "flex items-center gap-2 px-4 py-2 shadow-lg",
          wasOffline && isOnline && "bg-green-500"
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            {wasOffline ? "Povezan!" : "Online"}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Offline režim
          </>
        )}
      </Badge>
    </div>
  );
}

