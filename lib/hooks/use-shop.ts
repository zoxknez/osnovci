import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getShopItemsAction, 
  getInventoryAction, 
  buyItemAction, 
  equipItemAction 
} from "@/app/actions/shop";

export const shopKeys = {
  items: ["shop", "items"] as const,
  inventory: ["shop", "inventory"] as const,
};

export function useShopItems() {
  return useQuery({
    queryKey: shopKeys.items,
    queryFn: async () => {
      const result = await getShopItemsAction();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useInventory() {
  return useQuery({
    queryKey: shopKeys.inventory,
    queryFn: async () => {
      const result = await getInventoryAction();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useBuyItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const result = await buyItemAction(itemId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory });
      // Also invalidate profile to update XP
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, equipped }: { itemId: string; equipped: boolean }) => {
      const result = await equipItemAction(itemId, equipped);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory });
    },
  });
}
