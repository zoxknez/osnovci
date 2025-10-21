/**
 * CSP (Content Security Policy) helpers
 * Compatible with Edge Runtime
 */

import { headers } from "next/headers";

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API (compatible with Edge Runtime)
 */
export function generateNonce(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

/**
 * Get the current request's nonce from headers
 * Falls back to empty string if not available (shouldn't happen in production)
 */
export async function getNonce(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-nonce") || "";
}

/**
 * Build Content Security Policy with nonce support
 */
export function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  return `
    default-src 'self';
    script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : `'nonce-${nonce}'`} https://va.vercel-scripts.com;
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data: https:;
    font-src 'self' data: https://cdn.jsdelivr.net;
    connect-src 'self' https: wss: https://vitals.vercel-insights.com;
    media-src 'self' blob:;
    worker-src 'self' blob:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}
