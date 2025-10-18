// Child Approval API - Step 2 of Stranger Danger Protection (Security Enhanced!)
import { type NextRequest, NextResponse } from "next/server";
import {
  childApproves,
  sendGuardianVerificationEmail,
} from "@/lib/auth/stranger-danger";
import {
  withAuthAndRateLimit,
  getAuthenticatedStudent,
  success,
  internalError,
} from "@/lib/api/middleware";
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * POST /api/link/child-approve
 * Child confirms: "Da, ovo je moj roditelj"
 */
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const POST = withAuthAndRateLimit(
  async (request: NextRequest, session: any, _context: any) => {
    try {
      // CSRF Protection
      const csrfResult = await csrfMiddleware(request);
      if (!csrfResult.valid) {
        return NextResponse.json(
          { error: "Forbidden", message: csrfResult.error },
          { status: 403 },
        );
      }

      const student = await getAuthenticatedStudent(session.user.id);
      const { linkCode, approved, guardianEmail } = await request.json();

      if (!approved) {
        return NextResponse.json(
          { success: false, message: "Odbio si povezivanje" },
          { status: 400 },
        );
      }

      // Child approves
      const result = await childApproves(linkCode, student.id);

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      // Send email to guardian
      if (guardianEmail) {
        await sendGuardianVerificationEmail(linkCode, guardianEmail);
      }

      return success(result);
    } catch (error) {
      return internalError(error);
    }
  },
);
