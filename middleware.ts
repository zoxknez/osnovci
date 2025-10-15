// Auth Middleware - Štiti protected routes

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

// Public routes koje ne zahtevaju autentifikaciju
const publicRoutes = ["/", "/prijava", "/registracija"];

// API routes koje ne zahtevaju auth
const publicApiRoutes = ["/api/auth", "/api/health"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!req.auth && pathname.startsWith("/dashboard")) {
    const url = new URL("/prijava", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Check if user is authenticated for API routes
  if (!req.auth && pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Morate biti ulogovani" },
      { status: 401 },
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - manifest.json
     * - sw.js (service worker)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js)$).*)",
  ],
};
