// Learning Analytics API - Insights za učenje
import type { NextRequest } from "next/server";
import {
  analyzeLearningPatterns,
  getWeeklySummary,
} from "@/lib/analytics/learning-insights";
import {
  getAuthenticatedStudent,
  internalError,
  success,
  withAuthAndRateLimit,
} from "@/lib/api/middleware";

// Types
type Session = {
  user: {
    id: string;
    role: string;
  };
};

type Context = unknown;

/**
 * GET /api/analytics/insights
 * Get learning insights for student
 */
export const GET = withAuthAndRateLimit(
  async (_request: NextRequest, session: Session, _context: Context) => {
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
  },
);
