// middleware.ts
// Demo Mode + Lightweight security headers + CSP nonce injection

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateNonce, buildCSP } from "@/lib/security/csp";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🎮 DEMO MODE: Allow auth pages (no redirect)
  // In production, you'd add proper auth logic here
  const publicPages = [
    "/prijava", 
    "/registracija", 
    "/consent-required", 
    "/verify-pending", 
    "/account-inactive"
  ];
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));
  
  // Skip security headers for public pages
  if (isPublicPage) {
    return NextResponse.next();
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
  
  return response;
}

// Matcher — exclude Next.js static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
