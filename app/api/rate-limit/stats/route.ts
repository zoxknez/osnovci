/**
 * Rate Limit Stats API
 * GET /api/rate-limit/stats - Get current user's rate limit status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { applyRateLimit, addRateLimitHeaders } from "@/lib/security/rate-limit-middleware";
import { enhancedRateLimit } from "@/lib/security/enhanced-rate-limit";

/**
 * GET /api/rate-limit/stats
 * Get rate limit status for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Apply enhanced rate limiting
    const rateLimitCheck = await applyRateLimit(request, "read");
    if (!rateLimitCheck.success) return rateLimitCheck.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get detailed rate limit info across all presets
    const presets = ["api", "auth", "upload", "read", "moderation"] as const;
    const stats: Record<string, any> = {};

    for (const preset of presets) {
      const result = await enhancedRateLimit(request, preset);
      stats[preset] = {
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        violations: result.violations,
        backoffMultiplier: result.backoffMultiplier,
        blocked: result.blockedUntil ? true : false,
        blockedUntil: result.blockedUntil,
      };
    }

    const response = NextResponse.json({
      userId: session.user.id,
      role: session.user.role,
      stats,
      timestamp: Date.now(),
    });

    // Add rate limit headers
    const apiResult = await enhancedRateLimit(request, "api");
    return addRateLimitHeaders(response, apiResult);
  } catch (error) {
    console.error("Rate limit stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
