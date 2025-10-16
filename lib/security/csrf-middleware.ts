// CSRF Protection Middleware for API Routes
import { type NextRequest, NextResponse } from "next/server";
import { generateCSRFToken, validateCSRFToken } from "./csrf";
import { log } from "@/lib/logger";

/**
 * CSRF Protection Middleware
 * Validates CSRF token for state-changing requests
 */
export function withCsrf<Args extends unknown[]>(
  handler: (req: NextRequest, ...args: Args) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ...args: Args) => {
    // Only check CSRF for state-changing methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const csrfToken = req.headers.get("X-CSRF-Token");
      const sessionToken = req.cookies.get("csrf-token")?.value;

      // Skip CSRF for auth routes (they handle it differently)
      if (req.nextUrl.pathname.startsWith("/api/auth")) {
        return handler(req, ...args);
      }

      if (
        !csrfToken ||
        !sessionToken ||
        csrfToken !== sessionToken ||
        !validateCSRFToken(csrfToken)
      ) {
        log.warn("CSRF validation failed", {
          path: req.nextUrl.pathname,
          method: req.method,
          hasToken: !!csrfToken,
          hasSession: !!sessionToken,
        });

        return NextResponse.json(
          { error: "CSRF validation failed", message: "Invalid request token" },
          { status: 403 },
        );
      }
    }

    return handler(req, ...args);
  };
}

/**
 * Generate and set CSRF token in cookie
 */
export function setCsrfToken(response: NextResponse): NextResponse {
  const token = generateCSRFToken();

  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Also send in header for client-side
  response.headers.set("X-CSRF-Token", token);

  return response;
}
