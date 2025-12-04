/**
 * API Route: Learning Recommendations
 * Vraća personalizovane preporuke za učenje
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { analyzeLearningProfile, generateLearningRecommendations } from "@/lib/ai/adaptive-learning";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing studentId" },
        { status: 400 }
      );
    }

    // Verify access
    if (session.user.role === "STUDENT") {
      if (session.user.student?.id !== studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Generate recommendations
    const profile = await analyzeLearningProfile(studentId);
    const recommendations = await generateLearningRecommendations(studentId);

    log.info("Learning recommendations generated", {
      studentId,
      recommendationCount: recommendations.length,
    });

    return NextResponse.json({
      success: true,
      profile,
      recommendations,
    });
  } catch (error) {
    log.error("Error generating recommendations", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

