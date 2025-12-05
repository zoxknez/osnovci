"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useInventory } from "@/lib/hooks/use-shop";

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

// Helper to get vertical offset based on item type
function getItemOffset(item: ShopItem): string {
  const type = item.type.toLowerCase();
  if (type === "head" || type === "hat") return "-40px";
  if (type === "face" || type === "glasses") return "0px";
  return "0px";
}

export function AvatarPreview({ previewItem }: AvatarPreviewProps) {
  const { data: inventoryData } = useInventory();
  const inventory = (inventoryData ?? []) as InventoryItem[];

  const equippedItems = inventory.filter((i) => i.equipped);

  // If previewing an item, filter out any equipped item of the same type
  const displayItems = [...equippedItems];

  if (previewItem) {
    // Check if we already own/equipped it to avoid duplicates
    const isEquipped = equippedItems.some((i) => i.itemId === previewItem.id);
    if (!isEquipped) {
      displayItems.push({
        id: "preview",
        item: previewItem,
        equipped: true,
        studentId: "",
        itemId: previewItem.id,
        purchasedAt: new Date(),
      });
    }
  }

  return (
    <Card
      className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 min-h-[300px]"
      role="img"
      aria-label={`Avatar sa ${displayItems.length} opremljenih predmeta${previewItem ? `, pregled: ${previewItem.name}` : ""}`}
    >
      <div className="relative w-40 h-40">
        {/* Base Avatar (Emoji for now) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-8xl z-10"
          aria-hidden="true"
        >
          🧑
        </div>

        {/* Equipped Items Layered */}
        {displayItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center text-6xl z-20 pointer-events-none"
            style={{ top: getItemOffset(item.item) }}
            aria-hidden="true"
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
