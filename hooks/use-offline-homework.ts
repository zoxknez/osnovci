// Hook za offline homework management
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { offlineStorage, type StoredHomework } from "@/lib/db/offline-storage";
import { useSyncStore } from "@/store";
import { createHomework } from "@/hooks/use-homework";

export type OfflineHomeworkStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DONE"
  | "SUBMITTED";

export interface OfflineHomework {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string | undefined;
  subjectColor?: string | undefined;
  description?: string | undefined;
  dueDate: Date;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  status: OfflineHomeworkStatus;
  createdAt: Date;
  synced: boolean;
  studentId?: string | undefined;
}

export function useOfflineHomework() {
  const [offlineItems, setOfflineItems] = useState<OfflineHomework[]>([]);
  const { isOnline, setPendingCount } = useSyncStore();

  const mapStoredToOffline = useCallback(
    (item: StoredHomework): OfflineHomework => ({
      id: item.id,
      title: item.title,
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      subjectColor: item.subjectColor,
      ...(item.description && { description: item.description }),
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
    } catch {
      // Failed to load offline items
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
          ...(item.subjectName && { subjectName: item.subjectName }),
          ...(item.subjectColor && { subjectColor: item.subjectColor }),
          title: item.title,
          ...(item.description && { description: item.description }),
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
      } catch {
        // Failed to save offline
        toast.error("Greška pri čuvanju offline");
        throw new Error("Failed to save offline");
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
        // Upload to API using the shared function
        await createHomework({
            title: item.title,
            description: item.description,
            dueDate: item.dueDate.toISOString(),
            priority: item.priority,
            subjectId: item.subjectId, // Already stored as ID in offline storage
            status: "ASSIGNED" // Default status for new items
        });

        // Remove from offline storage
        await offlineStorage.deleteHomework(item.id);
        synced++;
      } catch {
        // Failed to sync item
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
      } catch {
        // Failed to delete offline item
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
