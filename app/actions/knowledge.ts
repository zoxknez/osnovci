"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createResourceSchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["NOTE", "IMAGE", "LINK", "PDF"]),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

export async function getKnowledgeResourcesAction(
  subjectId?: string,
  type?: string
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { error: "Student profile not found" };
    }

    const resources = await prisma.knowledgeResource.findMany({
      where: {
        studentId: student.id,
        ...(subjectId ? { subjectId } : {}),
        ...(type ? { type: type as any } : {}),
      },
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { data: resources };
  } catch (error) {
    console.error("[KNOWLEDGE_GET_ACTION]", error);
    return { error: "Internal Error" };
  }
}

export async function createKnowledgeResourceAction(
  data: z.infer<typeof createResourceSchema>
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { error: "Student profile not found" };
    }

    const body = createResourceSchema.parse(data);

    const resource = await prisma.knowledgeResource.create({
      data: {
        studentId: student.id,
        subjectId: body.subjectId,
        title: body.title,
        type: body.type,
        content: body.content,
        tags: body.tags ? JSON.stringify(body.tags) : null,
      },
    });

    return { data: resource };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid request data" };
    }
    console.error("[KNOWLEDGE_POST_ACTION]", error);
    return { error: "Internal Error" };
  }
}

export async function deleteKnowledgeResourceAction(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { error: "Student profile not found" };
    }

    const resource = await prisma.knowledgeResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return { error: "Resource not found" };
    }

    if (resource.studentId !== student.id) {
      return { error: "Unauthorized" };
    }

    await prisma.knowledgeResource.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("[KNOWLEDGE_DELETE_ACTION]", error);
    return { error: "Internal Error" };
  }
}

export async function togglePinKnowledgeResourceAction(id: string, isPinned: boolean): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { error: "Student profile not found" };
    }

    const resource = await prisma.knowledgeResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return { error: "Resource not found" };
    }

    if (resource.studentId !== student.id) {
      return { error: "Unauthorized" };
    }

    const updated = await prisma.knowledgeResource.update({
      where: { id },
      data: { isPinned },
    });

    return { data: updated };
  } catch (error) {
    console.error("[KNOWLEDGE_TOGGLE_PIN_ACTION]", error);
    return { error: "Internal Error" };
  }
}
