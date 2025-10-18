// Subjects API - Subject management (Security Enhanced!)
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import { safeStringSchema } from "@/lib/security/validators";

const createSubjectSchema = z.object({
  name: safeStringSchema.min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  icon: safeStringSchema.max(50).optional(),
});

// GET /api/subjects - Get all subjects
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      subjects,
      count: subjects.length,
    });
  } catch (error) {
    log.error("GET /api/subjects failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/subjects - Create new subject
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createSubjectSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const subject = await prisma.subject.create({
      data: validated.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Predmet je kreiran!",
        subject,
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("POST /api/subjects failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
