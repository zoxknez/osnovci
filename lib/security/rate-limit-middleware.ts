/**
 * Enhanced Rate Limit Middleware Helper
 * Easy-to-use wrapper for API routes with tiered rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { enhancedRateLimit, TieredRateLimitPresets } from "@/lib/security/enhanced-rate-limit";

/**
 * Apply enhanced rate limiting to an API route
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(request, "api");
 *   if (!rateLimitResult.success) return rateLimitResult.response;
 *   
 *   // Process request...
 * }
 * ```
 */
export async function applyRateLimit(
  request: NextRequest,
  preset: keyof typeof TieredRateLimitPresets = "api"
): Promise<
  | { success: true }
  | { success: false; response: NextResponse }
> {
  const result = await enhancedRateLimit(request, preset);

  if (!result.success) {
    const headers = new Headers({
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.reset),
      "X-RateLimit-Violations": String(result.violations),
      "X-RateLimit-Backoff": String(result.backoffMultiplier),
      "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
    });

    if (result.blockedUntil) {
      headers.set("X-RateLimit-Blocked-Until", String(result.blockedUntil));
    }

    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Too Many Requests",
          message: result.violations >= 3
            ? "Previše pokušaja. Vaš nalog je privremeno blokiran."
            : "Previše zahteva. Pokušajte ponovo kasnije.",
          violations: result.violations,
          backoffMultiplier: result.backoffMultiplier,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          ...(result.blockedUntil && {
            blockedUntil: result.blockedUntil,
          }),
        },
        {
          status: 429,
          headers,
        }
      ),
    };
  }

  return { success: true };
}

/**
 * Add rate limit headers to successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: { limit: number; remaining: number; reset: number; violations?: number; backoffMultiplier?: number }
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.reset));
  
  if (result.violations !== undefined) {
    response.headers.set("X-RateLimit-Violations", String(result.violations));
  }
  
  if (result.backoffMultiplier !== undefined) {
    response.headers.set("X-RateLimit-Backoff", String(result.backoffMultiplier));
  }

  return response;
}
