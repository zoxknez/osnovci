# ✅ EMAIL VERIFICATION - KORAK 4 CHECKLIST

**KORAK:** 4/4 - Update Registracija  
**SPREMAN ZA:** Implementaciju  
**VRIJEME:** ~15-20 minuta  
**TEŠKOĆE:** 🟢 LAKA  

---

## 📋 PRE-CHECKLIST (Prije nego počneš)

- [ ] Čitao sam `📧_KORAK_2_EMAIL_SERVICE.md` - Razumijem email service
- [ ] Čitao sam `🔗_KORAK_3_API_ENDPOINT.md` - Razumijem verify endpoint
- [ ] Imam otvorene fajlove:
  - [ ] `app/api/auth/register/route.ts`
  - [ ] `lib/auth/email-verification.ts`
  - [ ] Text editor spreman za pisanje
- [ ] Build je OK: `npm run build` ✅
- [ ] Nema greške: `npx tsc --noEmit` ✅

---

## 🔧 KORAK 4.1 - UPDATE REGISTRATION ENDPOINT

### File: `app/api/auth/register/route.ts`

#### ✅ Što trebam raditi:

1. **Dodaj import na početak fajla:**
   ```typescript
   import { createAndSendVerificationEmail } from '@/lib/auth/email-verification';
   ```

2. **Pronađi gdje se user kreira:**
   ```typescript
   // PRONAĐI OVO:
   const user = await prisma.user.create({
     data: {
       email: validEmail,
       name: validData.name,
       password: hashedPassword,
     },
   });
   ```

3. **Dodaj email slanje nakon user.create():**
   ```typescript
   // ODMAH NAKON user.create():
   
   // Send verification email
   const emailResult = await createAndSendVerificationEmail(
     validEmail,
     validData.name
   );
   
   if (!emailResult.success) {
     logger.error('Failed to send verification email', { 
       email: validEmail, 
       error: emailResult.error 
     });
     // Opcionalno: obriši usera ako email slanje fajlja
     // await prisma.user.delete({ where: { email: validEmail } });
     // throw new Error('Failed to send verification email');
   }
   ```

4. **Promijeni response da NIJE login odmah:**
   ```typescript
   // STARO (ako postoji):
   // return NextResponse.json({
   //   success: true,
   //   user: {...}
   // });
   
   // NOVO - REDIRECT NA VERIFY-PENDING:
   return NextResponse.json(
     {
       success: true,
       message: 'Check your email to verify your account',
       email: validEmail,
       verificationSent: true,
     },
     { status: 201 }
   );
   ```

5. **OPCIONALNOm: NE postavi session automatski**
   ```typescript
   // AKO POSTOJI NEŠTO POPUT OVOGA:
   // await auth.createSession(user.id);
   
   // COMMENT OUT ILI OBRIŠI:
   // BEZ TOGA - User mora prvo verificiati email!
   ```

#### 🎯 Finalni kod će izgledati:
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validacija
    const validData = registerSchema.parse(body);
    const validEmail = validData.email.toLowerCase();
    
    // Provjeri postojeći user
    const existing = await prisma.user.findUnique({
      where: { email: validEmail },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(validData.password, 10);
    const user = await prisma.user.create({
      data: {
        email: validEmail,
        name: validData.name,
        password: hashedPassword,
      },
    });
    
    // 🎯 NOVO - Send verification email
    const emailResult = await createAndSendVerificationEmail(
      validEmail,
      validData.name
    );
    
    if (!emailResult.success) {
      logger.error('Failed to send verification email', {
        email: validEmail,
        error: emailResult.error,
      });
    }
    
    // 🎯 NOVO - Vrati success ali NIJE login
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Check your email to verify account.',
        email: validEmail,
        verificationSent: emailResult.success,
      },
      { status: 201 }
    );
    
  } catch (error) {
    logger.error('Registration error', { error });
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

### ✅ Checklist za Korak 4.1:
- [ ] Import `createAndSendVerificationEmail` dodan
- [ ] Email slanje dodano nakon `user.create()`
- [ ] Response promijenjen (nema automatskog login-a)
- [ ] Build ok: `npm run build` ✅
- [ ] 0 TypeScript greške: `npx tsc --noEmit` ✅

---

## 🔧 KORAK 4.2 - KREIRAJ VERIFY-PENDING STRANICA

### File: `app/(auth)/verify-pending/page.tsx`

#### ✅ Što trebam raditi:

Kreiraj NOVI fajl:

```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function VerifyPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendStatus('idle');
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendStatus('success');
        setResendMessage('✅ Email resent! Check your inbox.');
      } else {
        setResendStatus('error');
        setResendMessage('❌ Failed to resend. Try again or contact support.');
      }
    } catch (error) {
      setResendStatus('error');
      setResendMessage('❌ Error sending email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        
        {/* Waiting Icon */}
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-blue-500 animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
            title="Waiting for email verification"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📧 Check Your Email!
        </h1>

        {/* Email Display */}
        <p className="text-gray-600 mb-6">
          We sent a verification link to:
          <br />
          <span className="font-semibold text-blue-600 break-all">{email}</span>
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
          <p className="text-sm text-gray-700">
            ✅ Click the link in the email to verify your account.
            <br />
            ✅ Link expires in 24 hours.
            <br />
            ✅ Check spam folder if you don't see it.
          </p>
        </div>

        {/* Resend Status Messages */}
        {resendStatus === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {resendMessage}
          </div>
        )}
        {resendStatus === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {resendMessage}
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResendEmail}
          disabled={isResending}
          type="button"
          className={`w-full py-3 px-4 rounded-lg font-semibold mb-3 transition-all ${
            isResending
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isResending ? '⏳ Sending...' : '🔄 Resend Email'}
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Logout Button */}
        <Link
          href="/api/auth/signout"
          className="block w-full py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-center"
        >
          🚪 Logout
        </Link>

        {/* Footer Help */}
        <p className="text-xs text-gray-500 mt-6">
          Didn't receive email?
          <br />
          Use "Resend Email" button above or contact support.
        </p>
      </div>
    </div>
  );
}
```

#### 📝 Gdje kreiram fajl?
```
app/
└─ (auth)/
   ├─ verify-pending/
   │  └─ page.tsx  ← KREIRAJ OVDJE
   ├─ verify-success/
   │  └─ page.tsx
   ├─ verify-error/
   │  └─ page.tsx
```

### ✅ Checklist za Korak 4.2:
- [ ] Direktoryium `app/(auth)/verify-pending/` kreiran
- [ ] Fajl `page.tsx` kreiran sa kodom
- [ ] Icon prikazuje se (pulsira)
- [ ] Resend button radi (poziva API)
- [ ] Logout link radi
- [ ] Build ok: `npm run build` ✅
- [ ] 0 TypeScript greške: `npx tsc --noEmit` ✅

---

## 🔧 KORAK 4.3 - UPDATE REGISTRATION FRONT-END (OPTIONAL)

Ako imaš registracijski form na front-end-u, trebam ga update-ati:

### File: `app/(auth)/registracija/page.tsx` (ILI GDJE GOD JE)

#### Primjer promjene:

```typescript
// NAKON uspješne registracije:
const handleRegister = async (formData: RegisterFormData) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();
      
      // 🎯 NOVO - Preusmjeri na verify-pending umjesto logovanja
      router.push(`/auth/verify-pending?email=${encodeURIComponent(data.email)}`);
    } else {
      // Error handling
      const error = await response.json();
      setError(error.error || 'Registration failed');
    }
  } catch (error) {
    setError('Registration failed. Please try again.');
  }
};
```

### ✅ Checklist za Korak 4.3:
- [ ] Form submit handler pronađen
- [ ] Redirect na verify-pending dodan
- [ ] Email parametar prosljeđen u URL
- [ ] Build ok ✅

---

## 🧪 KORAK 4.4 - TESTING (KOMPLETAN TOK)

### Test Plan:

#### 🟢 Test 1: Registracija i Email Slanje
```bash
1. Otvori http://localhost:3000/auth/registracija
2. Popuni formu:
   - Email: test@example.com
   - Ime: Test User
   - Lozinka: TestPass123!
3. Klikni "Registriraj se"
4. ✅ Trebam biti preusmeran na /auth/verify-pending?email=test@example.com
5. ✅ Trebam vidjeti stranicu "📧 Check Your Email!"
```

#### 🟢 Test 2: Otvori Email Link
```bash
1. Otvori Ethereal Email inbox:
   https://ethereal.email/messages (koristi kredencijale iz .env.local)
2. ✅ Trebam vidjeti email sa subject-om "Verify your email"
3. ✅ Email sadrži link: /api/auth/verify-email?token=XXXXX
4. Klikni link u email-u
5. ✅ Trebam biti preusmeran na /auth/verify-success?email=test@example.com
6. ✅ Trebam vidjeti "✅ Email Verified!"
```

#### 🟢 Test 3: Login nakon Verifikacije
```bash
1. Otvori http://localhost:3000/auth/prijava
2. Login sa:
   - Email: test@example.com
   - Lozinka: TestPass123!
3. ✅ Login trebam biti uspješan
4. ✅ Trebam biti preusmeran na /dashboard
```

#### 🟢 Test 4: Resend Email
```bash
1. Registriraj se sa novim emailom: test2@example.com
2. Klikni "🔄 Resend Email" na verify-pending stranicu
3. ✅ Trebam vidjeti: "✅ Email resent! Check your inbox."
4. Otvori Ethereal inbox
5. ✅ Trebam vidjeti NOVI email sa novim tokenom
```

#### 🟢 Test 5: Istekao Token
```bash
1. Registriraj se: test3@example.com
2. Ponekad provjeri email, ali ČEKAJ bar 24+ sata (ili update DB ručno)
3. Klikni link sa isteklim tokenom
4. ✅ Trebam vidjeti error: "Token has expired"
5. Klikni "🔄 Resend Email"
6. Novi token trebam biti sendiran
```

### ✅ Checklist za Korak 4.4 - Testing:
- [ ] Test 1 - Registracija OK ✅
- [ ] Test 2 - Email Link OK ✅
- [ ] Test 3 - Login OK ✅
- [ ] Test 4 - Resend OK ✅
- [ ] Test 5 - Expiration OK ✅
- [ ] Build ok: `npm run build` ✅
- [ ] 0 TypeScript greške: `npx tsc --noEmit` ✅

---

## 🚀 DEPLOYMENT CHECKLIST

### Prije produkcije:

- [ ] Svi testovi prošli ✅
- [ ] Build je čist: `npm run build`
- [ ] Nema TypeScript greške: `npx tsc --noEmit`
- [ ] Nema runtime error-a u terminalima
- [ ] .env.production setupan sa SendGrid API ključem
- [ ] NEXTAUTH_URL upoznat na production domen
- [ ] EMAIL_FROM je production email
- [ ] Database migrirana na production
- [ ] Backup-a postojećih podataka
- [ ] Deploy na Vercel / hosting

---

## 📊 FINAL CHECKLIST - KORAK 4 GOTOV

```
IMPLEMENTATION:
├─ [ ] 4.1 - Update registration endpoint
├─ [ ] 4.2 - Create verify-pending page
└─ [ ] 4.3 - Update frontend form (optional)

TESTING:
├─ [ ] 4.4.1 - Registration + Email
├─ [ ] 4.4.2 - Email link verification
├─ [ ] 4.4.3 - Login after verification
├─ [ ] 4.4.4 - Resend email
└─ [ ] 4.4.5 - Token expiration

VALIDATION:
├─ [ ] npm run build OK
├─ [ ] npx tsc --noEmit OK
└─ [ ] Manual testing OK

DOCUMENTATION:
└─ [ ] ✅_KORAK_4_ZAVRŠEN.md (kreiraj nakon testiranja)
```

---

## ✨ GOTOVO!

Kada su svi checklistovi ✅:

🎉 **EMAIL VERIFICATION JE 100% GOTOV!**

```
USER REGISTRATION FLOW:
✅ Registracija
✅ Email slanje
✅ Email verifikacija
✅ Login sa verificiranim emailom
✅ Dashboard pristup
```

**Spreman za produkciju!** 🚀

---

**SADA:** Kreni sa Korak 4.1 - Update Registration Endpoint  
**VRIJEME:** ~15-20 minuta za sve 4 podkoraka + testing  
**VERZIJA:** 1.0  
**DATUM:** Oct 16, 2024

