// CSRF Protection - Cross-Site Request Forgery prevention
import { createHmac, randomBytes } from "node:crypto";

const CSRF_SECRET =
  process.env.CSRF_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "default-secret-change-this";
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now();
  const randomValue = randomBytes(32).toString("hex");
  const data = `${timestamp}:${randomValue}`;

  const signature = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");

  return `${data}:${signature}`;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  try {
    const [timestamp, randomValue, signature] = token.split(":");

    if (!timestamp || !randomValue || !signature) {
      return false;
    }

    // Check expiry
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();

    if (now - tokenTime > TOKEN_EXPIRY) {
      return false;
    }

    // Verify signature
    const data = `${timestamp}:${randomValue}`;
    const expectedSignature = createHmac("sha256", CSRF_SECRET)
      .update(data)
      .digest("hex");

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * React Hook za CSRF token
 */
export function useCSRFToken(): {
  token: string;
  getHeaders: () => Record<string, string>;
} {
  const token = generateCSRFToken();

  return {
    token,
    getHeaders: () => ({
      "X-CSRF-Token": token,
    }),
  };
}

/**
 * Middleware helper za checking CSRF token
 */
export function verifyCSRFToken(
  token: string | null | undefined,
  method: string,
): boolean {
  // Skip CSRF for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    return true;
  }

  if (!token) {
    return false;
  }

  return validateCSRFToken(token);
}
