/**
 * API Route: Parent-Child Messaging
 * In-app messaging između roditelja i deteta
 * COPPA: Sva komunikacija dete-roditelj se loguje
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { moderateContent } from "@/lib/safety/moderation-service";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

const sendMessageSchema = z.object({
  studentId: z.string(),
  guardianId: z.string(),
  content: z.string().min(1).max(1000),
});

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "messaging-get",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const guardianId = searchParams.get("guardianId");

    if (!studentId || !guardianId) {
      return NextResponse.json(
        { error: "Nedostaje studentId ili guardianId", requestId },
        { status: 400 },
      );
    }

    // Verify user has access to this conversation
    if (session.user.role === "STUDENT") {
      if (session.user.student?.id !== studentId) {
        return NextResponse.json(
          { error: "Nemate pristup", requestId },
          { status: 403 },
        );
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
        return NextResponse.json(
          { error: "Nemate pristup", requestId },
          { status: 403 },
        );
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
      requestId,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName:
          m.sender.student?.name ?? m.sender.guardian?.name ?? "Nepoznato",
        senderRole: m.sender.role,
        content: m.content,
        timestamp: m.createdAt,
        read: m.read,
      })),
    });
  } catch (error) {
    log.error("Error fetching messages", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri učitavanju poruka", requestId },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting - strict for sending messages
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "messaging-send",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // Verify user has access
    if (session.user.role === "STUDENT") {
      if (session.user.student?.id !== validated.studentId) {
        return NextResponse.json(
          { error: "Nemate pristup", requestId },
          { status: 403 },
        );
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
        return NextResponse.json(
          { error: "Nemate pristup", requestId },
          { status: 403 },
        );
      }
    }

    // Content moderation
    const moderation = await moderateContent({
      text: validated.content,
      contentType: "HOMEWORK_NOTE",
      contentId: `message-${validated.studentId}-${validated.guardianId}`,
      userId: session.user.id,
    });

    if (
      moderation.severity === "critical" ||
      moderation.severity === "severe"
    ) {
      // COPPA: Log blocked content attempt
      await logActivity({
        userId: session.user.id,
        type: "CONTENT_MODERATION",
        description: `Poruka blokirana zbog neprikladnog sadržaja (severity: ${moderation.severity})`,
        request,
      });

      return NextResponse.json(
        { error: "Poruka sadrži neprikladan sadržaj", requestId },
        { status: 400 },
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

    // COPPA: Log messaging activity (student-parent communication)
    await logActivity({
      userId: session.user.id,
      type: "MESSAGE_SENT",
      description: `Poruka poslata u konverzaciji roditelj-dete`,
      metadata: {
        messageId: message.id,
        studentId: validated.studentId,
        guardianId: validated.guardianId,
        senderRole: session.user.role,
      },
      request,
    });

    log.info("Message sent", {
      messageId: message.id,
      senderId: session.user.id,
      studentId: validated.studentId,
      requestId,
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName:
          message.sender.student?.name ??
          message.sender.guardian?.name ??
          "Nepoznato",
        senderRole: message.sender.role,
        content: message.content,
        timestamp: message.createdAt,
        read: message.read,
      },
    });
  } catch (error) {
    log.error("Error sending message", { error, requestId });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neispravni podaci", issues: error.issues, requestId },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Greška pri slanju poruke", requestId },
      { status: 500 },
    );
  }
}
