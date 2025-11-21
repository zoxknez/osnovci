"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const shiftSettingsSchema = z.object({
  enabled: z.boolean(),
  referenceDate: z.string().optional(), // ISO date string
  referenceType: z.enum(["A", "B"]).optional(),
});

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

async function getStudent() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
}

export async function getShiftSettingsAction(): Promise<ActionResponse> {
  try {
    const student = await getStudent();

    return {
      data: {
        shiftSystemEnabled: student.shiftSystemEnabled,
        shiftReferenceDate: student.shiftReferenceDate,
        shiftReferenceType: student.shiftReferenceType,
      },
    };
  } catch (error) {
    console.error("Error getting shift settings:", error);
    return { error: error instanceof Error ? error.message : "Internal Error" };
  }
}

export async function updateShiftSettingsAction(data: z.infer<typeof shiftSettingsSchema>): Promise<ActionResponse> {
  try {
    const student = await getStudent();
    const validated = shiftSettingsSchema.parse(data);

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        shiftSystemEnabled: validated.enabled,
        shiftReferenceDate: validated.referenceDate ? new Date(validated.referenceDate) : undefined,
        shiftReferenceType: validated.referenceType,
      },
    });

    revalidatePath("/dashboard/podesavanja");
    return { data: updated };
  } catch (error) {
    console.error("Error updating shift settings:", error);
    return { error: error instanceof Error ? error.message : "Internal Error" };
  }
}
