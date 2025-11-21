import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export interface SendStickerRequest {
  senderId: string;
  receiverId: string;
  stickerId: string;
  message?: string | undefined;
}

export interface SendStickerResponse {
  success: boolean;
  error?: string;
  stickerLogId?: string;
  remainingXp?: number;
}

/**
 * Get all available stickers
 */
export async function getStickers() {
  return await prisma.sticker.findMany({
    orderBy: { cost: "asc" },
  });
}

/**
 * Send a sticker to another student
 * Handles XP deduction and logging
 */
export async function sendSticker(request: SendStickerRequest): Promise<SendStickerResponse> {
  const { senderId, receiverId, stickerId, message } = request;

  try {
    // 1. Validate sender and receiver
    if (senderId === receiverId) {
      return { success: false, error: "Cannot send sticker to yourself" };
    }

    // 2. Get sticker cost and sender's XP
    const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
    if (!sticker) {
      return { success: false, error: "Sticker not found" };
    }

    const senderGamification = await prisma.gamification.findUnique({
      where: { studentId: senderId },
    });

    if (!senderGamification) {
      return { success: false, error: "Sender gamification profile not found" };
    }

    if (senderGamification.xp < sticker.cost) {
      return { success: false, error: "Not enough XP" };
    }

    // 3. Transaction: Deduct XP, Create Log
    const result = await prisma.$transaction(async (tx) => {
      // Deduct XP
      const updatedSender = await tx.gamification.update({
        where: { studentId: senderId },
        data: { xp: { decrement: sticker.cost } },
      });

      // Create Log
      const logEntry = await tx.stickerLog.create({
        data: {
          senderId,
          receiverId,
          stickerId,
          message: message ?? null,
        },
      });

      return { logEntry, updatedSender };
    });

    return {
      success: true,
      stickerLogId: result.logEntry.id,
      remainingXp: result.updatedSender.xp,
    };

  } catch (error) {
    log.error("Send Sticker Error", { error, senderId, receiverId, stickerId });
    return { success: false, error: "Failed to send sticker" };
  }
}

/**
 * Get stickers received by a student
 */
export async function getReceivedStickers(studentId: string, limit = 20) {
  return await prisma.stickerLog.findMany({
    where: { receiverId: studentId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sender: {
        select: { name: true, avatar: true }
      },
      sticker: true
    }
  });
}
