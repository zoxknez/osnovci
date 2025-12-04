/**
 * API Route: Get Current User Info
 * Vraća informacije o trenutno ulogovanom korisniku
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with student/guardian info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true,
            school: true,
          },
        },
        guardian: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        student: user.student,
        guardian: user.guardian,
      },
    });
  } catch (error) {
    log.error("Error fetching user info", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

