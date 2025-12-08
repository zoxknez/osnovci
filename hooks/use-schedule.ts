import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createScheduleAction,
  deleteScheduleAction,
  getScheduleAction,
  updateScheduleAction,
} from "@/app/actions/schedule";
import type {
  CreateScheduleInput,
  PaginatedSchedule,
  UpdateScheduleInput,
} from "@/lib/api/schemas/schedule";

// Keys for React Query
export const scheduleKeys = {
  all: ["schedule"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...scheduleKeys.lists(), filters] as const,
  details: () => [...scheduleKeys.all, "detail"] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
};

// Fetch schedule sa filterima
async function fetchSchedule(
  filters: Record<string, unknown> = {},
): Promise<PaginatedSchedule> {
  // Prosleđujemo dayOfWeek filter ako postoji
  const scheduleFilters: { dayOfWeek?: string } = {};
  const dayOfWeekValue = filters["dayOfWeek"];
  if (dayOfWeekValue && typeof dayOfWeekValue === "string") {
    scheduleFilters.dayOfWeek = dayOfWeekValue;
  }

  const result = await getScheduleAction(scheduleFilters);
  if (result.error) throw new Error(result.error);

  // Wrap response u PaginatedSchedule format
  const data = result.data || [];
  return {
    data,
    pagination: {
      page: 1,
      limit: data.length,
      total: data.length,
      pages: 1,
    },
  };
}

// Hooks

export function useSchedule(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: () => fetchSchedule(filters),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduleInput) => {
      const result = await createScheduleAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      toast.success("Čas uspešno dodat");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateScheduleInput;
    }) => {
      const result = await updateScheduleAction(id, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      toast.success("Čas uspešno ažuriran");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteScheduleAction(id);
      if (result.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      toast.success("Čas uspešno obrisan");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
