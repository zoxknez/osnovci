"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { CreateHomeworkSchema, UpdateHomeworkSchema, QueryHomeworkSchema, HomeworkStatus } from "@/lib/api/schemas/homework";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { trackHomeworkCompletion } from "@/lib/gamification/xp-system";
import { 
  getCachedHomeworkList, 
  setCachedHomeworkList, 
  invalidateHomeworkCache 
} from "@/lib/cache/redis";

export type ActionState = {
  success?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  data?: any;
};

export async function createHomeworkAction(data: z.infer<typeof CreateHomeworkSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  // Validate input
  const validated = CreateHomeworkSchema.safeParse(data);
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

    // Create homework
    const { description, notes, ...restData } = validated.data;
    const homework = await prisma.homework.create({
      data: {
        ...restData,
        description: description ?? null,
        notes: notes ?? null,
        studentId: user.student.id,
        status: "ASSIGNED",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        studentId: user.student.id,
        type: "HOMEWORK_CREATED",
        description: `Kreiran domaći zadatak: ${homework.title}`,
        metadata: { homeworkId: homework.id },
      },
    });

    // Invalidate cache
    await invalidateHomeworkCache(user.student.id);

    // Revalidate paths
    revalidatePath("/dashboard/domaci");
    revalidatePath("/dashboard");

    return { success: true, data: homework };
  } catch (error) {
    console.error("Create homework error:", error);
    return { error: "Greška prilikom kreiranja zadatka" };
  }
}

export async function updateHomeworkAction(id: string, data: z.infer<typeof UpdateHomeworkSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = UpdateHomeworkSchema.safeParse(data);
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
    const existing = await prisma.homework.findUnique({
      where: { id },
    });

    if (!existing || existing.studentId !== user.student.id) {
      return { error: "Zadatak nije pronađen ili nemate pristup" };
    }

    // Transform undefined to null for optional fields
    const updateData: Record<string, unknown> = {};
    const validData = validated.data;
    if (validData.title !== undefined) updateData["title"] = validData.title;
    if (validData.description !== undefined) updateData["description"] = validData.description ?? null;
    if (validData.notes !== undefined) updateData["notes"] = validData.notes ?? null;
    if (validData.subjectId !== undefined) updateData["subjectId"] = validData.subjectId;
    if (validData.dueDate !== undefined) updateData["dueDate"] = validData.dueDate;
    if (validData.priority !== undefined) updateData["priority"] = validData.priority;
    if (validData.status !== undefined) updateData["status"] = validData.status;

    const homework = await prisma.homework.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    await invalidateHomeworkCache(user.student.id);

    revalidatePath("/dashboard/domaci");
    revalidatePath("/dashboard");

    return { success: true, data: homework };
  } catch (error) {
    console.error("Update homework error:", error);
    return { error: "Greška prilikom ažuriranja zadatka" };
  }
}

export async function completeHomeworkAction(id: string): Promise<ActionState> {
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

    const existing = await prisma.homework.findUnique({
      where: { id },
    });

    if (!existing || existing.studentId !== user.student.id) {
      return { error: "Zadatak nije pronađen ili nemate pristup" };
    }

    // Check if already completed to avoid double XP
    if (existing.status === "DONE" || existing.status === "SUBMITTED") {
       return { error: "Zadatak je već završen" };
    }

    const homework = await prisma.homework.update({
      where: { id },
      data: { status: "DONE" },
    });

    // Calculate if early
    const dueDate = existing.dueDate instanceof Date ? existing.dueDate : new Date(existing.dueDate);
    const isEarly = Number.isFinite(dueDate.getTime())
      ? dueDate.getTime() - Date.now() > 3 * 24 * 60 * 60 * 1000 // 3 days early
      : false;

    // Track XP
    await trackHomeworkCompletion(user.student.id, isEarly);

    // Invalidate cache
    await invalidateHomeworkCache(user.student.id);

    revalidatePath("/dashboard/domaci");
    revalidatePath("/dashboard");

    return { success: true, data: homework };
  } catch (error) {
    console.error("Complete homework error:", error);
    return { error: "Greška prilikom završavanja zadatka" };
  }
}

export async function getHomeworkAction(params: z.infer<typeof QueryHomeworkSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  const validated = QueryHomeworkSchema.safeParse(params);
  if (!validated.success) {
    return { error: "Nevalidni parametri pretrage" };
  }

  const { page, limit, status, priority, sortBy, order } = validated.data;

  try {
    const studentIds: string[] = [];
    
    if (session.user.student?.id) {
        studentIds.push(session.user.student.id);
    }

    // If guardian, add linked students
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

    // Try cache for single student (most common case)
    let cacheKey = "";
    if (studentIds.length === 1 && studentIds[0]) {
      cacheKey = `list:${JSON.stringify(validated.data)}`;
      const cached = await getCachedHomeworkList(studentIds[0], cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    // Build filter
    const where: Prisma.HomeworkWhereInput = {
      studentId: { in: studentIds },
    };

    if (status) {
      where.status = Array.isArray(status) ? { in: status as HomeworkStatus[] } : status as HomeworkStatus;
    }
    if (priority) {
      where.priority = priority;
    }

    // Get total count
    const total = await prisma.homework.count({ where });

    // Get homework with pagination
    const homework = await prisma.homework.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { attachments: true },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formatted = homework.map((hw) => ({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      subject: hw.subject,
      dueDate: hw.dueDate,
      priority: hw.priority,
      status: hw.status,
      attachmentsCount: hw._count.attachments,
      createdAt: hw.createdAt,
      updatedAt: hw.updatedAt,
    }));

    const result = {
      success: true,
      data: {
        data: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    // Cache result if single student
    if (studentIds.length === 1 && studentIds[0]) {
      await setCachedHomeworkList(studentIds[0], cacheKey, result.data);
    }

    return result;
  } catch (error) {
    console.error("Get homework error:", error);
    return { error: "Greška prilikom učitavanja zadataka" };
  }
}

export async function getHomeworkByIdAction(id: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Niste prijavljeni" };
  }

  try {
    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!homework) {
      return { error: "Zadatak nije pronađen" };
    }

    // Check access
    // If student, must match studentId
    if (session.user.student && homework.studentId !== session.user.student.id) {
       return { error: "Nemate pristup ovom zadatku" };
    }
    // If guardian, must be linked to student
    if (session.user.guardian) {
       const link = await prisma.link.findFirst({
         where: {
           guardianId: session.user.guardian.id,
           studentId: homework.studentId,
           isActive: true
         }
       });
       if (!link) {
         return { error: "Nemate pristup ovom zadatku" };
       }
    }

    const attachments = await prisma.attachment.findMany({
      where: { homeworkId: id },
      select: { id: true, remoteUrl: true, fileName: true, uploadedAt: true },
    });

    return {
      success: true,
      data: {
        ...homework,
        attachments: attachments.map((a) => ({
          id: a.id,
          url: a.remoteUrl,
          fileName: a.fileName,
          createdAt: a.uploadedAt,
        })),
      },
    };
  } catch (error) {
    console.error("Get homework by id error:", error);
    return { error: "Greška prilikom učitavanja zadatka" };
  }
}

export async function deleteHomeworkAction(id: string): Promise<ActionState> {
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

    const homework = await prisma.homework.findUnique({
      where: { id },
    });

    if (!homework || homework.studentId !== user.student.id) {
      return { error: "Zadatak nije pronađen ili nemate pristup" };
    }

    // Delete attachments first
    await prisma.attachment.deleteMany({
      where: { homeworkId: id },
    });

    await prisma.homework.delete({
      where: { id },
    });

    // Invalidate cache
    await invalidateHomeworkCache(user.student.id);

    revalidatePath("/dashboard/domaci");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete homework error:", error);
    return { error: "Greška prilikom brisanja zadatka" };
  }
}

const SyncItemSchema = z.object({
  type: z.enum(["CREATE", "UPDATE", "DELETE"]),
  data: z.any(),
});

export async function syncHomeworkAction(payload: z.infer<typeof SyncItemSchema>): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || !session.user.student?.id) {
    return { error: "Niste prijavljeni" };
  }

  const { type, data } = payload;
  const studentId = session.user.student.id;

  try {
    let result;

    switch (type) {
      case "CREATE":
        const createData = CreateHomeworkSchema.parse(data);
        
        result = await prisma.homework.create({
          data: {
            title: createData.title,
            description: createData.description ?? null,
            subjectId: createData.subjectId,
            priority: createData.priority,
            status: createData.status,
            ...(data.id ? { id: data.id } : {}),
            studentId,
            dueDate: new Date(createData.dueDate),
          },
        });
        break;

      case "UPDATE":
        const existing = await prisma.homework.findUnique({
          where: { id: data.id },
        });

        if (!existing || existing.studentId !== studentId) {
          return { error: "Zadatak nije pronađen ili nemate pristup" };
        }

        const updateData = UpdateHomeworkSchema.parse(data);

        const updatePayload: any = {};
        if (updateData.title !== undefined) updatePayload.title = updateData.title;
        if (updateData.description !== undefined) updatePayload.description = updateData.description ?? null;
        if (updateData.subjectId !== undefined) updatePayload.subjectId = updateData.subjectId;
        if (updateData.priority !== undefined) updatePayload.priority = updateData.priority;
        if (updateData.status !== undefined) updatePayload.status = updateData.status;
        if (updateData.dueDate !== undefined) updatePayload.dueDate = new Date(updateData.dueDate);
        
        if (updateData.status === "DONE") {
            updatePayload.completedAt = new Date();
        } else if (updateData.status) {
            updatePayload.completedAt = null;
        }

        result = await prisma.homework.update({
          where: { id: data.id },
          data: updatePayload,
        });
        break;

      case "DELETE":
        const toDelete = await prisma.homework.findUnique({
          where: { id: data.id },
        });

        if (!toDelete || toDelete.studentId !== studentId) {
          return { error: "Zadatak nije pronađen ili nemate pristup" };
        }

        result = await prisma.homework.delete({
          where: { id: data.id },
        });
        break;
    }

    // Invalidate cache
    await invalidateHomeworkCache(studentId);

    revalidatePath("/dashboard/domaci");
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("Sync homework error:", error);
    return { error: "Greška prilikom sinhronizacije" };
  }
}
