// Hook za offline homework management
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { offlineHomeworkDB } from "@/lib/db/offline-storage";
import { useSyncStore } from "@/store";

export interface OfflineHomework {
  id: string;
  title: string;
  subject: string;
  description?: string;
  dueDate: Date;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  createdAt: Date;
  synced: boolean;
}

export function useOfflineHomework() {
  const [offlineItems, setOfflineItems] = useState<OfflineHomework[]>([]);
  const { isOnline, setPendingCount } = useSyncStore();

  // Load offline items on mount
  useEffect(() => {
    loadOfflineItems();
  }, []);

  // Sync when online
  useEffect(() => {
    if (isOnline && offlineItems.length > 0) {
      syncOfflineItems();
    }
  }, [isOnline]);

  const loadOfflineItems = async () => {
    try {
      const items = await offlineHomeworkDB.getAll();
      setOfflineItems(items);
      setPendingCount(items.length);
    } catch (error) {
      console.error("Failed to load offline items:", error);
    }
  };

  const saveOffline = async (homework: Omit<OfflineHomework, "id" | "createdAt" | "synced">) => {
    try {
      const item: OfflineHomework = {
        ...homework,
        id: `offline-${Date.now()}`,
        createdAt: new Date(),
        synced: false,
      };

      await offlineHomeworkDB.add(item);
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
  };

  const syncOfflineItems = async () => {
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
          await offlineHomeworkDB.delete(item.id);
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
  };

  const deleteOffline = async (id: string) => {
    try {
      await offlineHomeworkDB.delete(id);
      await loadOfflineItems();
      toast.success("Offline zadatak obrisan");
    } catch (error) {
      console.error("Failed to delete offline item:", error);
      toast.error("Greška pri brisanju");
    }
  };

  return {
    offlineItems,
    saveOffline,
    syncOfflineItems,
    deleteOffline,
    hasOfflineItems: offlineItems.length > 0,
    unsynced Count: offlineItems.filter((i) => !i.synced).length,
  };
}

