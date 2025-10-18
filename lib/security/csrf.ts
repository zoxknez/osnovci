/**
 * CSRF Protection
 * Generates and validates CSRF tokens for POST/PUT/DELETE requests
 */

import { randomBytes, createHmac } from "crypto";

const SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET;

if (!SECRET) {
  throw new Error(
    "CSRF_SECRET or NEXTAUTH_SECRET must be defined in environment variables",
  );
}

/**
 * Generate a new CSRF token
 * Returns: { token: string, secret: string }
 */
export function generateCsrfToken(): { token: string; secret: string } {
  const secret = randomBytes(32).toString("hex");
  const token = createHmac("sha256", SECRET as string)
    .update(secret)
    .digest("hex");

  return { token, secret };
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;

  const expectedToken = createHmac("sha256", SECRET as string)
    .update(secret)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expectedToken, "hex"),
  );
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

/**
 * CSRF Middleware for API routes
 */
export async function csrfMiddleware(
  req: Request,
): Promise<{ valid: boolean; error?: string }> {
  const method = req.method;

  // Skip CSRF check for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Check for CSRF token in headers
  const csrfToken = req.headers.get("x-csrf-token");
  const csrfSecret = req.headers.get("x-csrf-secret");

  if (!csrfToken || !csrfSecret) {
    return {
      valid: false,
      error: "Missing CSRF token",
    };
  }

  // Verify token
  const isValid = verifyCsrfToken(csrfToken, csrfSecret);

  if (!isValid) {
    return {
      valid: false,
      error: "Invalid CSRF token",
    };
  }

  return { valid: true };
}
