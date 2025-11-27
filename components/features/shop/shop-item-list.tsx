"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/use-profile";
import { useBuyItem, useEquipItem, useInventory, useShopItems } from "@/lib/hooks/use-shop";
import { Eye, Loader2, Lock, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarPreview } from "./avatar-preview";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  type: string;
  assetUrl: string;
  previewUrl: string | null;
  minLevel: number;
  isPremium: boolean;
  createdAt: Date;
}

interface InventoryItem {
  id: string;
  studentId: string;
  itemId: string;
  equipped: boolean;
  purchasedAt: Date;
  item: ShopItem;
}

export function ShopItemList() {
  const { data: items, isLoading: itemsLoading } = useShopItems();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();
  const { data: profile } = useProfile();
  
  const { mutate: buyItem, isPending: isBuying } = useBuyItem();
  const { mutate: equipItem, isPending: isEquipping } = useEquipItem();

  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);

  if (itemsLoading || inventoryLoading) {
    return <div className="text-center py-8">Učitavanje prodavnice...</div>;
  }

  const handleBuy = (item: ShopItem) => {
    if (!profile?.profile) return;
    
    if (profile.profile.xp < item.cost) {
      toast.error("Nemaš dovoljno XP-a!");
      return;
    }

    buyItem(item.id, {
      onSuccess: () => {
        toast.success(`Kupio si ${item.name}!`);
      },
      onError: (err) => {
        toast.error(err.message || "Greška pri kupovini");
      },
    });
  };

  const handleEquip = (inventoryItem: InventoryItem) => {
    equipItem({
      itemId: inventoryItem.item.id,
      equipped: !inventoryItem.equipped,
    });
  };

  const categories = [
    { id: "all", label: "Sve" },
    { id: "head", label: "Kape" },
    { id: "face", label: "Naočare" },
    { id: "other", label: "Ostalo" },
  ];

  const filterItems = (category: string): ShopItem[] => {
    const typedItems = items as ShopItem[] | undefined;
    if (!typedItems) return [];
    if (category === "all") return typedItems;
    
    return typedItems.filter((item: ShopItem) => {
      const name = item.name.toLowerCase();
      if (category === "head") return name.includes("kapa") || name.includes("šešir") || name.includes("kruna") || name.includes("kaciga");
      if (category === "face") return name.includes("naočare");
      return !name.includes("kapa") && !name.includes("šešir") && !name.includes("kruna") && !name.includes("kaciga") && !name.includes("naočare");
    });
  };

  const typedInventory = inventory as InventoryItem[] | undefined;

  return (
    <>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.id} value={cat.id}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filterItems(cat.id).map((item) => {
                const ownedItem = typedInventory?.find((i: InventoryItem) => i.itemId === item.id);
                const isLocked = (profile?.profile?.level || 0) < item.minLevel;
                const canAfford = (profile?.profile?.xp || 0) >= item.cost;

                return (
                  <Card key={item.id} className={`flex flex-col ${isLocked ? "opacity-70" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="text-4xl mb-2">{item.assetUrl}</div>
                        {isLocked && <Lock className="h-4 w-4 text-gray-400" />}
                      </div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </CardHeader>
                    <CardContent className="flex-1 pb-2">
                      <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                        <span>⚡</span>
                        <span>{item.cost} XP</span>
                      </div>
                      {isLocked && (
                        <p className="text-xs text-red-500 mt-1">
                          Potreban nivo {item.minLevel}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2 gap-2">
                      {!ownedItem && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setPreviewItem(item)}
                          title="Probaj"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {ownedItem ? (
                        <Button
                          variant={ownedItem.equipped ? "secondary" : "outline"}
                          className="w-full"
                          onClick={() => handleEquip(ownedItem)}
                          disabled={isEquipping}
                        >
                          {ownedItem.equipped ? "Skini" : "Opremi"}
                        </Button>
                      ) : (
                        <Button
                          className="w-full gap-2"
                          disabled={isLocked || !canAfford || isBuying}
                          onClick={() => handleBuy(item)}
                        >
                          {isBuying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingBag className="h-4 w-4" />
                          )}
                          Kupi
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pregled: {previewItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AvatarPreview previewItem={previewItem} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewItem(null)}>Zatvori</Button>
            <Button 
              onClick={() => {
                if (previewItem) {
                  handleBuy(previewItem);
                  setPreviewItem(null);
                }
              }}
              disabled={!profile?.profile || !previewItem || profile.profile.xp < previewItem.cost}
            >
              Kupi za {previewItem?.cost} XP
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
