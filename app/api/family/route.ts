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
import crypto from "crypto";

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
    });

    if (!user) {
      throw new NotFoundError("Korisnik");
    }

    // Build filter
    const where: any = {
      OR: [{ userId: user.id }, { guardianId: user.id }],
    };

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }
    if (validatedQuery.role) {
      where.role = validatedQuery.role;
    }

    // Dohvati total broj
    const total = await prisma.familyLink.count({ where });

    // Dohvati članove
    const links = await prisma.familyLink.findMany({
      where,
      include: {
        guardian: {
          select: { id: true, name: true, email: true },
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
      name: link.guardian.name,
      email: link.guardian.email,
      relation: link.relation,
      role: link.role,
      status: link.status,
      permissions: link.permissions,
      linkedAt: link.createdAt,
      lastAccess: link.lastAccess,
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
    const existingLink = await prisma.familyLink.findFirst({
      where: {
        studentId: student.id,
        guardian: {
          email: validatedData.email,
        },
      },
    });

    if (existingLink && existingLink.status !== "REVOKED") {
      throw new ConflictError("Ovaj email je već povezan sa ovim djetetom");
    }

    // Generiši verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 sata

    // Dohvati ili kreiraj guardiana
    let guardian = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!guardian) {
      // Kreiraj novog guardiana sa temp imenom
      guardian = await prisma.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.email.split("@")[0],
          role: "PARENT",
        },
      });
    }

    // Kreiraj family link
    const familyLink = await prisma.familyLink.create({
      data: {
        studentId: student.id,
        guardianId: guardian.id,
        relation: validatedData.relation,
        permissions: validatedData.permissions,
        verificationToken,
        tokenExpiry,
        status: "PENDING",
      },
      include: {
        guardian: { select: { id: true, name: true, email: true } },
      },
    });

    log.info("Initiated family link", {
      userId: session.user.id,
      linkId: familyLink.id,
      guardianEmail: validatedData.email,
    });

    // TODO: Pošalji email sa verification linkom
    // await sendVerificationEmail(validatedData.email, verificationToken);

    return createdResponse(
      {
        id: familyLink.id,
        name: familyLink.guardian.name,
        email: familyLink.guardian.email,
        relation: familyLink.relation,
        status: familyLink.status,
        permissions: familyLink.permissions,
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
    // Autentifikacija
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Parse body
    const body = await request.json();

    // Validacija
    const validatedData = UpdatePermissionsSchema.parse(body);

    // Dohvati family link
    const familyLink = await prisma.familyLink.findUnique({
      where: { id: validatedData.guardianId },
      include: { student: { select: { userId: true } } },
    });

    if (!familyLink) {
      throw new NotFoundError("Poziv");
    }

    // Provjeri da li je autentifikovani korisnik vlasnik dijeta
    if (familyLink.student.userId !== session.user.id) {
      throw new AuthenticationError();
    }

    // Ažuriraj dozvole
    const updated = await prisma.familyLink.update({
      where: { id: validatedData.guardianId },
      data: {
        permissions: validatedData.permissions,
      },
      include: {
        guardian: { select: { id: true, name: true, email: true } },
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
      email: updated.guardian.email,
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

    // Dohvati family link
    const familyLink = await prisma.familyLink.findUnique({
      where: { id: linkId },
      include: { student: { select: { userId: true } } },
    });

    if (!familyLink) {
      throw new NotFoundError("Poziv");
    }

    // Provjeri da li je autentifikovani korisnik vlasnik dijeta
    if (familyLink.student.userId !== session.user.id) {
      throw new AuthenticationError();
    }

    // Označi kao REVOKED umjesto brisanja
    await prisma.familyLink.update({
      where: { id: linkId },
      data: { status: "REVOKED" },
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
