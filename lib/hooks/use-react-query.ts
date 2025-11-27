/**
 * React Query Hooks
 * Client-side data fetching with caching
 */

import type { Grade, Homework, Subject } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Get CSRF headers (imported dynamically to avoid circular dependency)
 */
function getCsrfHeaders(): Record<string, string> {
  // Access CSRF token from context or sessionStorage
  if (typeof window !== "undefined") {
    const token = window.sessionStorage.getItem("csrf-token");
    const secret = window.sessionStorage.getItem("csrf-secret");
    if (token && secret) {
      return {
        "x-csrf-token": token,
        "x-csrf-secret": secret,
      };
    }
  }
  return {};
}

/**
 * Query Keys - centralizovano za lakše invalidation
 */
export const queryKeys = {
  homework: ["homework"] as const,
  homeworkById: (id: string) => ["homework", id] as const,
  grades: ["grades"] as const,
  subjects: ["subjects"] as const,
  schedule: ["schedule"] as const,
  profile: ["profile"] as const,
  notifications: ["notifications"] as const,
};

/**
 * Generic fetch helper
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const csrfHeaders = getCsrfHeaders();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...csrfHeaders, // Add CSRF headers for POST/PUT/DELETE
      ...options?.headers,
    },
  });

  if (!res.ok) {
    // Create error with status code
    const errorData = await res
      .json()
      .catch(() => ({ message: "API request failed" }));
    const error: any = new Error(errorData.message || "API request failed");
    error.status = res.status;
    error.statusText = res.statusText;

    // Handle auth errors - redirect to login
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        window.location.href = `/prijava?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    throw error;
  }

  return res.json();
}

/**
 * Custom retry logic for queries
 * Don't retry on auth errors (401/403)
 */
function customRetry(failureCount: number, error: any): boolean {
  // Never retry auth errors
  if (error?.status === 401 || error?.status === 403) {
    return false;
  }

  // Don't retry client errors (4xx except auth)
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }

  // Retry server errors (5xx) up to 2 times
  if (error?.status >= 500 && failureCount < 2) {
    return true;
  }

  // Retry network errors up to 2 times
  if (!error?.status && failureCount < 2) {
    return true;
  }

  return false;
}

import { 
  getHomeworkAction, 
  getHomeworkByIdAction, 
  createHomeworkAction, 
  updateHomeworkAction, 
  deleteHomeworkAction 
} from "@/app/actions/homework";

// ...

/**
 * useHomework - Fetch all homework with pagination
 */
interface HomeworkResponse {
  success: boolean;
  data: Homework[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useHomework(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
  status?: string;
}) {
  // ... (keep params logic if needed for query key, but action takes object)
  
  return useQuery({
    queryKey: [...queryKeys.homework, params],
    queryFn: async () => {
        const result = await getHomeworkAction(params as any);
        if (result.error) throw new Error(result.error);
        // Result data structure matches HomeworkResponse (data, pagination)
        // But getHomeworkAction returns { success: true, data: { data: ..., pagination: ... } }
        // So result.data is { data: ..., pagination: ... }
        // We need to return { success: true, ...result.data } to match HomeworkResponse interface
        return { success: true, ...result.data } as HomeworkResponse;
    },
    retry: customRetry, // Custom retry logic
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch if data is fresh
  });
}

/**
 * useHomeworkById - Fetch single homework
 */
export function useHomeworkById(id: string) {
  return useQuery({
    queryKey: queryKeys.homeworkById(id),
    queryFn: async () => {
        const result = await getHomeworkByIdAction(id);
        if (result.error) throw new Error(result.error);
        return result.data as Homework;
    },
    enabled: !!id, // Only run if ID exists
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * useCreateHomework - Create new homework
 */
export function useCreateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Homework>) => {
        const result = await createHomeworkAction(data as any);
        if (result.error) throw new Error(result.error);
        return result.data as Homework;
    },
    onSuccess: () => {
      // Invalidate homework list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.homework });
    },
  });
}

/**
 * useUpdateHomework - Update homework
 */
export function useUpdateHomework(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Homework>) => {
        const result = await updateHomeworkAction(id, data as any);
        if (result.error) throw new Error(result.error);
        return result.data as Homework;
    },
    onSuccess: () => {
      // Invalidate specific homework and list
      queryClient.invalidateQueries({ queryKey: queryKeys.homeworkById(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homework });
    },
  });
}

/**
 * useDeleteHomework - Delete homework
 */
export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
        const result = await deleteHomeworkAction(id);
        if (result.error) throw new Error(result.error);
        return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homework });
    },
  });
}

import { getGradesAction } from "@/app/actions/grades";

// ...

/**
 * useGrades - Fetch all grades with stats
 */
interface GradesResponse {
  success: boolean;
  data: Grade[];
  stats: {
    average: number;
    total: number;
    byCategory: Record<string, number>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useGrades(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
  subjectId?: string;
  category?: string;
  period?: string;
}) {
  // ... (keep params logic if needed for query key)
  
  return useQuery({
    queryKey: [...queryKeys.grades, params],
    queryFn: async () => {
        const result = await getGradesAction();
        if (result.error) throw new Error(result.error);
        // Result data structure matches GradesResponse (data, stats, pagination)
        // But getGradesAction returns { success: true, data: { data: ..., stats: ..., pagination: ... } }
        // So result.data is { data: ..., stats: ..., pagination: ... }
        // We need to return { success: true, ...result.data } to match GradesResponse interface
        return { success: true, ...result.data } as GradesResponse;
    },
    retry: customRetry, // Custom retry logic
    staleTime: 1000 * 60 * 10, // 10 min (grades change less frequently)
    gcTime: 1000 * 60 * 30, // Cache for 30 minutes (was cacheTime)
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnReconnect: true, // Refetch when back online
  });
}

/**
 * useSubjects - Fetch all subjects
 */
export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: async () => {
      const result = await getSubjectsAction();
      if (result.error) throw new Error(result.error);
      return result.data as Subject[];
    },
    staleTime: 1000 * 60 * 30, // 30 min (subjects rarely change)
  });
}

import { getScheduleAction } from "@/app/actions/schedule";

import { getSubjectsAction } from "@/app/actions/subjects";

import { 
  getNotificationsAction, 
  markNotificationsAsReadAction 
} from "@/app/actions/notifications";

// ...

/**
 * useSchedule - Fetch schedule
 */
interface ScheduleEntryWithSubject {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: { id: string; name: string; color: string; icon: string | null };
  classroom: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleResponse {
  success: boolean;
  data: ScheduleEntryWithSubject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useSchedule(params?: { dayOfWeek?: string; limit?: number }) {
  // ... (keep params logic if needed for query key)

  return useQuery({
    queryKey: [...queryKeys.schedule, params],
    queryFn: async () => {
        const result = await getScheduleAction();
        if (result.error) throw new Error(result.error);
        // Result data structure matches ScheduleResponse (data, pagination)
        // But getScheduleAction returns { success: true, data: { data: ..., pagination: ... } }
        // So result.data is { data: ..., pagination: ... }
        // We need to return { success: true, ...result.data } to match ScheduleResponse interface
        return { success: true, ...result.data } as ScheduleResponse;
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
}

import { getProfileAction } from "@/app/actions/profile";

// ...

/**
 * useProfile - Fetch user profile
 */
interface ProfileResponse {
  success: boolean;
  profile: {
    id: string;
    name: string | null;
    email: string;
    xp: number;
    level: number;
  };
  stats: {
    totalHomework: number;
    completedHomework: number;
  };
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const result = await getProfileAction();
      if (result.error) throw new Error(result.error);
      // Return data in the structure expected by consumers of this hook
      // or just return result.data if consumers are flexible.
      // Since I don't see usages of this specific hook, I'll return result.data
      // but cast it or wrap it to match ProfileResponse if needed.
      // Actually, result.data is { profile: ..., stats: ... }
      // ProfileResponse expects { success: boolean, profile: ..., stats: ... }
      // But usually useQuery data is just the data payload.
      // The fetchApi implementation returns res.json().
      // If the API returned { success: true, profile: ..., stats: ... }
      // Then data would be that object.
      
      // I'll construct the object to be safe.
      return {
        success: true,
        profile: result.data?.profile,
        stats: result.data?.stats
      } as unknown as ProfileResponse;
    },
    retry: customRetry, // Custom retry logic
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

/**
 * useNotifications - Fetch notifications
 */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const result = await getNotificationsAction();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 1000 * 60 * 1, // 1 min (fresh notifications)
    refetchInterval: 1000 * 60 * 1, // Refetch every minute
  });
}

/**
 * useMarkNotificationAsRead - Mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markNotificationsAsReadAction([id]);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

/**
 * Prefetch helper - za preload podataka pre negotiation
 */
export function usePrefetchHomework() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.homework,
      queryFn: () => fetchApi<Homework[]>("/api/homework"),
    });
  };
}
