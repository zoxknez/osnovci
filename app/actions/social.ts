"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStickers } from "@/lib/social/sticker-service";

const sendStickerSchema = z.object({
  receiverId: z.string(),
  stickerId: z.string(),
});

export type ActionState<T = any> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function getStickersAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const stickers = await getStickers();
    return { success: true, data: stickers };
  } catch (error) {
    console.error("Get stickers error:", error);
    return { error: "Greška prilikom učitavanja stikera" };
  }
}

export async function sendStickerAction(data: { receiverId: string; stickerId: string }): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = sendStickerSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  const { receiverId, stickerId } = validated.data;

  try {
    const sender = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { gamification: true },
    });

    if (!sender) {
      return { error: "Pošiljalac nije pronađen" };
    }

    if (!sender.gamification) {
      return { error: "Gamifikacija nije pronađena" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const sticker = await tx.sticker.findUnique({ where: { id: stickerId } });
      if (!sticker) throw new Error("Stiker nije pronađen");

      if (sender.gamification!.xp < sticker.cost) {
        throw new Error("Nemaš dovoljno XP-a");
      }

      if (sender.gamification!.level < sticker.minLevel) {
        throw new Error(`Potreban je nivo ${sticker.minLevel}`);
      }

      // Deduct XP
      await tx.gamification.update({
        where: { studentId: sender.id },
        data: { xp: { decrement: sticker.cost } },
      });

      // Create log
      const log = await tx.stickerLog.create({
        data: {
          senderId: sender.id,
          receiverId: receiverId,
          stickerId: stickerId,
        },
      });

      return log;
    });

    revalidatePath("/dashboard/drustvo");
    revalidatePath("/dashboard"); // Update XP

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Send sticker error:", error);
    return { error: error.message || "Greška prilikom slanja stikera" };
  }
}
