// API Middleware helpers - Rate Limiting, Sanitization, etc.
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { checkRateLimit } from "@/middleware/rate-limit";
import { sanitizeText } from "@/lib/utils/sanitize";
import { captureException } from "@/lib/monitoring/error-tracking";

/**
 * Authenticated Student Middleware
 * Returns student or error response
 */
export async function getAuthenticatedStudent(sessionUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { student: true },
  });

  if (!user?.student) {
    throw new ApiError("Student profil nije pronađen", 404);
  }

  return user.student;
}

/**
 * Custom API Error
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Standard API Responses
 */
export function unauthorized(message = "Morate biti ulogovani") {
  return NextResponse.json({ error: "Unauthorized", message }, { status: 401 });
}

export function forbidden(message = "Nemate dozvolu za ovu akciju") {
  return NextResponse.json({ error: "Forbidden", message }, { status: 403 });
}

export function notFound(message = "Resurs nije pronađen") {
  return NextResponse.json({ error: "Not Found", message }, { status: 404 });
}

export function badRequest(message: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    { error: "Bad Request", message, ...(details && { details }) },
    { status: 400 },
  );
}

export function success(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function internalError(error: unknown, customMessage?: string) {
  log.error("API Internal Error", { error });

  // Track error
  if (error instanceof Error) {
    captureException(error, {
      tags: { type: "api_error" },
      extra: { customMessage },
    });
  }

  return NextResponse.json(
    {
      error: "Internal Server Error",
      message: customMessage || "Došlo je do greške. Pokušaj ponovo.",
      ...(process.env.NODE_ENV === "development" && {
        details: error instanceof Error ? error.message : String(error),
      }),
    },
    { status: 500 },
  );
}

/**
 * Sanitize request body
 */
export function sanitizeBody<T extends Record<string, any>>(
  body: T,
  textFields: (keyof T)[],
): T {
  const sanitized = { ...body };

  for (const field of textFields) {
    if (typeof sanitized[field] === "string") {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * With Auth Middleware
 * Checks authentication before proceeding
 * Next.js 15 compatible
 */
export function withAuth(
  // biome-ignore lint: session type comes from NextAuth
  handler: (
    req: NextRequest,
    session: any,
    context: { params: Promise<Record<string, string>> },
  ) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    return handler(req, session, context);
  };
}

/**
 * Composite Middleware: Auth + Rate Limiting
 * Next.js 15 compatible
 */
export function withAuthAndRateLimit(
  // biome-ignore lint: session type comes from NextAuth
  handler: (
    req: NextRequest,
    session: any,
    context: { params: Promise<Record<string, string>> },
  ) => Promise<NextResponse>,
  limiterType: "api" | "auth" | "upload" = "api",
) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    // Check rate limit first
    const rateLimitResult = await checkRateLimit(req, limiterType);
    if (!rateLimitResult.success) {
      return rateLimitResult.response as unknown as NextResponse;
    }

    // Then check auth
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    return handler(req, session, context);
  };
}
