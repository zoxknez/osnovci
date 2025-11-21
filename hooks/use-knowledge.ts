import {
  createKnowledgeResourceAction,
  deleteKnowledgeResourceAction,
  getKnowledgeResourcesAction,
  togglePinKnowledgeResourceAction,
} from "@/app/actions/knowledge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ResourceType = "NOTE" | "IMAGE" | "LINK" | "PDF";

export interface KnowledgeResource {
  id: string;
  title: string;
  type: ResourceType;
  content: string;
  tags: string | null;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    color: string;
  };
  isPinned: boolean;
  createdAt: string;
}

export function useKnowledge(subjectId?: string, type?: ResourceType) {
  const queryClient = useQueryClient();

  const { data: resources, isLoading } = useQuery({
    queryKey: ["knowledge", subjectId, type],
    queryFn: async () => {
      const res = await getKnowledgeResourcesAction(
        subjectId === "all" ? undefined : subjectId,
        (type as string) === "all" ? undefined : type
      );
      if (res.error) throw new Error(res.error);
      return res.data as KnowledgeResource[];
    },
  });

  const { mutate: addResource, isPending: isAdding } = useMutation({
    mutationFn: async (data: {
      title: string;
      type: ResourceType;
      content: string;
      subjectId: string;
      tags?: string[];
    }) => {
      const res = await createKnowledgeResourceAction(data);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Resurs dodat");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: () => {
      toast.error("Greška pri dodavanju");
    },
  });

  const { mutate: deleteResource, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteKnowledgeResourceAction(id);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("Resurs obrisan");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: () => {
      toast.error("Greška pri brisanju");
    },
  });

  const { mutate: togglePin } = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const res = await togglePinKnowledgeResourceAction(id, isPinned);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: () => {
      toast.error("Greška pri ažuriranju");
    },
  });

  return {
    resources,
    isLoading,
    addResource,
    isAdding,
    deleteResource,
    isDeleting,
    togglePin,
  };
}
