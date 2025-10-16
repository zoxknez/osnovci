# 🔗 KORAK 3: API ENDPOINT - DETALJNI VODIČE

**Status:** 🔄 SPREMAN ZA POKRETANJE  
**Vrijeme Procjene:** 20-30 minuta  
**Kompleksnost:** Srednja  

---

## 🎯 ŠTA TREBAMO POSTIĆI

```
CILJ: Kreiraj /api/auth/verify-email endpoint

TREBAM:
1. GET /api/auth/verify-email?token=XXX
   └─ Primeni token iz email link-a
   └─ Verificiraj email
   └─ Preusmjeri na success ili error stranicu

2. POST /api/auth/verify-email
   └─ Resend verification email
   └─ Zahtjev: { email: "user@example.com" }
```

---

## 📝 KORAK 3A: KREIRAJ API ENDPOINT

### Lokacija:
```
d:\ProjektiApp\osnovci\app\api\auth\verify-email\route.ts
```

### Fajl - Kompletan Kod:

**Kreiraj novi fajl:** `app/api/auth/verify-email/route.ts`

```typescript
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

import { NextRequest, NextResponse } from 'next/server';
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
    const result = await resendVerificationEmail(email);
    
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
```

---

## 🔍 KORAK 3B: VALIDIRAJ TYPESCRIPT

Prvo trebam kreiraj direktorijum:

```bash
# Kreira lib/auth ako ne postoji (već postoji)
# Kreira app/api/auth/verify-email ako ne postoji
```

Sada testiraj TypeScript:

```bash
cd d:\ProjektiApp\osnovci
npx tsc --noEmit 2>&1 | Select-String "verify-email"
```

**Očekivani Output:**
```
(nema greške)
```

---

## 🧪 KORAK 3C: MANUAL TESTING

### Test 1: Provjera GET Endpoint-a

```bash
# Test sa manjkaćim token-om
curl http://localhost:3000/api/auth/verify-email

# Očekivani rezultat: Redirect na /auth/verify-error?reason=no_token
```

### Test 2: Provjera POST Endpoint-a (Resend)

```bash
# Zahtjev za resend
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Očekivani rezultat:
# {
#   "success": false,
#   "error": "User not found"  (jer user ne postoji)
# }
```

---

## ✅ CHECKLIST ZA KORAK 3A

Kada završiš:

```
☐ Kreirao app/api/auth/verify-email/route.ts
☐ Dodao GET handler za token verifikaciju
☐ Dodao POST handler za resend email
☐ Validiram sa Zod schema-om
☐ Sve greške logiraju
☐ Sve redirects rade
☐ TypeScript bez grešaka
☐ npm run build - kompajlira uspješno
```

---

## 🚀 KORAK 3B: SUCCESS/ERROR STRANICE

### Kreiraj Success Stranicu

**Lokacija:** `app/(auth)/verify-success/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

export default function VerifySuccessPage() {
  return (
    <Suspense fallback={<div>Učitavam...</div>}>
      <VerifySuccessContent />
    </Suspense>
  );
}

function VerifySuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'unknown';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ✅ Email Verificiran!
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Tvoj email <strong className="text-indigo-600">{email}</strong> je
          uspješno potvrđen! 🎉
        </p>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-8">
          Sada možeš u potpunosti koristiti Osnovci. Ulogujem te...
        </p>

        {/* Button */}
        <Link
          href="/dashboard"
          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Idi na Dashboard
        </Link>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-8">
          © 2025 Osnovci - Sva Prava Zadržana
        </p>
      </div>
    </div>
  );
}
```

### Kreiraj Error Stranicu

**Lokacija:** `app/(auth)/verify-error/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { useState } from 'react';

export default function VerifyErrorPage() {
  return (
    <Suspense fallback={<div>Učitavam...</div>}>
      <VerifyErrorContent />
    </Suspense>
  );
}

function VerifyErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'Unknown error';
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const handleResend = async () => {
    setIsResending(true);
    try {
      const email = prompt('Unesi tvoj email:');
      if (!email) return;

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendStatus('success');
      } else {
        setResendStatus('error');
      }
    } catch (error) {
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  const getErrorMessage = (reason: string) => {
    switch (reason) {
      case 'no_token':
        return 'Nedostaje verification token. Molimo klikni na link iz email-a.';
      case 'Invalid verification token':
        return 'Verification token je nevalidan. Molimo zatraži novi email.';
      case 'Verification token has expired':
        return 'Verification token je istekao. Molimo zatraži novi email.';
      case 'User not found':
        return 'Korisnik nije pronađen. Molimo registriraj se ponovo.';
      default:
        return reason;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ❌ Greška pri Verifikaciji
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">{getErrorMessage(reason)}</p>

        {/* Resend Status */}
        {resendStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✅ Novi verification email je poslan! Provjeri tvoj inbox.
          </div>
        )}

        {resendStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ❌ Greška pri slanju email-a. Pokušaj ponovo.
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {isResending ? 'Slanjem...' : '📧 Zatraži Novi Email'}
          </button>

          <Link
            href="/auth/prijava"
            className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Vrati se na Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-8">
          © 2025 Osnovci - Sva Prava Zadržana
        </p>
      </div>
    </div>
  );
}
```

---

## 📋 CHECKLIST ZA KORAK 3

Kada završiš:

```
API ENDPOINT:
☐ Kreirao app/api/auth/verify-email/route.ts
☐ GET handler sa token verifikacijom
☐ POST handler sa resend email
☐ Zod validacija
☐ Proper redirects
☐ Error logging

SUCCESS STRANICA:
☐ Kreirao app/(auth)/verify-success/page.tsx
☐ Prikazuje email koji je verificiran
☐ Dugme za dashboard
☐ Child-friendly dizajn
☐ Responsive layout

ERROR STRANICA:
☐ Kreirao app/(auth)/verify-error/page.tsx
☐ Prikazuje error poruku
☐ Resend email opcija
☐ Vrati se na login dugme
☐ Error status prikazivanje

TESTIRANJE:
☐ npm run build - bez greške
☐ npx tsc --noEmit - bez greške
```

---

## 🚀 SLEDEĆE:

**KORAK 4:** Update Registracija sa Email Slanjem

Trebam da:
1. Update `app/api/auth/register/route.ts`
2. Pozove `createAndSendVerificationEmail()` nakon user kreiranja
3. Preusmjeri na verify-pending stranicu

