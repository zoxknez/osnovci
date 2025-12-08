import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCardAction,
  createDeckAction,
  deleteDeckAction,
  getDeckAction,
  getDecksAction,
} from "@/app/actions/flashcards";

export const flashcardKeys = {
  all: ["flashcards"] as const,
  deck: (id: string) => ["flashcards", id] as const,
};

export function useFlashcardDecks() {
  return useQuery({
    queryKey: flashcardKeys.all,
    queryFn: async () => {
      const result = await getDecksAction();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useFlashcardDeck(id: string) {
  return useQuery({
    queryKey: flashcardKeys.deck(id),
    queryFn: async () => {
      const result = await getDeckAction(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      subjectId: string;
      color?: string;
    }) => {
      const result = await createDeckAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteDeckAction(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      data,
    }: {
      deckId: string;
      data: { front: string; back: string };
    }) => {
      const result = await createCardAction(deckId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: flashcardKeys.deck(variables.deckId),
      });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}
