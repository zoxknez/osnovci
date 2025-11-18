/**
 * React Query Configuration
 * 
 * Provides optimized server state management with:
 * - Smart caching strategies
 * - Automatic background refetching
 * - Optimistic updates
 * - Query invalidation patterns
 * - Prefetching for better UX
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

// Default query options for all queries
const defaultOptions = {
  queries: {
    // Cache time: How long data stays in cache after becoming unused
    gcTime: 1000 * 60 * 60, // 1 hour
    
    // Stale time: How long data is considered fresh
    staleTime: 1000 * 60 * 5, // 5 minutes
    
    // Refetch on window focus (for real-time data)
    refetchOnWindowFocus: true,
    
    // Refetch on mount if data is stale
    refetchOnMount: true,
    
    // Retry failed requests
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Network mode (for offline support)
    networkMode: "online" as const,
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    
    // Network mode for mutations
    networkMode: "online" as const,
  },
};

// Custom stale times for different data types
export const STALE_TIMES = {
  // Very frequently changing data
  REALTIME: 0, // Always refetch
  
  // Frequently changing data (homework, calendar)
  FREQUENT: 1000 * 60 * 2, // 2 minutes
  
  // Moderately changing data (grades, schedule)
  MODERATE: 1000 * 60 * 10, // 10 minutes
  
  // Rarely changing data (student profile, subjects)
  RARE: 1000 * 60 * 60, // 1 hour
  
  // Almost static data (settings, constants)
  STATIC: 1000 * 60 * 60 * 24, // 24 hours
} as const;

// Query keys factory (for consistency and type safety)
export const queryKeys = {
  // Student queries
  student: (id: string) => ["student", id] as const,
  studentProfile: (id: string) => ["student", id, "profile"] as const,
  
  // Homework queries
  homework: (studentId: string) => ["homework", studentId] as const,
  homeworkList: (studentId: string, filters?: Record<string, unknown>) =>
    ["homework", studentId, "list", filters] as const,
  homeworkDetail: (id: string) => ["homework", "detail", id] as const,
  homeworkStats: (studentId: string, period?: string) =>
    ["homework", studentId, "stats", period] as const,
  
  // Schedule queries
  schedule: (studentId: string) => ["schedule", studentId] as const,
  scheduleWeek: (studentId: string, week?: string) =>
    ["schedule", studentId, "week", week] as const,
  
  // Grade queries
  grades: (studentId: string) => ["grades", studentId] as const,
  gradesList: (studentId: string, period?: string) =>
    ["grades", studentId, "list", period] as const,
  gradesStats: (studentId: string, period?: string) =>
    ["grades", studentId, "stats", period] as const,
  
  // Calendar queries
  calendar: (studentId: string) => ["calendar", studentId] as const,
  calendarView: (studentId: string, view: string, date: string) =>
    ["calendar", studentId, view, date] as const,
  
  // Analytics queries
  insights: (studentId: string) => ["insights", studentId] as const,
  engagementScore: (studentId: string) =>
    ["insights", studentId, "engagement"] as const,
  
  // Subject queries
  subjects: () => ["subjects"] as const,
  subject: (id: string) => ["subjects", id] as const,
} as const;

// Query invalidation helpers
export function invalidateStudentQueries(queryClient: QueryClient, studentId: string) {
  queryClient.invalidateQueries({ queryKey: ["student", studentId] });
  queryClient.invalidateQueries({ queryKey: ["homework", studentId] });
  queryClient.invalidateQueries({ queryKey: ["schedule", studentId] });
  queryClient.invalidateQueries({ queryKey: ["grades", studentId] });
  queryClient.invalidateQueries({ queryKey: ["calendar", studentId] });
  queryClient.invalidateQueries({ queryKey: ["insights", studentId] });
}

export function invalidateHomeworkQueries(queryClient: QueryClient, studentId: string) {
  queryClient.invalidateQueries({ queryKey: ["homework", studentId] });
  queryClient.invalidateQueries({ queryKey: ["calendar", studentId] });
  queryClient.invalidateQueries({ queryKey: ["insights", studentId] });
}

export function invalidateCalendarQueries(queryClient: QueryClient, studentId: string) {
  queryClient.invalidateQueries({ queryKey: ["calendar", studentId] });
  queryClient.invalidateQueries({ queryKey: ["schedule", studentId] });
}

// Prefetch helpers (for hover/navigation)
export async function prefetchHomeworkDetail(
  queryClient: QueryClient,
  homeworkId: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.homeworkDetail(homeworkId),
    queryFn: () => fetch(`/api/homework/${homeworkId}`).then((res) => res.json()),
    staleTime: STALE_TIMES.FREQUENT,
  });
}

export async function prefetchCalendarView(
  queryClient: QueryClient,
  studentId: string,
  view: string,
  date: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.calendarView(studentId, view, date),
    queryFn: () =>
      fetch(`/api/calendar?studentId=${studentId}&view=${view}&date=${date}`).then(
        (res) => res.json()
      ),
    staleTime: STALE_TIMES.FREQUENT,
  });
}

// React Query Provider component
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions,
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}
