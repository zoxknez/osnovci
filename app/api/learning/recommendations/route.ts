/**
 * API Route: Learning Recommendations
 * Vraća personalizovane preporuke za učenje
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import {
  analyzeLearningProfile,
  generateLearningRecommendations,
} from "@/lib/ai/adaptive-learning";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "learning-recommendations",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Nedostaje studentId", requestId },
        { status: 400 },
      );
    }

    // Verify access
    if (session.user.role === "STUDENT") {
      if (session.user.student?.id !== studentId) {
        return NextResponse.json(
          { error: "Nemate pristup", requestId },
          { status: 403 },
        );
      }
    }

    // Generate recommendations
    const profile = await analyzeLearningProfile(studentId);
    const recommendations = await generateLearningRecommendations(studentId);

    log.info("Learning recommendations generated", {
      studentId,
      recommendationCount: recommendations.length,
      requestId,
    });

    return NextResponse.json({
      success: true,
      requestId,
      profile,
      recommendations,
    });
  } catch (error) {
    log.error("Error generating recommendations", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri generisanju preporuka", requestId },
      { status: 500 },
    );
  }
}
