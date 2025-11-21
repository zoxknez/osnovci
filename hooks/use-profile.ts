import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FullProfile, 
  UpdateProfileInput 
} from "@/lib/api/schemas/profile";
import { toast } from "sonner";
import { getProfileAction, updateProfileAction } from "@/app/actions/profile";

// Keys for React Query
export const profileKeys = {
  all: ["profile"] as const,
  details: () => [...profileKeys.all, "detail"] as const,
};

// Hooks

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.details(),
    queryFn: async () => {
      const result = await getProfileAction();
      if (result.error) throw new Error(result.error);
      return result.data as FullProfile;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const result = await updateProfileAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.details() });
      toast.success("Profil uspešno ažuriran");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
