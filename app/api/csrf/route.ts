// CSRF Token Generation Endpoint
// GET /api/csrf - Generate new CSRF token

import { generateCsrfToken } from "@/lib/security/csrf";
import { successResponse } from "@/lib/api/handlers/response";
import { handleAPIError } from "@/lib/api/handlers/errors";

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
