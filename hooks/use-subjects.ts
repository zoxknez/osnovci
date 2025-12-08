import { useQuery } from "@tanstack/react-query";

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

// Keys for React Query
export const subjectKeys = {
  all: ["subjects"] as const,
  lists: () => [...subjectKeys.all, "list"] as const,
};

// Fetch subjects
async function fetchSubjects(): Promise<Subject[]> {
  const response = await fetch("/api/subjects");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Greška prilikom dohvatanja predmeta");
  }

  return response.json();
}

// Hooks

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.lists(),
    queryFn: fetchSubjects,
    staleTime: 1000 * 60 * 60, // 1 hour (subjects rarely change)
  });
}
