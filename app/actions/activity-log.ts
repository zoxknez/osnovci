"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getActivityLog } from "@/lib/tracking/activity-logger";

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

export async function getActivityLogAction(
  studentId: string,
  limit: number = 50,
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Verify parent has access to this student
    const guardian = await prisma.guardian.findUnique({
      where: { userId: session.user.id },
      include: {
        links: {
          where: {
            studentId,
            isActive: true,
          },
        },
      },
    });

    if (!guardian || guardian.links.length === 0) {
      return { error: "Nemate pristup ovom detetu" };
    }

    // Get activity log
    const activities = await getActivityLog(studentId, limit);

    return {
      data: {
        activities,
        count: activities.length,
      },
    };
  } catch (error) {
    console.error("Error getting activity log:", error);
    return { error: "Greška pri učitavanju activity log-a" };
  }
}
