import { useQuery } from "@tanstack/react-query";
import { getGamificationProfile } from "@/app/actions/gamification";

export function useGamification() {
  return useQuery({
    queryKey: ["gamification"],
    queryFn: async () => {
      const result = await getGamificationProfile();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}
