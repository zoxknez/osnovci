# 📧 EMAIL VERIFICATION - DETALJNI STEP-BY-STEP VODIČE

**Korak po Korak - Bez Žurenja**  
**Vrijeme:** 1-2 sedmice  
**Kvaliteta:** A+  

---

## 🎯 ŠTA TREBAMO POSTIĆI

```
PRIJE:
└─ User se registrira sa bilo kakvim email-om
   └─ Email se ne verificira
   └─ Nema sigurnosti

NAKON:
└─ User se registrira
   └─ Dobija email sa verification link-om
   └─ Mora kliknut link u 24h
   └─ Email se verificira
   └─ Account je spreman za korišćenje
```

---

## 📋 KORAK 1: ANALIZA POSTOJEĆEG KODA

### 1.1 Provjeri Trenutnu Registraciju

Prvo, otvori `app/api/auth/register/route.ts` i pročitaj kako se trenutno radi.

**Šta trebam znati:**
- Gdje se kreira User?
- Kako se hashira password?
- Gdje se mogu dodati validacije?
- Kako se vraćaju errori?

```bash
# Otvori fajl za čitanje
cat app/api/auth/register/route.ts
```

### 1.2 Provjeri Prisma Schema

Otvori `prisma/schema.prisma` i nađi User model.

```bash
# Provjeri User model
grep -A 20 "model User" prisma/schema.prisma
```

**Šta trebam vidjeti:**
- Postoji li već `emailVerified` polje?
- Koja polja ima User?
- Koji su indexi postavleni?

---

## 📝 KORAK 2: UPDATE PRISMA SCHEMA

### 2.1 Dodaj Validation Token Model

Otvori `prisma/schema.prisma` i dodaj na **KRAJU** fajla (prije ili nakon User modela):

```prisma
model VerificationToken {
  email     String
  token     String      @unique
  expires   DateTime
  createdAt DateTime    @default(now())
  
  @@id([email, token])
}
```

**Objašnjenje:**
- `email` - Kojem email-u pripada token
- `token` - Heširani verification token
- `expires` - Kada token ističe (24h)
- `createdAt` - Kada je token kreiran

### 2.2 Update User Model

U User modelu, pronađi gdje je ostalo polja i dodaj:

```prisma
model User {
  // ... ostala polja ...
  emailVerified   DateTime?   // NULL = nije verificiran, DateTime = verificiran
  
  // ... ostatak modela ...
}
```

### 2.3 Provjeri Index

Dodaj index za brže queries:

```prisma
model VerificationToken {
  email     String
  token     String      @unique
  expires   DateTime
  createdAt DateTime    @default(now())
  
  @@id([email, token])
  @@index([email])
  @@index([expires])
}
```

### 2.4 Kreiraj Migraciju

```bash
# U terminalu:
npx prisma migrate dev --name add_verification

# Odgovori na prompt:
# ? Enter a name for the new migration: › add_email_verification

# Ovo će:
# 1. Kreirati migration fajl
# 2. Primjenjati na dev bazu
# 3. Regenerirati Prisma Client
```

**Očekivani Output:**
```
✓ Created file src/migrations/20251016_add_email_verification/migration.sql
✓ Database has been updated
✓ Generated Prisma Client
```

---

## 📧 KORAK 3: KREIRAJ EMAIL SERVICE

### 3.1 Instalacija Paketa

```bash
# Za slanje email-a:
npm install nodemailer
npm install -D @types/nodemailer

# Za environment variables:
npm install zod dotenv-defaults

# Verifikuj instalacija:
npm list nodemailer
```

### 3.2 Kreiraj Email Service

**Napravi novi fajl:** `lib/email/service.ts`

```typescript
// lib/email/service.ts
import nodemailer from 'nodemailer';
import { log } from '@/lib/logger';

// Tip za email rezultat
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Inicijalizuj email transporter
 * Koristi različite provider-e ovisno od okruženja
 */
function createTransporter() {
  // Za development - koristi test account
  if (process.env.NODE_ENV === 'development') {
    // test1070.a6b3d7c9@ethereal.email / ethereal password
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_TEST_USER || 'test@ethereal.email',
        pass: process.env.EMAIL_TEST_PASS || 'test_password',
      },
    });
  }

  // Za production - koristi SendGrid ili slično
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Fallback
  throw new Error('Email service nije konfigurisan');
}

/**
 * Pošalji verification email
 */
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  token: string,
): Promise<EmailResult> {
  try {
    // Kreiraj transporter
    const transporter = createTransporter();

    // Kreiraj verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // HTML sadržaj
    const htmlContent = `
<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #667eea;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 12px 30px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Potvrdi svoj Email</h1>
    </div>
    
    <div class="content">
      <p>Zdravo ${userName}! 👋</p>
      
      <p>Hvala što si se prijavio u <strong>Osnovci</strong>! 🎓</p>
      
      <p>Klikni na dugme ispod da potvrdiš svoj email adresu. Verification link je validan 24 sata.</p>
      
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">✓ Potvrdi Email</a>
      </p>
      
      <p style="background-color: #f0f7ff; padding: 15px; border-radius: 4px; border-left: 4px solid #667eea;">
        <strong>Ili kopbiraj link u pretraživač:</strong><br>
        <code style="word-break: break-all; font-size: 11px;">${verificationUrl}</code>
      </p>
      
      <p>Ako nisi kreirao ovaj nalog, slobodno ignoriši ovaj email.</p>
    </div>
    
    <div class="footer">
      <p>© 2025 Osnovci. Sva prava zadržana.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text verzija
    const textContent = `
Potvrdi svoj Email

Zdravo ${userName}!

Hvala što si se prijavio u Osnovci!

Klikni na link ispod da potvrdiš svoj email (validan 24 sata):

${verificationUrl}

Ako nisi kreirao ovaj nalog, slobodno ignoriši ovaj email.

© 2025 Osnovci
    `;

    // Pošalji email
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@osnovci.app',
      to: toEmail,
      subject: '✅ Potvrdi svoj email | Osnovci',
      text: textContent,
      html: htmlContent,
    });

    log.info('Verification email sent', {
      to: toEmail,
      messageId: result.messageId,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Failed to send verification email', {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Šalji drugi tipovi email-a
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string,
): Promise<EmailResult> {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@osnovci.app',
      to: toEmail,
      subject: '🎉 Dobrodošao u Osnovci!',
      html: `<p>Zdravo ${userName}!</p><p>Dobrodošao u Osnovci aplikaciju! 🎓</p>`,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 3.3 Environment Variables

Dodaj u `.env.local` (development):

```bash
# Email Configuration (Development)
EMAIL_FROM="noreply@osnovci.app"
EMAIL_TEST_USER="test@ethereal.email"
EMAIL_TEST_PASS="ethereal_password"

# Za production - dodaj SendGrid:
SENDGRID_API_KEY="SG.xxxxxxxxxxxxx"
```

---

## 🔐 KORAK 4: KREIRAJ VERIFICATION LOGIC

### 4.1 Kreiraj Verification Helper

**Fajl:** `lib/auth/email-verification.ts`

```typescript
// lib/auth/email-verification.ts
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { sendVerificationEmail } from '@/lib/email/service';
import { log } from '@/lib/logger';

/**
 * Kreiraj verification token i pošalji email
 */
export async function createAndSendVerificationEmail(
  email: string,
  userName: string,
) {
  try {
    // 1. Generiši token
    const token = crypto.randomBytes(32).toString('hex');
    
    // 2. Heš token za bazu
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // 3. Postavi expiration na 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // 4. Obriši stare token-e za ovaj email
    await prisma.verificationToken.deleteMany({
      where: { email },
    });
    
    // 5. Kreiraj novi token u bazi
    await prisma.verificationToken.create({
      data: {
        email,
        token: hashedToken,
        expires: expiresAt,
      },
    });
    
    log.info('Verification token created', { email });
    
    // 6. Pošalji email sa token-om
    const emailResult = await sendVerificationEmail(email, userName, token);
    
    if (!emailResult.success) {
      throw new Error('Failed to send verification email');
    }
    
    return {
      success: true,
      message: 'Verification email sent',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Failed to create verification token', {
      email,
      error: errorMessage,
    });
    
    throw error;
  }
}

/**
 * Verificiraj token i aktiviraj email
 */
export async function verifyEmailToken(token: string) {
  try {
    // 1. Heš upisani token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // 2. Pronađi token u bazi
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });
    
    // 3. Provjeri da li token postoji
    if (!verificationToken) {
      throw new Error('Invalid token');
    }
    
    // 4. Provjeri da li je istekao
    if (verificationToken.expires < new Date()) {
      // Obriši istekao token
      await prisma.verificationToken.delete({
        where: { token: hashedToken },
      });
      throw new Error('Token has expired');
    }
    
    // 5. Pronađi user sa ovim email-om
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // 6. Update user - označi email kao verificiran
    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });
    
    // 7. Obriši korišćeni token
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    });
    
    log.info('Email verified successfully', { email: verificationToken.email });
    
    return {
      success: true,
      email: verificationToken.email,
      message: 'Email verified successfully',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Email verification failed', { error: errorMessage });
    
    throw error;
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  try {
    // 1. Pronađi user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // 2. Provjeri da li je već verificiran
    if (user.emailVerified) {
      throw new Error('Email already verified');
    }
    
    // 3. Kreiraj i pošalji novi token
    return await createAndSendVerificationEmail(email, user.name || 'User');
  } catch (error) {
    log.error('Failed to resend verification email', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
```

---

## 🔗 KORAK 5: KREIRAJ API ENDPOINT

### 5.1 Kreiraj Verify Email Endpoint

**Fajl:** `app/api/auth/verify-email/route.ts`

```typescript
// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, resendVerificationEmail } from '@/lib/auth/email-verification';
import { log } from '@/lib/logger';

/**
 * GET /api/auth/verify-email?token=xxx
 * Kliknut user na link iz email-a
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Provjeri token
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      log.warn('Verify email called without token');
      return NextResponse.redirect(
        new URL('/api/auth/verify-failed?reason=no_token', request.url)
      );
    }
    
    // 2. Verificiraj token
    const result = await verifyEmailToken(token);
    
    // 3. Preusmeravaj na success stranicu
    return NextResponse.redirect(
      new URL(
        `/api/auth/verify-success?email=${encodeURIComponent(result.email)}`,
        request.url
      )
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Email verification failed', { error: errorMessage });
    
    // Preusmeravaj na error stranicu
    return NextResponse.redirect(
      new URL(
        `/api/auth/verify-failed?reason=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
  }
}

/**
 * POST /api/auth/verify-email
 * Resend verification email
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Čitaj body
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // 2. Resend email
    const result = await resendVerificationEmail(email);
    
    // 3. Vrati success
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Resend verification email failed', { error: errorMessage });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
```

---

## ✅ KORAK 6: TESTIRAJ

### 6.1 Local Testing sa Ethereal Email

```bash
# 1. Kreiraj test account na https://ethereal.email
# Otvori stranicu i kreiraj testni account

# 2. Skopbiraj kredencijale u .env.local

# 3. Start aplikaciju:
npm run dev

# 4. Idi na registration:
# http://localhost:3000/auth/registracija

# 5. Registriraj se sa test email-om

# 6. Provjeri Email Preview URL
# (Ethereal ti pokazuje web preview svakog email-a)
```

### 6.2 Manual Testing Checklist

```
☐ Registracija se uspješno izvršava
☐ Email se šalje nakon registracije
☐ Email sadrži ispravan link
☐ Klikovanje na link verificira email
☐ User se može login-ati nakon verifikacije
☐ Resend email funkcionira
☐ Token ističe nakon 24h
☐ Old token-i se brišu
☐ Error messages su child-friendly
```

---

## 📊 KORAK 7: DOKUMENTACIJA

### 7.1 Update README

Dodaj u `README.md` sekciju:

```markdown
## Email Verification

Korisnici moraju verificirati email prije login-a.

### Kako Radi:
1. User se registrira
2. Dobija email sa verification link-om
3. Kliknut link verificira email (valid 24h)
4. Može se login-ati

### Resend Email:
```bash
# POST /api/auth/verify-email
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Environment:
```bash
EMAIL_FROM=noreply@osnovci.app
# Za development:
EMAIL_TEST_USER=test@ethereal.email
EMAIL_TEST_PASS=password
# Za production:
SENDGRID_API_KEY=SG.xxxxx
```
```

---

## 🎉 GOTOVO!

Čestitam! Email Verification je kompletna!

**Sledeće:**
1. Testiraj kompletan proces
2. Commit izmjene sa `git commit -m "feat: add email verification"`
3. Javi mi kada je gotovo
4. Onda krećemo sa **Two-Factor Authentication** 🔐

---

Trebam li pojašnjenja za bilo koji korak? 💬

