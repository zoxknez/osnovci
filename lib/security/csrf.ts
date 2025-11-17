/**
 * CSRF Protection
 * Generates and validates CSRF tokens for POST/PUT/DELETE requests
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET = process.env["CSRF_SECRET"] || process.env["NEXTAUTH_SECRET"];

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
  // Using Node's built-in timingSafeEqual for better security and performance
  return timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expectedToken, "hex"),
  );
}

/**
 * CSRF Middleware for API routes with Origin verification
 */
export async function csrfMiddleware(
  req: Request,
): Promise<{ valid: boolean; error?: string }> {
  const method = req.method;

  // Skip CSRF check for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Origin verification - prevent cross-site attacks
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return {
          valid: false,
          error: "Origin mismatch - potential CSRF attack",
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: "Invalid origin header",
      };
    }
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
