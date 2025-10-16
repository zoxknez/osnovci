// Hook za offline homework management
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { offlineStorage, type StoredHomework } from "@/lib/db/offline-storage";
import { useSyncStore } from "@/store";

export type OfflineHomeworkStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DONE"
  | "SUBMITTED";

export interface OfflineHomework {
  id: string;
  title: string;
  subjectId: string;
  description?: string;
  dueDate: Date;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  status: OfflineHomeworkStatus;
  createdAt: Date;
  synced: boolean;
  studentId?: string;
}

export function useOfflineHomework() {
  const [offlineItems, setOfflineItems] = useState<OfflineHomework[]>([]);
  const { isOnline, setPendingCount } = useSyncStore();

  const mapStoredToOffline = useCallback(
    (item: StoredHomework): OfflineHomework => ({
      id: item.id,
      title: item.title,
      subjectId: item.subjectId,
      description: item.description || undefined,
      dueDate: new Date(item.dueDate),
      priority: item.priority,
      status: item.status as OfflineHomeworkStatus,
      createdAt: new Date(item.createdAt),
      synced: item.synced,
      studentId: item.studentId,
    }),
    [],
  );

  const loadOfflineItems = useCallback(async () => {
    try {
      const items = await offlineStorage.getAllHomework();
      const mapped = items.map(mapStoredToOffline);
      setOfflineItems(mapped);
      setPendingCount(mapped.filter((item) => !item.synced).length);
    } catch (error) {
      console.error("Failed to load offline items:", error);
    }
  }, [mapStoredToOffline, setPendingCount]);

  const saveOffline = useCallback(
    async (homework: Omit<OfflineHomework, "id" | "createdAt" | "synced">) => {
      try {
        const item: OfflineHomework = {
          ...homework,
          id: `offline-${Date.now()}`,
          status: homework.status ?? "ASSIGNED",
          createdAt: new Date(),
          synced: false,
        };

        await offlineStorage.saveHomework({
          id: item.id,
          studentId: item.studentId ?? "offline-student",
          subjectId: item.subjectId,
          title: item.title,
          description: item.description,
          dueDate: item.dueDate.toISOString(),
          priority: item.priority,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.createdAt.toISOString(),
          synced: item.synced,
        });
        await loadOfflineItems();

        toast.success("Sačuvano offline", {
          description: "Sinhronizuj kada se povežeš na internet",
        });

        return item;
      } catch (error) {
        console.error("Failed to save offline:", error);
        toast.error("Greška pri čuvanju offline");
        throw error;
      }
    },
    [loadOfflineItems],
  );

  const syncOfflineItems = useCallback(async () => {
    if (!isOnline) {
      toast.info("Nisi povezan na internet");
      return;
    }

    const unsynced = offlineItems.filter((item) => !item.synced);

    if (unsynced.length === 0) {
      return;
    }

    toast.info(`Sinhronizujem ${unsynced.length} zadataka...`);

    let synced = 0;
    let failed = 0;

    for (const item of unsynced) {
      try {
        // Upload to API
        const response = await fetch("/api/homework", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            description: item.description,
            dueDate: item.dueDate.toISOString(),
            priority: item.priority,
            // subjectId: item.subject, // TODO: Map subject name to ID
          }),
        });

        if (response.ok) {
          // Remove from offline storage
          await offlineStorage.deleteHomework(item.id);
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("Failed to sync item:", item.id, error);
        failed++;
      }
    }

    await loadOfflineItems();

    if (synced > 0) {
      toast.success(`${synced} zadataka sinhronizovano!`);
    }

    if (failed > 0) {
      toast.error(`${failed} zadataka nije uspelo`);
    }
  }, [isOnline, offlineItems, loadOfflineItems]);

  const deleteOffline = useCallback(
    async (id: string) => {
      try {
        await offlineStorage.deleteHomework(id);
        await loadOfflineItems();
        toast.success("Offline zadatak obrisan");
      } catch (error) {
        console.error("Failed to delete offline item:", error);
        toast.error("Greška pri brisanju");
      }
    },
    [loadOfflineItems],
  );

  // Load offline items on mount
  useEffect(() => {
    void loadOfflineItems();
  }, [loadOfflineItems]);

  // Sync when online and there are pending items
  useEffect(() => {
    if (isOnline && offlineItems.some((item) => !item.synced)) {
      void syncOfflineItems();
    }
  }, [isOnline, offlineItems, syncOfflineItems]);

  const hasOfflineItems = useMemo(
    () => offlineItems.length > 0,
    [offlineItems],
  );
  const unsyncedCount = useMemo(
    () => offlineItems.filter((item) => !item.synced).length,
    [offlineItems],
  );

  return {
    offlineItems,
    saveOffline,
    syncOfflineItems,
    deleteOffline,
    hasOfflineItems,
    unsyncedCount,
  };
}
