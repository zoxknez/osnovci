// middleware.ts
// Enhanced Security: Auth Check + CSP nonce injection + Security Headers + Rate Limiting

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buildCSP, generateNonce } from "@/lib/security/csp";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis for Rate Limiting (Edge-compatible)
const redis =
  process.env["UPSTASH_REDIS_REST_URL"] && process.env["UPSTASH_REDIS_REST_TOKEN"]
    ? new Redis({
        url: process.env["UPSTASH_REDIS_REST_URL"],
        token: process.env["UPSTASH_REDIS_REST_TOKEN"],
      })
    : null;

// Global Rate Limiter: 100 requests per 10 seconds per IP
const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(100, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit/middleware",
    })
  : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "127.0.0.1";

  // 1. Rate Limiting (Skip for static assets)
  if (
    ratelimit &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon.ico") &&
    !pathname.startsWith("/icons")
  ) {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

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
    "/api/db-push", // Database schema initialization
    "/api/debug-demo", // Debug demo account
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
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
