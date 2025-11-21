"use server";

import { auth } from "@/lib/auth/config";
import { getRateLimitStatus } from "@/lib/security/enhanced-rate-limit";
import { headers } from "next/headers";

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

export async function getRateLimitStatsAction(): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const headersList = await headers();
    
    // Get detailed rate limit info across all presets
    const presets = ["api", "auth", "upload", "read", "moderation"] as const;
    const stats: Record<string, any> = {};

    for (const preset of presets) {
      const result = await getRateLimitStatus(
        { headers: headersList }, 
        preset, 
        session.user.id
      );
      
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

    return {
      data: {
        userId: session.user.id,
        role: session.user.role,
        stats,
        timestamp: Date.now(),
      }
    };
  } catch (error) {
    console.error("Rate limit stats Action error:", error);
    return { error: "Internal server error" };
  }
}
