// app/api/auth/verify-email/route.ts
/**
 * Email Verification Endpoint
 * 
 * GET /api/auth/verify-email?token=XXX
 *   └─ Verificiraj email sa token-om
 *   └─ Redirect na success ili error stranicu
 *
 * POST /api/auth/verify-email
 *   └─ Resend verification email
 *   └─ Body: { email: "user@example.com" }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  verifyEmailToken,
  resendVerificationEmail,
} from '@/lib/auth/email-verification';
import { log } from '@/lib/logger';

/**
 * GET /api/auth/verify-email?token=XXX
 * 
 * User je kliknuo link iz email-a
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Provjeri token
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      log.warn('Verify email endpoint called without token');
      
      return NextResponse.redirect(
        new URL('/auth/verify-error?reason=no_token', request.url),
      );
    }
    
    log.info('Email verification attempt', {
      tokenLength: token.length,
    });
    
    // 2. Verificiraj token
    const result = await verifyEmailToken(token);
    
    // 3. Preusmeravaj na success stranicu
    return NextResponse.redirect(
      new URL(
        `/auth/verify-success?email=${encodeURIComponent(result.email)}`,
        request.url,
      ),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Email verification failed', { error: errorMessage });
    
    // Preusmeravaj na error stranicu
    return NextResponse.redirect(
      new URL(
        `/auth/verify-error?reason=${encodeURIComponent(errorMessage)}`,
        request.url,
      ),
    );
  }
}

/**
 * POST /api/auth/verify-email
 * 
 * Resend verification email
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validiraj request body
    const body = await request.json();
    
    const schema = z.object({
      email: z.string().email('Invalid email address'),
    });
    
    const validated = schema.safeParse(body);
    
    if (!validated.success) {
      log.warn('Invalid resend email request', {
        errors: validated.error.flatten(),
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
          details: validated.error.flatten(),
        },
        { status: 400 },
      );
    }
    
    const { email } = validated.data;
    
    log.info('Resend verification email request', { email });
    
    // 2. Resend email
    await resendVerificationEmail(email);
    
    log.info('Verification email resent', { email });
    
    // 3. Vrati success
    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent',
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Resend verification email failed', { error: errorMessage });
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 400 },
    );
  }
}
