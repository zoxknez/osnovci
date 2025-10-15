// Child Approval API - Step 2 of Stranger Danger Protection
import { type NextRequest, NextResponse } from "next/server";
import { childApproves, sendGuardianVerificationEmail } from "@/lib/auth/stranger-danger";
import { prisma } from "@/lib/db/prisma";
import { withAuthAndRateLimit, getAuthenticatedStudent, success, internalError } from "@/lib/api/middleware";

/**
 * POST /api/link/child-approve
 * Child confirms: "Da, ovo je moj roditelj"
 */
export const POST = withAuthAndRateLimit(async (request: NextRequest, session: any) => {
  try {
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
});

