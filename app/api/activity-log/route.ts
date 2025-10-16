// Activity Log API - For parents to see what child is doing
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  withAuthAndRateLimit,
  success,
  internalError,
} from "@/lib/api/middleware";
import { getActivityLog } from "@/lib/tracking/activity-logger";

/**
 * GET /api/activity-log?studentId=xxx
 * Parents can see child's activity
 */
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const GET = withAuthAndRateLimit(
  async (request: NextRequest, session: any, _context: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const studentId = searchParams.get("studentId");
      const limit = Math.min(100, Number(searchParams.get("limit")) || 50);

      if (!studentId) {
        return NextResponse.json(
          { error: "Student ID required" },
          { status: 400 },
        );
      }

      // Verify parent has access to this student
      const guardian = await prisma.guardian.findUnique({
        where: { userId: session.user.id },
        include: {
          links: {
            where: {
              studentId,
              isActive: true,
            },
          },
        },
      });

      if (!guardian || guardian.links.length === 0) {
        return NextResponse.json(
          { error: "Forbidden", message: "Nemate pristup ovom detetu" },
          { status: 403 },
        );
      }

      // Get activity log
      const activities = await getActivityLog(studentId, limit);

      return success({
        activities,
        count: activities.length,
      });
    } catch (error) {
      return internalError(error, "Greška pri učitavanju activity log-a");
    }
  },
);
