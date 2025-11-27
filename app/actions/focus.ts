"use server";

import { auth } from "@/lib/auth/config";
import { startFocusSession, endFocusSession } from "@/lib/focus/focus-service";
import { log } from "@/lib/logger";
import { FocusStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

type ActionResponse<T = unknown> = {
  data?: T;
  error?: string | undefined;
};

async function getStudent() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    throw new Error("Unauthorized");
  }
  return session.user.student!;
}

export async function startFocusSessionAction(
  subjectId?: string,
  duration?: number
): Promise<ActionResponse> {
  try {
    const student = await getStudent();

    const result = await startFocusSession({
      studentId: student.id,
      subjectId,
      duration,
    });

    if (!result.success) {
      return { error: result.error };
    }

    revalidatePath("/dashboard/fokus");
    return { data: result.session };
  } catch (error) {
    log.error("Action Error: Start Focus", { error });
    return { error: error instanceof Error ? error.message : "Failed to start focus session" };
  }
}

export async function endFocusSessionAction(
  sessionId: string,
  status: "COMPLETED" | "ABORTED"
): Promise<ActionResponse> {
  try {
    const student = await getStudent();

    const focusStatus = status === "COMPLETED" ? FocusStatus.COMPLETED : FocusStatus.ABORTED;

    const result = await endFocusSession(
      sessionId,
      student.id,
      focusStatus
    );

    if (!result.success) {
      return { error: result.error };
    }

    revalidatePath("/dashboard/fokus");
    return { 
      data: {
        success: true,
        xpEarned: result.xpEarned,
        session: result.session,
      }
    };
  } catch (error) {
    log.error("Action Error: End Focus", { error });
    return { error: error instanceof Error ? error.message : "Failed to end focus session" };
  }
}
