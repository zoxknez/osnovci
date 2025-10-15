// Link Initiation API - Step 1 of Stranger Danger Protection
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { initiateLink } from "@/lib/auth/stranger-danger";
import { withAuthAndRateLimit, success, internalError } from "@/lib/api/middleware";

/**
 * POST /api/link/initiate
 * Guardian scans QR → Returns linkCode for child approval
 */
// biome-ignore lint: session type from NextAuth, context from Next.js 15
export const POST = withAuthAndRateLimit(async (request: NextRequest, session: any, _context: any) => {
  try {
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
});

