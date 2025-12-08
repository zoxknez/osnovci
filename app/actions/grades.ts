"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { CreateGradeSchema } from "@/lib/api/schemas/grades";
import { auth } from "@/lib/auth/config";
import {
  getCachedGrades,
  invalidateGradesCache,
  setCachedGrades,
} from "@/lib/cache/redis";
import { prisma } from "@/lib/db/prisma";

export type ActionState = {
  success?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  data?: any;
};

export async function createGradeAction(
  data: z.infer<typeof CreateGradeSchema>,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  // Validate input
  const validated = CreateGradeSchema.safeParse(data);
  if (!validated.success) {
    return {
      error: "Nevalidni podaci",
      details: validated.error.flatten().fieldErrors,
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

    // Create grade
    const grade = await prisma.grade.create({
      data: {
        studentId: user.student.id,
        subjectId: validated.data.subjectId,
        grade: validated.data.grade,
        category: validated.data.category,
        description: validated.data.description ?? null,
        weight: validated.data.weight,
        date: validated.data.date ? new Date(validated.data.date) : new Date(),
      },
    });

    // Invalidate cache
    await invalidateGradesCache(user.student.id);

    // Log activity
    /* 
    // TODO: Add GRADE_ADDED to ActivityType enum
    await prisma.activityLog.create({
      data: {
        studentId: user.student.id,
        type: "GRADE_ADDED", 
        description: `Dodata ocena: ${grade.grade} iz predmeta ${grade.subjectId}`,
      } as any,
    });
    */

    // Revalidate paths
    revalidatePath("/dashboard/ocene");
    revalidatePath("/dashboard");

    return { success: true, data: grade };
  } catch (error) {
    console.error("Create grade error:", error);
    return { error: "Greška prilikom dodavanja ocene" };
  }
}

export async function deleteGradeAction(id: string): Promise<ActionState> {
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
    const existing = await prisma.grade.findUnique({
      where: { id },
    });

    if (!existing || existing.studentId !== user.student.id) {
      return { error: "Ocena nije pronađena ili nemate pristup" };
    }

    await prisma.grade.delete({
      where: { id },
    });

    // Invalidate cache
    await invalidateGradesCache(user.student.id);

    revalidatePath("/dashboard/ocene");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete grade error:", error);
    return { error: "Greška prilikom brisanja ocene" };
  }
}

export async function getGradesAction(): Promise<ActionState> {
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
      const cached = await getCachedGrades(studentIds[0]);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const grades = await prisma.grade.findMany({
      where: {
        studentId: { in: studentIds },
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Set cache for single student
    if (studentIds.length === 1 && studentIds[0]) {
      await setCachedGrades(studentIds[0], grades);
    }

    return { success: true, data: grades };
  } catch (error) {
    console.error("Get grades error:", error);
    return { error: "Greška prilikom učitavanja ocena" };
  }
}
