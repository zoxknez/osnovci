import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreateGradeInput, 
  PaginatedGrades 
} from "@/lib/api/schemas/grades";
import { toast } from "sonner";
import { createGradeAction, deleteGradeAction } from "@/app/actions/grades";

// Keys for React Query
export const gradeKeys = {
  all: ["grades"] as const,
  lists: () => [...gradeKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...gradeKeys.lists(), filters] as const,
  details: () => [...gradeKeys.all, "detail"] as const,
  detail: (id: string) => [...gradeKeys.details(), id] as const,
};

// Fetch grades (keeping API route for fetching for now as it supports complex filtering/pagination efficiently)
async function fetchGrades(_filters: Record<string, unknown> = {}): Promise<PaginatedGrades> {
  // Use Server Action
  const result = await import("@/app/actions/grades").then(mod => mod.getGradesAction());
  if (result.error) throw new Error(result.error);

  // Adapt to PaginatedGrades structure
  return {
    data: result.data,
    stats: {
      average: 0,
      total: result.data.length,
      byCategory: {},
      bySubject: []
    },
    pagination: {
      page: 1,
      limit: result.data.length,
      total: result.data.length,
      pages: 1
    }
  };
}

// Hooks

export function useGrades(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: gradeKeys.list(filters),
    queryFn: () => fetchGrades(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGradeInput) => {
      const result = await createGradeAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
      toast.success("Ocena uspešno dodata");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteGradeAction(id);
      if (result.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
      toast.success("Ocena uspešno obrisana");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
