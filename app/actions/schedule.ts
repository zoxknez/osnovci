"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { CreateScheduleSchema, UpdateScheduleSchema } from "@/lib/api/schemas/schedule";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
  getCachedSchedule, 
  setCachedSchedule, 
  invalidateScheduleCache 
} from "@/lib/cache/redis";

export type ActionState = {
  success?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  data?: any;
};

export async function createScheduleAction(data: z.infer<typeof CreateScheduleSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  // Validate input
  const validated = CreateScheduleSchema.safeParse(data);
  if (!validated.success) {
    return { 
      error: "Nevalidni podaci", 
      details: validated.error.flatten().fieldErrors 
    };
  }

  try {
    // Get student ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return { error: "Korisnik nije učenik" };
    }

    // Create schedule entry
    const entry = await prisma.scheduleEntry.create({
      data: {
        studentId: user.student.id,
        subjectId: validated.data.subjectId ?? null,
        dayOfWeek: validated.data.dayOfWeek,
        startTime: validated.data.startTime,
        endTime: validated.data.endTime,
        room: validated.data.room ?? null,
        notes: validated.data.notes ?? null,
        isAWeek: validated.data.isAWeek,
        isBWeek: validated.data.isBWeek,
        isCustomEvent: validated.data.isCustomEvent,
        customTitle: validated.data.customTitle ?? null,
        customColor: validated.data.customColor ?? null,
        customDate: validated.data.customDate ? new Date(validated.data.customDate) : null,
      },
    });

    // Invalidate cache
    await invalidateScheduleCache(user.student.id);

    // Revalidate paths
    revalidatePath("/dashboard/raspored");
    revalidatePath("/dashboard");

    return { success: true, data: entry };
  } catch (error) {
    console.error("Create schedule error:", error);
    return { error: "Greška prilikom dodavanja časa" };
  }
}

export async function updateScheduleAction(id: string, data: z.infer<typeof UpdateScheduleSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = UpdateScheduleSchema.safeParse(data);
  if (!validated.success) {
    return { 
      error: "Nevalidni podaci", 
      details: validated.error.flatten().fieldErrors 
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return { error: "Korisnik nije učenik" };
    }

    // Verify ownership
    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existing || existing.studentId !== user.student.id) {
      return { error: "Čas nije pronađen ili nemate pristup" };
    }

    // Filter out undefined values to avoid overwriting with undefined (which might cause issues with exactOptionalPropertyTypes)
    const updateData = Object.fromEntries(
      Object.entries(validated.data).filter(([_, v]) => v !== undefined)
    ) as any;

    if (updateData.customDate) {
      updateData.customDate = new Date(updateData.customDate);
    }

    const entry = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    await invalidateScheduleCache(user.student.id);

    revalidatePath("/dashboard/raspored");
    revalidatePath("/dashboard");

    return { success: true, data: entry };
  } catch (error) {
    console.error("Update schedule error:", error);
    return { error: "Greška prilikom ažuriranja časa" };
  }
}

export async function deleteScheduleAction(id: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return { error: "Korisnik nije učenik" };
    }

    // Verify ownership
    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existing || existing.studentId !== user.student.id) {
      return { error: "Čas nije pronađen ili nemate pristup" };
    }

    await prisma.scheduleEntry.delete({
      where: { id },
    });

    // Invalidate cache
    await invalidateScheduleCache(user.student.id);

    revalidatePath("/dashboard/raspored");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete schedule error:", error);
    return { error: "Greška prilikom brisanja časa" };
  }
}

export async function getScheduleAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const studentIds: string[] = [];
    
    if (session.user.student?.id) {
        studentIds.push(session.user.student.id);
    }

    if (session.user.guardian) {
      const guardian = await prisma.guardian.findUnique({
        where: { id: session.user.guardian.id },
        include: {
          links: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      });
      if (guardian?.links) {
        guardian.links.forEach((link) => {
          studentIds.push(link.studentId);
        });
      }
    }
    
    if (studentIds.length === 0) {
        return { error: "Nema povezanih učenika" };
    }

    // Try cache for single student
    if (studentIds.length === 1 && studentIds[0]) {
      const cached = await getCachedSchedule(studentIds[0]);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const schedule = await prisma.scheduleEntry.findMany({
      where: {
        studentId: { in: studentIds },
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    // Set cache for single student
    if (studentIds.length === 1 && studentIds[0]) {
      await setCachedSchedule(studentIds[0], schedule);
    }

    return { success: true, data: schedule };
  } catch (error) {
    console.error("Get schedule error:", error);
    return { error: "Greška prilikom učitavanja rasporeda" };
  }
}
