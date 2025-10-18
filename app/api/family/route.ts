import { auth } from "@/lib/auth/config";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  InitiateFamilyLinkSchema,
  UpdatePermissionsSchema,
  QueryFamilySchema,
} from "@/lib/api/schemas/family";
import {
  handleAPIError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from "@/lib/api/handlers/errors";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
} from "@/lib/api/handlers/response";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * GET /api/family
 * Dohvata sve članove porodice sa njihovim dozvolama
 */
export async function GET(request: NextRequest) {
  try {
    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      status: searchParams.get("status") || undefined,
      role: searchParams.get("role") || undefined,
      sortBy: searchParams.get("sortBy") || "linkedAt",
      order: searchParams.get("order") || "desc",
    };

    // Validacija query parametara
    const validatedQuery = QueryFamilySchema.parse(queryData);

    // Dohvati korisnika
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Korisnik");
    }

    // Ako nema ni student ni guardian, vrati praznu listu
    if (!user.student && !user.guardian) {
      return paginatedResponse([], 1, validatedQuery.limit, 0, "Nema članova porodice");
    }

    // Build filter based on role
    const where: Record<string, unknown> = {};

    if (user.student) {
      // Student vidi svoje roditelje/čuvare
      where.studentId = user.student.id;
    } else if (user.guardian) {
      // Guardian vidi svoju decu
      where.guardianId = user.guardian.id;
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }
    if (validatedQuery.role) {
      where.role = validatedQuery.role;
    }

    // Dohvati total broj
    const total = await prisma.link.count({ where });

    // Dohvati članove
    const links = await prisma.link.findMany({
      where,
      include: {
        guardian: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        student: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.order,
      },
      skip: (validatedQuery.page - 1) * validatedQuery.limit,
      take: validatedQuery.limit,
    });

    // Format response
    const formatted = links.map((link) => ({
      id: link.id,
      name: link.guardian?.name || link.guardian?.user?.email?.split("@")[0] || "Guardian",
      email: link.guardian?.user?.email || "",
      studentName: link.student?.name || "",
      linkCode: link.linkCode,
      isActive: link.isActive,
      permissions: link.permissions,
      linkedAt: link.createdAt,
      expiresAt: link.expiresAt,
    }));

    log.info("Fetched family members", {
      userId: session.user.id,
      count: formatted.length,
      total,
    });

    return paginatedResponse(
      formatted,
      validatedQuery.page,
      validatedQuery.limit,
      total,
      `Pronađeno ${total} članove porodice`,
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/family
 * Inicira linajvanje roditelja/čuvara
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = InitiateFamilyLinkSchema.parse(body);

    // Dohvati korisnika (dijete)
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      throw new NotFoundError("Učenik");
    }

    // Provjeri da li je taj email već povezan
    const existingLink = await prisma.link.findFirst({
      where: {
        studentId: student.id,
        guardian: {
          user: {
            email: validatedData.email,
          },
        },
      },
    });

    if (existingLink?.isActive) {
      throw new ConflictError("Ovaj email je već povezan sa ovim djetetom");
    }

    // Dohvati ili kreiraj guardiana
    let guardian = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!guardian) {
      // Kreiraj novog User-a
      const newUser = await prisma.user.create({
        data: {
          email: validatedData.email,
          role: "GUARDIAN",
        },
      });

      // Kreiraj Guardian profil
      await prisma.guardian.create({
        data: {
          userId: newUser.id,
          name: validatedData.email.split("@")[0],
        },
      });

      guardian = newUser;
    }

    // Ako Guardian ne postoji na user.guardian, kreiraj ga
    let guardianProfile = await prisma.guardian.findUnique({
      where: { userId: guardian.id },
    });

    if (!guardianProfile) {
      guardianProfile = await prisma.guardian.create({
        data: {
          userId: guardian.id,
          name: guardian.email?.split("@")[0] || "Guardian",
        },
      });
    }

    // Generiši link code (6 cifre)
    const linkCode = Math.random().toString().substring(2, 8);

    // Kreiraj link
    const newLink = await prisma.link.create({
      data: {
        studentId: student.id,
        guardianId: guardianProfile.id,
        linkCode,
        isActive: true,
        permissions: validatedData.permissions || {},
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dana
      },
      include: {
        guardian: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    log.info("Initiated family link", {
      userId: session.user.id,
      linkId: newLink.id,
      guardianEmail: validatedData.email,
    });

    // TODO: Pošalji email sa link kodom
    // await sendVerificationEmail(validatedData.email, newLink.linkCode);

    return createdResponse(
      {
        id: newLink.id,
        name: newLink.guardian.name,
        email: newLink.guardian.user.email,
        linkCode: newLink.linkCode,
        permissions: newLink.permissions,
      },
      "Poziv je poslana na email",
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PUT /api/family
 * Ažurira dozvole za člana porodice
 */
export async function PUT(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = UpdatePermissionsSchema.parse(body);

    // Dohvati link
    const link = await prisma.link.findUnique({
      where: { id: validatedData.guardianId },
      include: { student: { select: { userId: true } } },
    });

    if (!link) {
      throw new NotFoundError("Poziv");
    }

    // Provjeri da li je autentifikovani korisnik vlasnik dijeta
    if (link.student.userId !== session.user.id) {
      throw new AuthenticationError();
    }

    // Ažuriraj dozvole
    const updated = await prisma.link.update({
      where: { id: validatedData.guardianId },
      data: {
        permissions: validatedData.permissions,
      },
      include: {
        guardian: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    log.info("Updated family permissions", {
      userId: session.user.id,
      linkId: validatedData.guardianId,
      permissions: validatedData.permissions,
    });

    return successResponse({
      id: updated.id,
      name: updated.guardian.name,
      email: updated.guardian.user.email,
      permissions: updated.permissions,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/family?id=<linkId>
 * Uklonjava člana porodice
 */
export async function DELETE(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return handleAPIError(new Error(csrfResult.error || "CSRF validation failed"));
    }

    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Dohvati link ID iz query parametara
    const linkId = request.nextUrl.searchParams.get("id");
    if (!linkId) {
      throw new Error("Link ID je obavezan");
    }

    // Dohvati link
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: { student: { select: { userId: true } } },
    });

    if (!link) {
      throw new NotFoundError("Poziv");
    }

    // Provjeri da li je autentifikovani korisnik vlasnik dijeta
    if (link.student.userId !== session.user.id) {
      throw new AuthenticationError();
    }

    // Deaktiviraj link umjesto brisanja
    await prisma.link.update({
      where: { id: linkId },
      data: { isActive: false },
    });

    log.info("Revoked family link", {
      userId: session.user.id,
      linkId,
    });

    return noContentResponse();
  } catch (error) {
    return handleAPIError(error);
  }
}
