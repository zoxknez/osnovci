// Hook za offline grades management
"use client";

import { useCallback, useEffect, useState } from "react";
import { offlineStorage, type StoredGrade } from "@/lib/db/offline-storage";

export function useOfflineGrades() {
  const [offlineGrades, setOfflineGrades] = useState<StoredGrade[]>([]);

  const loadOfflineGrades = useCallback(async () => {
    try {
      const items = await offlineStorage.getGrades();
      setOfflineGrades(items);
    } catch {
      // Failed to load offline grades
    }
  }, []);

  const cacheGrades = useCallback(
    async (grades: any[]) => {
      try {
        // Map API response to StoredGrade format
        const storedGrades: StoredGrade[] = grades.map((g) => ({
          id: g.id,
          grade: parseInt(g.grade, 10),
          subjectId: g.subject.id,
          subjectName: g.subject.name,
          subjectColor: g.subject.color,
          category: g.category,
          description: g.description,
          date: g.date,
          createdAt: g.createdAt,
        }));

        await offlineStorage.saveGrades(storedGrades);
        setOfflineGrades(storedGrades);
      } catch {
        // Failed to cache grades
      }
    },
    [],
  );

  // Load offline items on mount
  useEffect(() => {
    void loadOfflineGrades();
  }, [loadOfflineGrades]);

  return {
    offlineGrades,
    cacheGrades,
    hasOfflineGrades: offlineGrades.length > 0,
  };
}
