/**
 * Offline Data Manager Component
 * Allows users to cache data for offline use and monitor storage
 */

"use client";

import { useOfflineMode } from "@/hooks/use-offline-mode";
import { useState } from "react";
import { Download, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineDataManager() {
  const {
    isOnline,
    isOfflineModeEnabled,
    storageUsage,
    cacheDataForOffline,
    lastSyncTime,
  } = useOfflineMode();

  const [isCaching, setIsCaching] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [cacheSuccess, setCacheSuccess] = useState(false);

  const handleCacheData = async () => {
    try {
      setIsCaching(true);
      setCacheError(null);
      setCacheSuccess(false);

      await cacheDataForOffline();

      setCacheSuccess(true);
      setTimeout(() => setCacheSuccess(false), 3000);
    } catch (error) {
      setCacheError(error instanceof Error ? error.message : "Failed to cache data");
    } finally {
      setIsCaching(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Offline Podaci
        </CardTitle>
        <CardDescription>
          Preuzmite podatke za korišćenje bez internet konekcije
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Iskorišćenost skladišta</span>
            <span className="font-medium">
              {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
            </span>
          </div>
          <Progress value={storageUsage.percentUsed} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {storageUsage.percentUsed.toFixed(1)}% iskorišćeno
          </p>
        </div>

        {/* Offline Mode Status */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isOfflineModeEnabled ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-sm font-medium">
                {isOfflineModeEnabled ? "Offline režim aktivan" : "Offline režim neaktivan"}
              </span>
            </div>
          </div>
          {lastSyncTime && (
            <p className="mt-1 text-xs text-muted-foreground">
              Poslednja sinhronizacija:{" "}
              {new Date(lastSyncTime).toLocaleString("sr-Latn-RS")}
            </p>
          )}
        </div>

        {/* Cache Button */}
        <Button
          onClick={handleCacheData}
          disabled={!isOnline || isCaching}
          className="w-full"
          variant={cacheSuccess ? "default" : "outline"}
        >
          {isCaching ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-bounce" />
              Preuzimanje podataka...
            </>
          ) : cacheSuccess ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Uspešno preuzeto!
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Preuzmite podatke za offline
            </>
          )}
        </Button>

        {/* Status Messages */}
        {!isOnline && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Trenutno ste offline. Povežite se na internet da preuzmete nove podatke.
            </AlertDescription>
          </Alert>
        )}

        {cacheError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cacheError}</AlertDescription>
          </Alert>
        )}

        {cacheSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Podaci su uspešno keširani i dostupni offline!
            </AlertDescription>
          </Alert>
        )}

        {/* Help Text */}
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p>
            <strong>Napomena:</strong> Preuzeti podaci će biti dostupni dok ste offline.
            Sve promene će biti automatski sinhronizovane kada se povežete na internet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
