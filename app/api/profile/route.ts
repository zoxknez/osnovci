// Profile API - Student profile management
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  school: z.string().min(1).max(200).optional(),
  grade: z.number().min(1).max(8).optional(),
  class: z.string().min(1).max(10).optional(),
  avatar: z.string().url().optional(),
  birthDate: z.string().datetime().optional(),
  jmbg: z.string().length(13).optional(),
  address: z.string().max(200).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  clothingSize: z.string().max(10).optional(),
  hasGlasses: z.boolean().optional(),
  bloodType: z
    .enum(["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN"])
    .optional(),
  allergies: z.string().max(1000).optional(),
  chronicIllnesses: z.string().max(1000).optional(),
  medications: z.string().max(1000).optional(),
  healthNotes: z.string().max(1000).optional(),
  specialNeeds: z.string().max(1000).optional(),
});

// GET /api/profile - Get current user profile
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    log.error("GET /api/profile failed", { error });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/profile - Update profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    // Update student profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const updated = await prisma.student.update({
      where: { id: user.student.id },
      data: {
        ...validated.data,
        birthDate: validated.data.birthDate
          ? new Date(validated.data.birthDate)
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil je ažuriran!",
      profile: updated,
    });
  } catch (error) {
    log.error("PATCH /api/profile failed", { error });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

