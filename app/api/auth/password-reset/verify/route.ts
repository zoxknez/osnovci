/**
 * Password Reset Verify API
 * POST /api/auth/password-reset/verify
 * 
 * Verifikuje token za resetovanje lozinke
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPasswordResetToken } from "@/lib/auth/password-reset";
import { log } from "@/lib/logger";

// Validation schema
const verifySchema = z.object({
  token: z.string().min(1, "Token je obavezan"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate body
    const body = await request.json();
    const validation = verifySchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { 
          valid: false,
          error: firstError?.message || "Nevažeći podaci" 
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;
    
    log.debug("Verifying password reset token");

    // 2. Verify token
    const result = await verifyPasswordResetToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { 
          valid: false,
          error: result.error 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: result.email,
      userName: result.userName,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    log.error("Password reset token verification failed", { error: errorMessage });
    
    return NextResponse.json(
      { 
        valid: false,
        error: "Greška pri verifikaciji. Pokušajte ponovo." 
      },
      { status: 500 }
    );
  }
}
