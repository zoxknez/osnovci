// Link Initiation API - Step 1 of Stranger Danger Protection (Security Enhanced!)
import { type NextRequest, NextResponse } from "next/server";
import {
  internalError,
  success,
  withAuthAndRateLimit,
} from "@/lib/api/middleware";
import { initiateLink } from "@/lib/auth/stranger-danger";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
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
 * POST /api/link/initiate
 * Guardian scans QR → Returns linkCode for child approval
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

      const { studentQRData } = await request.json(); // QR contains studentId

      if (!studentQRData) {
        return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
      }

      // Guardian must be authenticated
      const guardian = await prisma.guardian.findUnique({
        where: { userId: session.user.id },
      });

      if (!guardian) {
        return NextResponse.json(
          { error: "Samo roditelji mogu skenirati QR kod" },
          { status: 403 },
        );
      }

      // Initiate link
      const result = await initiateLink(studentQRData, guardian.id);

      log.info("Link initiated by guardian", {
        guardianId: guardian.id,
        studentId: studentQRData,
      });

      return success(result);
    } catch (error) {
      return internalError(error);
    }
  },
);
