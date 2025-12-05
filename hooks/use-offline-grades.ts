// Hook za offline grades management
"use client";

import { useCallback, useEffect, useState } from "react";
import { offlineStorage, type StoredGrade } from "@/lib/db/offline-storage";

// Input type for grades from API - exported for use in components
export interface GradeInput {
  id: string;
  grade: string | number;
  subject?: {
    id: string;
    name: string;
    color?: string;
  };
  category?: string;
  description?: string;
  date?: string | Date;
  createdAt?: string | Date;
}

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

  const cacheGrades = useCallback(async (grades: GradeInput[]) => {
    try {
      // Map API response to StoredGrade format
      const storedGrades: StoredGrade[] = grades.map((g) => {
        // Convert Date to string if needed
        const dateStr =
          typeof g.date === "object" && g.date instanceof Date
            ? g.date.toISOString()
            : g.date || new Date().toISOString();
        const createdAtStr =
          typeof g.createdAt === "object" && g.createdAt instanceof Date
            ? g.createdAt.toISOString()
            : g.createdAt || new Date().toISOString();

        const stored: StoredGrade = {
          id: g.id,
          grade: typeof g.grade === "string" ? parseInt(g.grade, 10) : g.grade,
          subjectId: g.subject?.id || "",
          subjectName: g.subject?.name || "Nepoznat predmet",
          subjectColor: g.subject?.color || "#3b82f6",
          category: g.category || "",
          date: dateStr,
          createdAt: createdAtStr,
        };
        if (g.description) {
          stored.description = g.description;
        }
        return stored;
      });

      await offlineStorage.saveGrades(storedGrades);
      setOfflineGrades(storedGrades);
    } catch {
      // Failed to cache grades
    }
  }, []);

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
