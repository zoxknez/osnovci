// Child Approval API - Step 2 of Stranger Danger Protection (Security Enhanced!)
import { type NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedStudent,
  internalError,
  success,
  withAuthAndRateLimit,
} from "@/lib/api/middleware";
import {
  childApproves,
  sendGuardianVerificationEmail,
} from "@/lib/auth/stranger-danger";
import { csrfMiddleware } from "@/lib/security/csrf";

// Types
type Session = {
  user: {
    id: string;
    role: string;
  };
};

type Context = unknown;

/**
 * POST /api/link/child-approve
 * Child confirms: "Da, ovo je moj roditelj"
 */
export const POST = withAuthAndRateLimit(
  async (request: NextRequest, session: Session, _context: Context) => {
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
