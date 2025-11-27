"use client";

import { Card } from "@/components/ui/card";
import { useInventory } from "@/lib/hooks/use-shop";
import { motion } from "framer-motion";

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

interface AvatarPreviewProps {
  previewItem?: ShopItem | null;
}

export function AvatarPreview({ previewItem }: AvatarPreviewProps) {
  const { data: inventory } = useInventory();

  const equippedItems = (inventory as InventoryItem[] | undefined)?.filter((i: InventoryItem) => i.equipped) || [];
  
  // If previewing an item, filter out any equipped item of the same type (if we had types)
  // For now, just add it to the list for display
  const displayItems = [...equippedItems];
  
  if (previewItem) {
    // Check if we already own/equipped it to avoid duplicates
    const isEquipped = equippedItems.some((i: InventoryItem) => i.itemId === previewItem.id);
    if (!isEquipped) {
      displayItems.push({ id: "preview", item: previewItem, equipped: true } as InventoryItem);
    }
  }

  return (
    <Card className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 min-h-[300px]">
      <div className="relative w-40 h-40">
        {/* Base Avatar (Emoji for now) */}
        <div className="absolute inset-0 flex items-center justify-center text-8xl z-10">
          🧑
        </div>

        {/* Equipped Items Layered */}
        {displayItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center text-6xl z-20 pointer-events-none"
            style={{
              // Simple positioning logic based on item name/type (mock)
              top: item.item.name.includes("Kapa") || item.item.name.includes("Šešir") || item.item.name.includes("Kruna") || item.item.name.includes("Kaciga") ? "-40px" : 
                   item.item.name.includes("Naočare") ? "0px" : "0px",
            }}
          >
            {item.item.assetUrl}
          </motion.div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <h3 className="font-bold text-lg text-blue-900">Tvoj Avatar</h3>
        <p className="text-sm text-blue-700">
          {previewItem ? "Pregled izgleda" : "Opremi ga u prodavnici!"}
        </p>
      </div>
    </Card>
  );
}
