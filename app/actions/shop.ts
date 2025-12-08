"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const DEFAULT_ITEMS = [
  {
    name: "Zlatne Naočare",
    description: "Izgledaj pametno dok učiš!",
    cost: 500,
    type: "AVATAR_ACCESSORY",
    assetUrl: "👓",
    minLevel: 2,
  },
  {
    name: "Kruna",
    description: "Za kraljeve i kraljice znanja",
    cost: 1000,
    type: "AVATAR_ACCESSORY",
    assetUrl: "👑",
    minLevel: 5,
  },
  {
    name: "Superheroj Plašt",
    description: "Leti kroz domaće zadatke",
    cost: 750,
    type: "AVATAR_ACCESSORY",
    assetUrl: "🦸",
    minLevel: 3,
  },
  {
    name: "Detektivska Kapa",
    description: "Reši svaku misteriju",
    cost: 300,
    type: "AVATAR_ACCESSORY",
    assetUrl: "🕵️",
    minLevel: 1,
  },
  {
    name: "Svemirska Kaciga",
    description: "Za učenje koje nije sa ovog sveta",
    cost: 1500,
    type: "AVATAR_ACCESSORY",
    assetUrl: "👨‍🚀",
    minLevel: 10,
  },
  {
    name: "Čarobnjakov Šešir",
    description: "Magija znanja",
    cost: 600,
    type: "AVATAR_ACCESSORY",
    assetUrl: "🧙‍♂️",
    minLevel: 4,
  },
];

export type ActionState<T = any> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function getShopItemsAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    // Lazy seed
    const count = await prisma.shopItem.count();
    if (count === 0) {
      await prisma.shopItem.createMany({
        data: DEFAULT_ITEMS as any,
      });
    }

    const items = await prisma.shopItem.findMany({
      orderBy: { cost: "asc" },
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Get shop items error:", error);
    return { error: "Greška prilikom učitavanja prodavnice" };
  }
}

export async function getInventoryAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { error: "Učenik nije pronađen" };
    }

    const inventory = await prisma.userInventory.findMany({
      where: { studentId: student.id },
      include: {
        item: true,
      },
    });

    return { success: true, data: inventory };
  } catch (error) {
    console.error("Get inventory error:", error);
    return { error: "Greška prilikom učitavanja inventara" };
  }
}

export async function buyItemAction(itemId: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { error: "Učenik nije pronađen" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.shopItem.findUnique({ where: { id: itemId } });
      if (!item) throw new Error("Predmet nije pronađen");

      const gamification = await tx.gamification.findUnique({
        where: { studentId: student.id },
      });

      if (!gamification) throw new Error("Gamifikacija nije pronađena");

      if (gamification.xp < item.cost) {
        throw new Error("Nemaš dovoljno XP-a");
      }

      if (gamification.level < item.minLevel) {
        throw new Error(`Potreban je nivo ${item.minLevel}`);
      }

      const existing = await tx.userInventory.findUnique({
        where: {
          studentId_itemId: {
            studentId: student.id,
            itemId: itemId,
          },
        },
      });

      if (existing) {
        throw new Error("Već poseduješ ovaj predmet");
      }

      await tx.gamification.update({
        where: { studentId: student.id },
        data: { xp: { decrement: item.cost } },
      });

      const inventoryItem = await tx.userInventory.create({
        data: {
          studentId: student.id,
          itemId: itemId,
        },
      });

      return inventoryItem;
    });

    revalidatePath("/dashboard/prodavnica");
    revalidatePath("/dashboard"); // Update XP in header

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Buy item error:", error);
    return { error: error.message || "Greška prilikom kupovine" };
  }
}

export async function equipItemAction(
  itemId: string,
  equipped: boolean,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { error: "Učenik nije pronađen" };
    }

    const updated = await prisma.userInventory.update({
      where: {
        studentId_itemId: {
          studentId: student.id,
          itemId: itemId,
        },
      },
      data: {
        equipped,
      },
    });

    revalidatePath("/dashboard/prodavnica");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Equip item error:", error);
    return { error: "Greška prilikom opremanja predmeta" };
  }
}
