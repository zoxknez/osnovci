"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  hasParentPIN,
  setParentPIN,
  verifyParentPIN,
} from "@/lib/auth/parental-lock";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

const setPinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN mora biti 4-6 cifara"),
  currentPin: z.string().optional(),
});

export async function setGuardianPinAction(data: z.infer<typeof setPinSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = setPinSchema.safeParse(data);
    if (!validated.success)
      return { success: false, error: "Validation error" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { guardian: true },
    });

    if (!user?.guardian) {
      return { success: false, error: "Samo roditelji mogu postaviti PIN" };
    }

    const { pin, currentPin } = validated.data;

    if (await hasParentPIN(user.guardian.id)) {
      if (!currentPin) {
        return {
          success: false,
          error: "Morate uneti trenutni PIN za promenu",
        };
      }

      const isCurrentValid = await verifyParentPIN(
        currentPin,
        user.guardian.id,
      );
      if (!isCurrentValid) {
        return { success: false, error: "Trenutni PIN nije tačan" };
      }
    }

    const result = await setParentPIN(user.guardian.id, pin);

    if (!result.success) {
      return { success: false, error: result.error || "Failed to set PIN" };
    }

    return { success: true, message: "PIN je uspešno postavljen" };
  } catch (error) {
    log.error("setGuardianPinAction error", error);
    return { success: false, error: "Failed to set PIN" };
  }
}

export async function checkGuardianPinStatusAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { guardian: true },
    });

    if (!user?.guardian) {
      return { success: false, error: "Samo roditelji imaju PIN" };
    }

    const hasPIN = await hasParentPIN(user.guardian.id);

    return { success: true, hasPIN };
  } catch (error) {
    log.error("checkGuardianPinStatusAction error", error);
    return { success: false, error: "Failed to check PIN status" };
  }
}
