"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { safeStringSchema } from "@/lib/security/validators";

export type ActionState = {
  success?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  data?: any;
};

const createSubjectSchema = z.object({
  name: safeStringSchema.min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  icon: safeStringSchema.max(50).optional(),
});

export async function getSubjectsAction(): Promise<ActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    // Use session student data
    if (!session.user.student) {
      return { success: true, data: [] };
    }

    // Dohvati subjects za ovog studenta
    const studentSubjects = await prisma.studentSubject.findMany({
      where: { studentId: session.user.student.id },
      include: {
        subject: true,
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    const subjects = studentSubjects.map((ss) => ss.subject);

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Get subjects error:", error);
    return { error: "Greška prilikom dohvatanja predmeta" };
  }
}

export async function createSubjectAction(data: z.infer<typeof createSubjectSchema>): Promise<ActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = createSubjectSchema.safeParse(data);

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

    const studentId = user.student.id;

    // Transaction to create subject and link it to student
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Subject
      const subject = await tx.subject.create({
        data: {
          name: validated.data.name,
          color: validated.data.color,
          ...(validated.data.icon && { icon: validated.data.icon }),
        },
      });

      // 2. Link to Student
      await tx.studentSubject.create({
        data: {
          studentId,
          subjectId: subject.id,
        },
      });

      return subject;
    });

    revalidatePath("/dashboard/predmeti");
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("Create subject error:", error);
    return { error: "Greška prilikom kreiranja predmeta" };
  }
}
