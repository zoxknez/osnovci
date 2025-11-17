// middleware.ts
// Enhanced Security: Auth Check + CSP nonce injection + Security Headers

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { buildCSP, generateNonce } from "@/lib/security/csp";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public pages that don't require authentication
  const publicPages = [
    "/prijava",
    "/registracija",
    "/consent-required",
    "/verify-pending",
    "/account-inactive",
    "/api/auth", // NextAuth endpoints
    "/api/csrf", // CSRF token generation
    "/api/health", // Health check
  ];

  const isPublicPage = publicPages.some((page) => pathname.startsWith(page));

  // Skip auth check for public pages and static assets
  if (
    !isPublicPage &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon.ico")
  ) {
    // Get session
    const session = await auth();

    // Redirect to login if not authenticated
    if (!session?.user?.id) {
      const loginUrl = new URL("/prijava", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Email verification check (skip for API routes)
    if (!pathname.startsWith("/api")) {
      if (
        session.user.email &&
        !session.user.emailVerified &&
        pathname !== "/verify-pending"
      ) {
        return NextResponse.redirect(new URL("/verify-pending", request.url));
      }

      // Parental consent check (for students)
      if (session.user.role === "STUDENT") {
        const student = session.user.student;

        if (
          student &&
          !student.parentalConsentGiven &&
          pathname !== "/consent-required"
        ) {
          return NextResponse.redirect(
            new URL("/consent-required", request.url),
          );
        }

        // Account active check
        if (
          student &&
          !student.accountActive &&
          pathname !== "/account-inactive"
        ) {
          return NextResponse.redirect(
            new URL("/account-inactive", request.url),
          );
        }
      }
    }
  }

  // Landing page -> Dashboard redirect
  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Generate nonce for this request
  const nonce = generateNonce();

  const response = NextResponse.next();

  // Add CSP with nonce
  const csp = buildCSP(nonce);
  response.headers.set("Content-Security-Policy", csp);

  // Pass nonce to request context for use in components
  response.headers.set("x-nonce", nonce);

  // Add other security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  );

  return response;
}

// Matcher — exclude Next.js static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
