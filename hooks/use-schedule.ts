import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreateScheduleInput, 
  UpdateScheduleInput,
  PaginatedSchedule 
} from "@/lib/api/schemas/schedule";
import { toast } from "sonner";
import { 
  createScheduleAction, 
  updateScheduleAction, 
  deleteScheduleAction 
} from "@/app/actions/schedule";

// Keys for React Query
export const scheduleKeys = {
  all: ["schedule"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...scheduleKeys.lists(), filters] as const,
  details: () => [...scheduleKeys.all, "detail"] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
};

// Fetch schedule
async function fetchSchedule(filters: Record<string, unknown> = {}): Promise<PaginatedSchedule> {
  // Use Server Action
  const result = await import("@/app/actions/schedule").then(mod => mod.getScheduleAction());
  if (result.error) throw new Error(result.error);
  // Filter locally if needed since getScheduleAction returns all for student
  // But wait, getScheduleAction doesn't support filters yet in the same way?
  // The action returns { success: true, data: [...] }
  // The hook expects PaginatedSchedule { data: [...], pagination: ... }
  // We need to adapt the response or update the action.
  
  // Let's check getScheduleAction again.
  // It returns ActionState { data: any }
  // The data is ScheduleEntry[]
  
  // We need to wrap it to match PaginatedSchedule structure if the UI expects it
  // or update the UI to handle array.
  // Looking at DashboardPage: 
  // const todayClasses = ... Array.isArray(scheduleData?.data) ? scheduleData.data : [];
  // So it expects { data: [...] }
  
  return {
    data: result.data,
    pagination: {
      page: 1,
      limit: result.data.length,
      total: result.data.length,
      pages: 1
    }
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduleInput }) => {
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
