// Learning Analytics API - Insights za učenje
import { type NextRequest } from "next/server";
import { withAuthAndRateLimit, getAuthenticatedStudent, success, internalError } from "@/lib/api/middleware";
import { analyzeLearningPatterns, getWeeklySummary } from "@/lib/analytics/learning-insights";

/**
 * GET /api/analytics/insights
 * Get learning insights for student
 */
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const GET = withAuthAndRateLimit(async (request: NextRequest, session: any, _context: any) => {
  try {
    const student = await getAuthenticatedStudent(session.user.id);

    const insights = await analyzeLearningPatterns(student.id);
    const weeklySummary = await getWeeklySummary(student.id);

    return success({
      insights,
      weeklySummary,
    });
  } catch (error) {
    return internalError(error, "Greška pri učitavanju insights-a");
  }
});

