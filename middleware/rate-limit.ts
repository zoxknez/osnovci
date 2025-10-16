// Rate Limiting Middleware - Zaštita od abuse
// Kritično za security!

import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory rate limiter (za development)
 * Za produkciju koristiti Redis (@upstash/ratelimit)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Proverava da li je request dozvoljen
   */
  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests (outside window)
    const recentRequests = requests.filter((time) => time > windowStart);

    // Check if limit exceeded
    const allowed = recentRequests.length < this.maxRequests;

    if (allowed) {
      // Add current request
      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);
    }

    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - recentRequests.length),
      resetAt: windowStart + this.windowMs,
    };
  }

  /**
   * Cleanup stare entries (pozivati periodično)
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Rate limiters za različite endpointe
const limiters = {
  // Auth endpoints: 5 req/min
  auth: new RateLimiter(60 * 1000, 5),

  // Upload endpoints: 10 req/hour
  upload: new RateLimiter(60 * 60 * 1000, 10),

  // API endpoints: 100 req/min
  api: new RateLimiter(60 * 1000, 100),

  // Strict: 3 req/min (za login nakon failed attempts)
  strict: new RateLimiter(60 * 1000, 3),
};

// Cleanup every 5 minutes
if (typeof window === "undefined") {
  setInterval(() => {
    Object.values(limiters).forEach((limiter) => {
      limiter.cleanup();
    });
  }, 5 * 60 * 1000);
}

/**
 * Get identifier za rate limiting (IP + user ID)
 */
function getIdentifier(request: NextRequest): string {
  // Use IP address
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Add user ID if authenticated (from cookie/token)
  // TODO: Extract from session

  return ip;
}

/**
 * Rate limit middleware
 */
export function rateLimit(limiter: keyof typeof limiters = "api") {
  return async (request: NextRequest) => {
    const identifier = getIdentifier(request);
    const limit = limiters[limiter];
    const result = limit.check(identifier);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Previše zahteva. Pokušaj ponovo kasnije.",
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(limit.maxRequests),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.resetAt),
          },
        },
      );
    }

    // Add rate limit headers to response
    return NextResponse.next({
      headers: {
        "X-RateLimit-Limit": String(limit.maxRequests),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    });
  };
}

/**
 * Rate limit helper za API routes
 */
export async function checkRateLimit(
  request: Request,
  limiter: keyof typeof limiters = "api",
): Promise<{ success: true } | { success: false; response: Response }> {
  // Convert Request to NextRequest
  const nextRequest = new NextRequest(request);
  const identifier = getIdentifier(nextRequest);
  const limit = limiters[limiter];
  const result = limit.check(identifier);

  if (!result.allowed) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Previše zahteva. Pokušaj ponovo kasnije.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000),
            ),
          },
        },
      ),
    };
  }

  return { success: true };
}
