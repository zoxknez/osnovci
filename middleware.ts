// middleware.ts
// Enhanced Security: Auth Check + CSP nonce injection + Security Headers

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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
    "/api/seed-demo", // Demo account creation
  ];

  const isPublicPage = publicPages.some((page) => pathname.startsWith(page));

  // Skip auth check for public pages and static assets
  // Auth check is now handled in layouts and API routes to reduce middleware bundle size
  if (
    !isPublicPage &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon.ico")
  ) {
    // Check for session cookie - lightweight check
    const sessionToken = request.cookies.get("authjs.session-token") || 
      request.cookies.get("__Secure-authjs.session-token");

    // Redirect to login if no session cookie
    if (!sessionToken) {
      const loginUrl = new URL("/prijava", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Additional checks (email verification, consent, etc.) moved to page layouts
    // This keeps middleware lean for Edge Runtime
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
