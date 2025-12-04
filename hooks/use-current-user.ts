/**
 * Hook: Get Current User Info
 * Client-side hook za dobijanje informacija o trenutnom korisniku
 */

"use client";

import { useQuery } from "@tanstack/react-query";

interface UserInfo {
  id: string;
  email: string | null;
  role: "STUDENT" | "GUARDIAN";
  student?: {
    id: string;
    name: string;
    grade: number;
    school: string;
  };
  guardian?: {
    id: string;
    name: string;
  };
}

export function useCurrentUser() {
  return useQuery<UserInfo>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await fetch("/api/user/me", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      return data.user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

