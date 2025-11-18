import type { NextRequest } from "next/server";
import {
  AuthenticationError,
  handleAPIError,
  NotFoundError,
} from "@/lib/api/handlers/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};
import {
  noContentResponse,
  successResponse,
} from "@/lib/api/handlers/response";
import { UpdateHomeworkSchema } from "@/lib/api/schemas/homework";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import { idSchema } from "@/lib/security/validators";

/**
 * GET /api/homework/[id]
 * Dohvata pojedinačni domaći zadatak
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { params } = context;
  try {
    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Await params (Next.js 15)
    const { id } = await params;

    // Dohvati homework
    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!homework) {
      throw new NotFoundError("Domaći zadatak");
    }

    // Dohvati attachments posebno
    const attachments = await prisma.attachment.findMany({
      where: { homeworkId: id },
      select: { id: true, remoteUrl: true, fileName: true, uploadedAt: true },
    });

    log.info("Fetched homework", {
      userId: session.user.id,
      homeworkId: id,
    });

    return successResponse({
      id: homework.id,
      subject: homework.subject,
      title: homework.title,
      description: homework.description,
      dueDate: homework.dueDate,
      priority: homework.priority,
      status: homework.status,
      attachmentsCount: attachments.length,
      attachments: attachments.map((a) => ({
        id: a.id,
        url: a.remoteUrl,
        fileName: a.fileName,
        createdAt: a.uploadedAt,
      })),
      createdAt: homework.createdAt,
      updatedAt: homework.updatedAt,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PUT /api/homework/[id]
 * Ažurira domaći zadatak
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  const { params } = context;
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(
        new Error(csrfResult.error || "CSRF validation failed"),
      );
    }

    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Await params (Next.js 15)
    const { id } = await params;

    // Validate ID format
    idSchema.parse(id);

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = UpdateHomeworkSchema.parse(body);

    // Dohvati homework
    const homework = await prisma.homework.findUnique({
      where: { id },
    });

    if (!homework) {
      throw new NotFoundError("Domaći zadatak");
    }

    // Provjeri da li korisnik može pristupiti
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student || homework.studentId !== student.id) {
      throw new AuthenticationError();
    }

    // Ažuriraj homework
    const updated = await prisma.homework.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description && {
          description: validatedData.description,
        }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.priority && { priority: validatedData.priority }),
        ...(validatedData.dueDate && {
          dueDate: new Date(validatedData.dueDate),
        }),
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Trigger achievement check if homework completed
    if (validatedData.status === "DONE" && homework.status !== "DONE") {
      const { triggerAchievementCheck } = await import(
        "@/lib/gamification/achievement-triggers"
      );
      triggerAchievementCheck(student.id, "HOMEWORK_COMPLETED").catch((err) =>
        log.error("Achievement check failed", err)
      );
    }

    log.info("Updated homework", {
      userId: session.user.id,
      homeworkId: id,
      fields: Object.keys(validatedData),
    });

    return successResponse({
      id: updated.id,
      subject: updated.subject,
      title: updated.title,
      description: updated.description,
      dueDate: updated.dueDate,
      priority: updated.priority,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/homework/[id]
 * Briše domaći zadatak
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const { params } = context;
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(
        new Error(csrfResult.error || "CSRF validation failed"),
      );
    }

    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Await params (Next.js 15)
    const { id } = await params;

    // Validate ID format
    idSchema.parse(id);

    // Dohvati homework
    const homework = await prisma.homework.findUnique({
      where: { id },
    });

    if (!homework) {
      throw new NotFoundError("Domaći zadatak");
    }

    // Provjeri da li korisnik može pristupiti
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student || homework.studentId !== student.id) {
      throw new AuthenticationError();
    }

    // Obriši attachmente prvi
    await prisma.attachment.deleteMany({
      where: { homeworkId: id },
    });

    // Obriši homework
    await prisma.homework.delete({
      where: { id },
    });

    log.info("Deleted homework", {
      userId: session.user.id,
      homeworkId: id,
    });

    return noContentResponse();
  } catch (error) {
    return handleAPIError(error);
  }
}
