/**
 * Password Reset Confirm API
 * POST /api/auth/password-reset/confirm
 * 
 * Postavlja novu lozinku
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";
import { log } from "@/lib/logger";
import { authRateLimit } from "@/lib/upstash";

// Validation schema
const confirmSchema = z.object({
  token: z.string().min(1, "Token je obavezan"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
  confirmPassword: z.string().min(1, "Potvrdite lozinku"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lozinke se ne poklapaju",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "anonymous";
    
    if (authRateLimit) {
      const { success } = await authRateLimit.limit(`password-reset-confirm-${ip}`);
      if (!success) {
        log.warn("Rate limit exceeded for password reset confirm", { ip });
        return NextResponse.json(
          { error: "Previše pokušaja. Pokušajte ponovo za minut." },
          { status: 429 }
        );
      }
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validation = confirmSchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { 
          success: false,
          error: firstError?.message || "Nevažeći podaci" 
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    
    log.info("Password reset confirm attempt");

    // 3. Reset password
    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    log.error("Password reset confirm failed", { error: errorMessage });
    
    return NextResponse.json(
      { 
        success: false,
        error: "Greška pri resetovanju lozinke. Pokušajte ponovo." 
      },
      { status: 500 }
    );
  }
}
