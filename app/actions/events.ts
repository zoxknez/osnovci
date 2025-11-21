"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

const createEventSchema = z.object({
  type: z.enum(["EXAM", "MEETING", "TRIP", "COMPETITION", "OTHER"]),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dateTime: z.string().datetime(), // Expecting ISO string from client
  location: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  notifyAt: z.string().datetime().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export async function getEventsAction(params?: {
  type?: "EXAM" | "MEETING" | "TRIP" | "COMPETITION" | "OTHER";
  from?: string;
  to?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return { success: false, error: "Student profile not found" };
    }

    const where: Prisma.EventWhereInput = {
      studentId: user.student.id,
    };

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.from || params?.to) {
      where.dateTime = {};
      if (params.from) {
        where.dateTime.gte = new Date(params.from);
      }
      if (params.to) {
        where.dateTime.lte = new Date(params.to);
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        dateTime: "asc",
      },
    });

    return { success: true, events, count: events.length };
  } catch (error) {
    log.error("getEventsAction failed", { error });
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function createEventAction(data: CreateEventInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return { success: false, error: "Student profile not found" };
    }

    const validated = createEventSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: "Validation Error",
        details: validated.error.flatten(),
      };
    }

    const event = await prisma.event.create({
      data: {
        studentId: user.student.id,
        type: validated.data.type,
        title: validated.data.title,
        ...(validated.data.description && { description: validated.data.description }),
        dateTime: new Date(validated.data.dateTime),
        ...(validated.data.location && { location: validated.data.location }),
        ...(validated.data.notes && { notes: validated.data.notes }),
        ...(validated.data.notifyAt && { notifyAt: new Date(validated.data.notifyAt) }),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/calendar");

    return {
      success: true,
      message: "Događaj je kreiran!",
      event,
    };
  } catch (error) {
    log.error("createEventAction failed", { error });
    return { success: false, error: "Failed to create event" };
  }
}
