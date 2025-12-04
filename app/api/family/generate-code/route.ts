/**
 * API Route: Generate Link Code for Student QR
 * Student generates a code that guardian scans
 */

import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json(
        { error: "Only students can generate link codes" },
        { status: 403 },
      );
    }

    // Generate a 6-character alphanumeric code
    const code = randomBytes(3).toString("hex").toUpperCase();

    // Store the code with expiration (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Check if student already has an active link code
    const existingLink = await prisma.link.findFirst({
      where: {
        studentId: user.student.id,
        guardianId: null as any, // Placeholder - will be set when guardian connects
        expiresAt: { gt: new Date() },
      },
    });

    if (existingLink) {
      // Return existing code
      return NextResponse.json({
        success: true,
        code: existingLink.linkCode,
        expiresAt: existingLink.expiresAt,
      });
    }

    // Create a placeholder link entry with the code
    // Note: This is a simplified flow - in production you might want a separate table
    // for pending link codes

    // For now, let's just return the student ID encoded for the QR
    // The guardian app will use this to initiate the link
    const qrData = `OSNOVCI:${user.student.id}:${code}`;

    log.info("Generated link code for student", {
      studentId: user.student.id,
      code,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      code,
      qrData,
      expiresAt,
    });
  } catch (error) {
    log.error("Error generating link code", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
