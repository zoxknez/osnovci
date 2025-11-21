import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreateHomeworkInput, 
  UpdateHomeworkInput, 
  HomeworkResponse, 
  PaginatedHomework 
} from "@/lib/api/schemas/homework";
import { toast } from "sonner";
import { 
  createHomeworkAction, 
  updateHomeworkAction, 
  getHomeworkAction, 
  deleteHomeworkAction,
  completeHomeworkAction
} from "@/app/actions/homework";

// Keys for React Query
export const homeworkKeys = {
  all: ["homework"] as const,
  lists: () => [...homeworkKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...homeworkKeys.lists(), filters] as const,
  details: () => [...homeworkKeys.all, "detail"] as const,
  detail: (id: string) => [...homeworkKeys.details(), id] as const,
};

// Fetch homework list
async function fetchHomework(filters: Record<string, unknown> = {}): Promise<PaginatedHomework> {
  const result = await getHomeworkAction(filters as any);
  if (result.error) throw new Error(result.error);
  return result.data;
}

// Create homework
export async function createHomework(data: CreateHomeworkInput): Promise<HomeworkResponse> {
  // Use Server Action
  const result = await createHomeworkAction(data);
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
}

// Update homework
async function updateHomework({ id, data }: { id: string; data: UpdateHomeworkInput }): Promise<HomeworkResponse> {
  // Use Server Action
  const result = await updateHomeworkAction(id, data);
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
}

// Delete homework
async function deleteHomework(id: string): Promise<void> {
  const result = await deleteHomeworkAction(id);
  if (result.error) throw new Error(result.error);
}

// Hooks

export function useHomework(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: homeworkKeys.list(filters),
    queryFn: () => fetchHomework(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHomework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      toast.success("Domaći zadatak uspešno kreiran");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHomework,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(data.id) });
      toast.success("Domaći zadatak uspešno ažuriran");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      toast.success("Domaći zadatak uspešno obrisan");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useMarkHomeworkComplete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
        const result = await completeHomeworkAction(id);
        if (result.error) throw new Error(result.error);
        return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(data.id) });
      toast.success("Domaći zadatak završen! +XP");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
