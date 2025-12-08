"use server";

import { z } from "zod";
import { askAiTutor } from "@/lib/ai/tutor-service";
import { auth } from "@/lib/auth/config";

const chatSchema = z
  .object({
    subjectId: z.string().optional(),
    query: z.string().optional(),
    imageUrl: z.string().optional(),
    persona: z.string().optional(),
  })
  .refine((data) => data.query || data.imageUrl, {
    message: "Either query or imageUrl must be provided",
  });

export type ActionState<T = any> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function chatWithAiAction(data: {
  query?: string;
  imageUrl?: string;
  subjectId?: string;
  persona?: string;
}): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  if (session.user.role !== "STUDENT") {
    return { error: "Samo učenici mogu koristiti AI nastavnika" };
  }

  const validated = chatSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nevalidni podaci" };
  }

  try {
    const result = await askAiTutor({
      studentId: session.user.student!.id,
      ...validated.data,
    });

    if (!result.success) {
      return { error: result.error || "Unknown error" };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("AI Chat error:", error);
    return { error: "Greška prilikom komunikacije sa AI nastavnikom" };
  }
}
