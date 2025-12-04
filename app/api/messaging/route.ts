/**
 * API Route: Parent-Child Messaging
 * In-app messaging između roditelja i deteta
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { z } from "zod";
import { moderateContent } from "@/lib/safety/moderation-service";

const sendMessageSchema = z.object({
  studentId: z.string(),
  guardianId: z.string(),
  content: z.string().min(1).max(1000),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const guardianId = searchParams.get("guardianId");

    if (!studentId || !guardianId) {
      return NextResponse.json(
        { error: "Missing studentId or guardianId" },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    if (session.user.role === "STUDENT") {
      if (session.user.student?.id !== studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "GUARDIAN") {
      const link = await prisma.link.findFirst({
        where: {
          guardianId,
          studentId,
          isActive: true,
        },
      });
      if (!link) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        studentId,
        guardianId,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            student: {
              select: { name: true },
            },
            guardian: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        studentId,
        guardianId,
        read: false,
        senderId: { not: session.user.id },
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.student?.name ?? m.sender.guardian?.name ?? "Unknown",
        senderRole: m.sender.role,
        content: m.content,
        timestamp: m.createdAt,
        read: m.read,
      })),
    });
  } catch (error) {
    log.error("Error fetching messages", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // Verify user has access
    if (session.user.role === "STUDENT") {
      if (session.user.student?.id !== validated.studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "GUARDIAN") {
      const link = await prisma.link.findFirst({
        where: {
          guardianId: validated.guardianId,
          studentId: validated.studentId,
          isActive: true,
        },
      });
      if (!link) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Content moderation
    const moderation = await moderateContent({
      text: validated.content,
      contentType: "HOMEWORK_NOTE",
      contentId: `message-${validated.studentId}-${validated.guardianId}`,
      userId: session.user.id,
    });

    if (moderation.severity === "critical" || moderation.severity === "severe") {
      return NextResponse.json(
        { error: "Poruka sadrži neprikladan sadržaj" },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        studentId: validated.studentId,
        guardianId: validated.guardianId,
        senderId: session.user.id,
        content: validated.content,
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            student: {
              select: { name: true },
            },
            guardian: {
              select: { name: true },
            },
          },
        },
      },
    });

    log.info("Message sent", {
      messageId: message.id,
      senderId: session.user.id,
      studentId: validated.studentId,
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.student?.name ?? message.sender.guardian?.name ?? "Unknown",
        senderRole: message.sender.role,
        content: message.content,
        timestamp: message.createdAt,
        read: message.read,
      },
    });
  } catch (error) {
    log.error("Error sending message", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neispravni podaci", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

