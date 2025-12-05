"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import {
  InitiateFamilyLinkSchema,
  QueryFamilySchema,
  UpdatePermissionsSchema,
} from "@/lib/api/schemas/family";
import { initiateLink, childApproves, sendGuardianVerificationEmail } from "@/lib/auth/stranger-danger";

// Schemas
const initiateLinkByQRSchema = z.object({
  studentQRData: z.string(),
});

const approveLinkSchema = z.object({
  linkCode: z.string(),
  approved: z.boolean(),
  guardianEmail: z.string().email().optional(),
});

// Actions

export async function getFamilyMembersAction(params: z.infer<typeof QueryFamilySchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = QueryFamilySchema.safeParse(params);
    if (!validated.success) return { success: false, error: "Validation error" };

    const { page, limit, status, role, sortBy, order } = validated.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: true,
      },
    });

    if (!user) return { success: false, error: "User not found" };

    if (!user.student && !user.guardian) {
      return {
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const where: any = {};

    if (user.student) {
      where["studentId"] = user.student.id;
    } else if (user.guardian) {
      where["guardianId"] = user.guardian.id;
    }

    if (status) where["status"] = status;
    if (role) where["role"] = role;

    const total = await prisma.link.count({ where });

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
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formatted = links.map((link) => ({
      id: link.id,
      name:
        link.guardian?.name ||
        link.guardian?.user?.email?.split("@")[0] ||
        "Guardian",
      email: link.guardian?.user?.email || "",
      studentName: link.student?.name || "",
      linkCode: link.linkCode,
      isActive: link.isActive,
      permissions: link.permissions,
      linkedAt: link.createdAt,
      expiresAt: link.expiresAt,
    }));

    return {
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    log.error("getFamilyMembersAction error", error);
    return { success: false, error: "Failed to fetch family members" };
  }
}

export async function initiateFamilyLinkAction(data: z.infer<typeof InitiateFamilyLinkSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = InitiateFamilyLinkSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) return { success: false, error: "Student profile not found" };

    const existingLink = await prisma.link.findFirst({
      where: {
        studentId: student.id,
        guardian: {
          user: {
            email: validated.data.email,
          },
        },
      },
    });

    if (existingLink?.isActive) {
      return { success: false, error: "Ovaj email je već povezan sa ovim detetom" };
    }

    let guardian = await prisma.user.findUnique({
      where: { email: validated.data.email },
    });

    if (!guardian) {
      const hashedPassword = await hash(Math.random().toString(36), 10);
      const newUser = await prisma.user.create({
        data: {
          email: validated.data.email,
          role: "GUARDIAN",
          password: hashedPassword,
        },
      });

      const guardianName = validated.data.email.split("@")[0] ?? "Guardian";
      await prisma.guardian.create({
        data: {
          userId: newUser.id,
          name: guardianName,
        },
      });

      guardian = newUser;
    }

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

    const linkCode = Math.random().toString().substring(2, 8);

    const newLink = await prisma.link.create({
      data: {
        studentId: student.id,
        guardianId: guardianProfile.id,
        linkCode,
        isActive: true,
        permissions: validated.data.permissions || {},
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

    const { sendFamilyLinkEmail } = await import("@/lib/email/templates");
    await sendFamilyLinkEmail(
      validated.data.email,
      newLink.linkCode,
      student.name,
    );

    revalidatePath("/family");
    return {
      success: true,
      data: {
        id: newLink.id,
        name: newLink.guardian.name,
        email: newLink.guardian.user.email,
        linkCode: newLink.linkCode,
        permissions: newLink.permissions,
      },
      message: "Poziv je poslat na email",
    };
  } catch (error) {
    log.error("initiateFamilyLinkAction error", error);
    return { success: false, error: "Failed to initiate family link" };
  }
}

export async function updateFamilyPermissionsAction(data: z.infer<typeof UpdatePermissionsSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = UpdatePermissionsSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const link = await prisma.link.findUnique({
      where: { id: validated.data.guardianId },
      include: { student: { select: { userId: true } } },
    });

    if (!link) return { success: false, error: "Link not found" };

    if (link.student.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.link.update({
      where: { id: validated.data.guardianId },
      data: {
        permissions: validated.data.permissions,
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

    revalidatePath("/family");
    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.guardian.name,
        email: updated.guardian.user.email,
        permissions: updated.permissions,
      },
    };
  } catch (error) {
    log.error("updateFamilyPermissionsAction error", error);
    return { success: false, error: "Failed to update permissions" };
  }
}

export async function removeFamilyMemberAction(linkId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: { student: { select: { userId: true } } },
    });

    if (!link) return { success: false, error: "Link not found" };

    if (link.student.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.link.update({
      where: { id: linkId },
      data: { isActive: false },
    });

    revalidatePath("/family");
    return { success: true };
  } catch (error) {
    log.error("removeFamilyMemberAction error", error);
    return { success: false, error: "Failed to remove family member" };
  }
}

export async function initiateLinkByQRAction(data: z.infer<typeof initiateLinkByQRSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = initiateLinkByQRSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const guardian = await prisma.guardian.findUnique({
      where: { userId: session.user.id },
    });

    if (!guardian) return { success: false, error: "Samo roditelji mogu skenirati QR kod" };

    const result = await initiateLink(validated.data.studentQRData, guardian.id);

    return { success: true, data: result };
  } catch (error) {
    log.error("initiateLinkByQRAction error", error);
    return { success: false, error: "Failed to initiate link" };
  }
}

export async function approveLinkAction(data: z.infer<typeof approveLinkSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = approveLinkSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) return { success: false, error: "Student not found" };

    if (!validated.data.approved) {
      return { success: false, error: "Odbio si povezivanje" };
    }

    const result = await childApproves(validated.data.linkCode, student.id);

    if (!result.success) {
      return { success: false, error: result.message || "Failed to approve link" };
    }

    if (validated.data.guardianEmail) {
      await sendGuardianVerificationEmail(validated.data.linkCode, validated.data.guardianEmail);
    }

    revalidatePath("/family");
    return { success: true, data: result };
  } catch (error) {
    log.error("approveLinkAction error", error);
    return { success: false, error: "Failed to approve link" };
  }
}

/**
 * Generate QR code data for student to share with guardians.
 * Returns student-specific data that guardians can scan.
 */
export async function generateStudentQRAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    });

    if (!student) return { success: false, error: "Student profile not found" };

    // Generate a 6-digit link code for this student
    const linkCode = Math.random().toString().substring(2, 8).toUpperCase();
    
    // Store this temporary code (expires in 24 hours)
    // We can use the Link model with a placeholder guardian or a separate temp storage
    // For simplicity, we'll return the student ID encoded with the code
    const qrData = `OSNOVCI_LINK:${student.id}:${linkCode}`;
    
    return {
      success: true,
      data: {
        qrData,
        linkCode,
        studentName: student.name,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  } catch (error) {
    log.error("generateStudentQRAction error", error);
    return { success: false, error: "Failed to generate QR code" };
  }
}
