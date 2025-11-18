// Parental Consent Verification (Security Enhanced!)
import { type NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";

/**
 * POST /api/parental-consent/verify
 * Parent clicks link in email to verify consent
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Kod je obavezan" },
        { status: 400 },
      );
    }

    // Use new consent verification system
    const { verifyConsentCode } = await import("@/lib/auth/parental-consent");

    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const result = await verifyConsentCode({
      code,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Verifikacija nije uspela" },
        { status: 400 },
      );
    }

    log.info("Parental consent verified via verify endpoint", {
      studentId: result.studentId,
      studentName: result.studentName,
    });

    return NextResponse.json({
      success: true,
      message: "Hvala! Nalog deteta je sada aktivan. 🎉",
      student: {
        id: result.studentId,
        name: result.studentName,
      },
    });
  } catch (error) {
    log.error("Parental consent verification failed", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
