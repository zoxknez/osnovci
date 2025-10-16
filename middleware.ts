// middleware.ts
// Auth Middleware — štiti sve ne-javne rute (ne samo /dashboard)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const PUBLIC_ROUTES = new Set<string>(["/", "/prijava", "/registracija"]);
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"]; // dozvoli sve ispod ovih

function stripLocale(pathname: string) {
  // /sr, /en prefiksi — tretiraj kao i bez prefiksa
  const m = pathname.match(/^\/(sr|en)(\/|$)/);
  if (m) {
    const without = pathname.replace(/^\/(sr|en)/, "");
    return without.length ? without : "/";
  }
  return pathname;
}

function cleanPath(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname.startsWith(p));
}

export default auth((req) => {
  const url = req.nextUrl;
  const rawPath = url.pathname;
  const localeStripped = stripLocale(rawPath);
  const pathname = cleanPath(localeStripped);
  const method = req.method;

  const isApi = pathname.startsWith("/api/");
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const isPublicApi = startsWithAny(pathname, PUBLIC_API_PREFIXES);

  // Uvek dozvoli HEAD/OPTIONS (npr. CORS preflight)
  if (method === "HEAD" || method === "OPTIONS") {
    return NextResponse.next();
  }

  // Public (page) rute
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Public API rute (dozvoli sve ispod /api/auth ... /api/health)
  if (isApi && isPublicApi) {
    return NextResponse.next();
  }

  // API zaštita (ostatak /api/**)
  if (isApi) {
    if (!req.auth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Morate biti ulogovani." },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Page zaštita (sve ne-javne rute)
  if (!req.auth) {
    const loginUrl = new URL("/prijava", req.url);
    // Sačuvaj ceo put + query kao callback (bez duplog enkodiranja)
    const callback = `${rawPath}${url.search}`;
    loginUrl.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Matcher — isključi Next statiku i uobičajene asset ekstenzije
export const config = {
  matcher: [
    // match-uj sve osim…
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|manifest.webmanifest|sw.js|service-worker.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|ts|tsx|map|json|txt|xml|woff|woff2|ttf|eot|otf|pdf|mp4|mp3|wav|ogg|wasm)$).*)",
  ],
};
