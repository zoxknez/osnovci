// CSRF Token Generation Endpoint
// GET /api/csrf - Generate new CSRF token

import { handleAPIError } from "@/lib/api/handlers/errors";
import { successResponse } from "@/lib/api/handlers/response";
import { generateCsrfToken } from "@/lib/security/csrf";

/**
 * GET /api/csrf
 * Generates a new CSRF token for client-side requests
 */
export async function GET() {
  try {
    const { token, secret } = generateCsrfToken();

    return successResponse({
      token,
      secret,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
