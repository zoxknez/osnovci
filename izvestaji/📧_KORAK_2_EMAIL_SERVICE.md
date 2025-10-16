# 📧 KORAK 2: EMAIL SERVICE - DETALJNI VODIČE

**Status:** 🔄 SPREMAN ZA POKRETANJE  
**Vrijeme Procjene:** 30-40 minuta  
**Kompleksnost:** Srednja  

---

## 🎯 ŠTA TREBAMO POSTIĆI

```
CILJ: Kreiraj Email Service koji može slati Verification Email-e

FAZE:
1. Instalacija Nodemailer paketa
2. Kreiraj Email Service (lib/email/service.ts)
3. Testiraj sa Ethereal Email (test provider)
4. Kreiraj Verification Logic (lib/auth/email-verification.ts)
5. Testiraj Token Generisanje
```

---

## 📝 KORAK 2A: INSTALACIJA PAKETA

### Šta Trebam Instalirati:

```bash
# Nodemailer - za slanje email-a
npm install nodemailer

# TypeScript tipovi za Nodemailer
npm install -D @types/nodemailer

# Kriptografija - za token heširanje (već instaliran, ali provjerimo)
npm list crypto

# Datum/vrijeme - za token expiration (već instaliran)
npm list date-fns
```

### Komande za Pokretanje:

```bash
cd d:\ProjektiApp\osnovci

# Instalacija
npm install nodemailer
npm install -D @types/nodemailer

# Provjera
npm list nodemailer
npm list @types/nodemailer
```

**Očekivani Output:**
```
nodemailer@6.9.x
@types/nodemailer@6.4.x
```

---

## 📧 KORAK 2B: KREIRAJ EMAIL SERVICE

### Lokacija:
```
d:\ProjektiApp\osnovci\lib\email\service.ts
```

### Fajl - Kompletan Kod:

**Kreiraj novi fajl:** `lib/email/service.ts`

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
  // Za development - koristi Ethereal test account
  if (process.env.NODE_ENV === 'development' || !process.env.SENDGRID_API_KEY) {
    // Ethereal je besplatan test email servis
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // ne koristi TLS
      auth: {
        user: process.env.EMAIL_TEST_USER || 'test@ethereal.email',
        pass: process.env.EMAIL_TEST_PASS || 'test_password',
      },
    });
  }

  // Za production - koristi SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey', // SendGrid koristi "apikey" kao username
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Fallback
  throw new Error('Email service nije konfigurisan - trebam SENDGRID_API_KEY ili dev email');
}

/**
 * Pošalji verification email
 * @param toEmail - Gdje slati email
 * @param userName - Ime korisnika za personalizaciju
 * @param token - Verification token (ne heširani)
 */
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  token: string,
): Promise<EmailResult> {
  try {
    const transporter = createTransporter();

    // Kreiraj verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // HTML template - child-friendly!
    const htmlContent = `
<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }
    .header h1 {
      color: #667eea;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px 0;
      color: #333;
      line-height: 1.6;
    }
    .greeting {
      font-size: 16px;
      color: #333;
      margin-bottom: 15px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: scale(1.05);
    }
    .code-block {
      background-color: #f0f7ff;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #667eea;
      margin: 15px 0;
      word-break: break-all;
      font-size: 12px;
      color: #333;
      font-family: monospace;
    }
    .warning {
      background-color: #fff3cd;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
      margin: 15px 0;
      font-size: 14px;
      color: #856404;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
    .emoji {
      font-size: 20px;
      margin: 0 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><span class="emoji">📧</span>Potvrdi Svoj Email<span class="emoji">✉️</span></h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        <p>Zdravo <strong>${userName}</strong>! <span class="emoji">👋</span></p>
        <p>Hvala što si se prijavio/la u <strong>Osnovci</strong>! <span class="emoji">🎓</span></p>
      </div>
      
      <p>Trebam da potvrdiš svoj email adresu. Klikni na dugme ispod da završiš registraciju.</p>
      
      <p style="font-size: 14px; color: #666;">
        <strong>Važno:</strong> Ovaj link je validan samo <strong>24 sata</strong>. Ako ga ne koristiš, trebaj da zatraži novi.
      </p>
      
      <center>
        <a href="${verificationUrl}" class="button">✓ Potvrdi Moj Email</a>
      </center>
      
      <div class="code-block">
        <strong>Ili kopbiraj link u pretraživač:</strong><br><br>
        ${verificationUrl}
      </div>
      
      <div class="warning">
        <strong>⚠️ VAŽNO:</strong> Ako nisi kreirao/la ovaj nalog, slobodno ignoriši ovaj email. Ako sumnjam da je neko krivo upotrijebi tvoj email, kontaktiraj nas odmah!
      </div>
      
      <p style="font-size: 14px; color: #999;">
        Trebaj dodatne informacije? Odgovori na ovaj email ili posjeti našu support stranicu.
      </p>
    </div>
    
    <div class="footer">
      <p>
        <strong>Osnovci</strong> - Aplikacija za Učenike i Roditelje<br>
        © 2025 Sva Prava Zadržana<br>
        <a href="https://osnovci.app/privacy" style="color: #667eea; text-decoration: none;">Politika Privatnosti</a> | 
        <a href="https://osnovci.app/terms" style="color: #667eea; text-decoration: none;">Uslovi Korištenja</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text verzija (za email klijente koji ne podržavaju HTML)
    const textContent = `
POTVRDI SVOJ EMAIL
=====================

Zdravo ${userName}!

Hvala što si se prijavio/la u Osnovci!

Trebam da potvrdiš svoj email adresu. Klikni na link ispod da završiš registraciju.

VAŽNO: Ovaj link je validan samo 24 sata. Ako ga ne koristiš, trebaj zatraži novi.

Link:
${verificationUrl}

Ili kopbiraj i zalijepi URL iznad u pretraživač.

VAŽNO: Ako nisi kreirao/la ovaj nalog, slobodno ignoriši ovaj email.

=====================
Osnovci - Aplikacija za Učenike i Roditelje
© 2025 Sva Prava Zadržana

Trebaj dodatne informacije? Odgovori na ovaj email ili posjeti našu support stranicu.
    `;

    // Pošalji email
    const info = await transporter.sendMail({
      from: `"Osnovci" <${process.env.EMAIL_FROM || 'noreply@osnovci.app'}>`,
      to: toEmail,
      subject: '✅ Potvrdi svoj email | Osnovci',
      text: textContent,
      html: htmlContent,
      // Za Ethereal - otvori preview u browseru
      ...(process.env.NODE_ENV === 'development' && {
        preview: true,
      }),
    });

    // Loguj uspjeh
    log.info('Email verification sent successfully', {
      to: toEmail,
      messageId: info.messageId,
      previewUrl: info.response?.includes('Queued') 
        ? nodemailer.getTestMessageUrl(info)
        : undefined,
    });

    return {
      success: true,
      messageId: info.messageId,
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
 * Pošalji welcome email nakon verifikacije
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string,
): Promise<EmailResult> {
  try {
    const transporter = createTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 12px; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #667eea; }
    h1 { color: #667eea; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Dobrodošao u Osnovci!</h1>
    </div>
    <p>Zdravo ${userName}!</p>
    <p>Tvoj email je potvrđen! Sada možeš u potpunosti koristiti Osnovci aplikaciju.</p>
    <p>Sretno! 🚀</p>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@osnovci.app',
      to: toEmail,
      subject: '🎉 Dobrodošao/la u Osnovci!',
      html: htmlContent,
    });

    log.info('Welcome email sent', { to: toEmail });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Failed to send welcome email', { 
      to: toEmail, 
      error: errorMessage 
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Pošalji password reset email
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  resetToken: string,
): Promise<EmailResult> {
  try {
    const transporter = createTransporter();

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/api/auth/reset-password?token=${resetToken}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <div style="max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 12px;">
    <h1 style="color: #667eea;">🔐 Resetuj Lozinku</h1>
    <p>Zdravo ${userName}!</p>
    <p>Zahtijevao/la si resetovanje lozinke. Klikni na link ispod:</p>
    <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Resetuj Lozinku
    </a>
    <p style="color: #999;">Link je validan 1 sat.</p>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@osnovci.app',
      to: toEmail,
      subject: '🔐 Resetuj Lozinku | Osnovci',
      html: htmlContent,
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

---

## 🔐 KORAK 2C: KREIRAJ VERIFICATION LOGIC

### Lokacija:
```
d:\ProjektiApp\osnovci\lib\auth\email-verification.ts
```

### Fajl - Kompletan Kod:

**Kreiraj novi fajl:** `lib/auth/email-verification.ts`

```typescript
// lib/auth/email-verification.ts
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { sendVerificationEmail } from '@/lib/email/service';
import { log } from '@/lib/logger';

/**
 * Kreiraj verification token i pošalji email
 * 
 * @param email - Email adresa korisnika
 * @param userName - Ime korisnika za email
 */
export async function createAndSendVerificationEmail(
  email: string,
  userName: string,
) {
  try {
    // 1. Generiši random token (32 bajta = 64 karaktera hex)
    const token = crypto.randomBytes(32).toString('hex');
    
    // 2. Heš token za bazu (ne čuvamo plain token u bazi)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // 3. Postavi expiration na 24 sata
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    log.info('Creating verification token', {
      email,
      expiresAt: expiresAt.toISOString(),
    });
    
    // 4. Obriši stare token-e za ovaj email (ako postoje)
    await prisma.verificationToken.deleteMany({
      where: { email },
    });
    
    log.debug('Old tokens deleted', { email });
    
    // 5. Kreiraj novi token u bazi
    await prisma.verificationToken.create({
      data: {
        email,
        token: hashedToken,
        expires: expiresAt,
      },
    });
    
    log.debug('Verification token created in database', { email });
    
    // 6. Pošalji email sa PLAIN token-om (ne heširani!)
    // User će kliknut na link sa plain token-om
    const emailResult = await sendVerificationEmail(email, userName, token);
    
    if (!emailResult.success) {
      log.error('Failed to send verification email', {
        email,
        error: emailResult.error,
      });
      throw new Error(emailResult.error || 'Failed to send email');
    }
    
    log.info('Verification email sent successfully', {
      email,
      messageId: emailResult.messageId,
    });
    
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
 * 
 * @param token - Plain token iz email link-a
 */
export async function verifyEmailToken(token: string) {
  try {
    // 1. Heš upisani token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    log.debug('Verifying token', { 
      tokenLength: token.length,
      hashedTokenLength: hashedToken.length,
    });
    
    // 2. Pronađi token u bazi
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });
    
    if (!verificationToken) {
      log.warn('Token not found in database', { token: hashedToken.substring(0, 10) + '...' });
      throw new Error('Invalid verification token');
    }
    
    log.debug('Token found', { email: verificationToken.email });
    
    // 3. Provjeri da li je istekao
    if (verificationToken.expires < new Date()) {
      log.warn('Token expired', {
        email: verificationToken.email,
        expired: verificationToken.expires.toISOString(),
      });
      
      // Obriši istekao token
      await prisma.verificationToken.delete({
        where: { token: hashedToken },
      });
      
      throw new Error('Verification token has expired');
    }
    
    log.debug('Token is valid', { email: verificationToken.email });
    
    // 4. Pronađi user sa ovim email-om
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });
    
    if (!user) {
      log.error('User not found', { email: verificationToken.email });
      throw new Error('User not found');
    }
    
    log.debug('User found', { userId: user.id, email: user.email });
    
    // 5. Update user - označi email kao verificiran
    const updatedUser = await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });
    
    log.info('Email verified successfully', {
      userId: updatedUser.id,
      email: updatedUser.email,
      emailVerifiedAt: updatedUser.emailVerified?.toISOString(),
    });
    
    // 6. Obriši korišćeni token
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    });
    
    log.debug('Token deleted from database', { email: verificationToken.email });
    
    return {
      success: true,
      email: verificationToken.email,
      userId: user.id,
      message: 'Email verified successfully',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Email verification failed', { 
      error: errorMessage,
      token: token.substring(0, 10) + '...',
    });
    
    throw error;
  }
}

/**
 * Resend verification email (ako user nije primio prvi)
 * 
 * @param email - Email adresa korisnika
 */
export async function resendVerificationEmail(email: string) {
  try {
    log.info('Resend verification email requested', { email });
    
    // 1. Pronađi user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      log.warn('User not found for resend', { email });
      throw new Error('User not found');
    }
    
    log.debug('User found', { userId: user.id });
    
    // 2. Provjeri da li je već verificiran
    if (user.emailVerified) {
      log.warn('User trying to resend but email already verified', { 
        userId: user.id,
        email,
      });
      throw new Error('Email already verified');
    }
    
    log.debug('Email not yet verified, resending', { email });
    
    // 3. Kreiraj i pošalji novi token
    return await createAndSendVerificationEmail(email, user.student?.name || user.guardian?.name || 'User');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Failed to resend verification email', {
      email,
      error: errorMessage,
    });
    
    throw error;
  }
}

/**
 * Provjeri je li email verificiran
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    
    return user?.emailVerified !== null && user?.emailVerified !== undefined;
  } catch (error) {
    log.error('Failed to check email verification', { userId });
    return false;
  }
}
```

---

## 🧪 KORAK 2D: TESTIRAJ EMAIL SERVICE

### Prije nego što kreneš:

```bash
cd d:\ProjektiApp\osnovci

# 1. Instalacija paketa
npm install nodemailer
npm install -D @types/nodemailer

# 2. Provjera build-a
npm run build
```

### Manual Test - Ethereal Email:

1. **Kreiraj Ethereal Account:**
   - Idi na https://ethereal.email
   - Klikni "Create Ethereal Account"
   - Skopbiraj kredencijale

2. **Ažuriraj .env.local:**
   ```bash
   EMAIL_TEST_USER=...@ethereal.email
   EMAIL_TEST_PASS=...
   ```

3. **Test script (ili direktno kroz endpoint kasnije)**
   ```bash
   # Testira email slanje
   # (Kreirajmo nakon Korak 2E)
   ```

---

## ✅ CHECKLIST ZA KORAK 2

Kada završiš:

```
☐ npm install nodemailer
☐ npm install -D @types/nodemailer
☐ Kreirao lib/email/service.ts
☐ Kreirao lib/auth/email-verification.ts
☐ npm run build - bez grešaka
☐ .env.local ažuriran sa EMAIL varijablama
☐ Ethereal kredencijale skopbirane
```

---

## 🚀 SLEDEĆE:

**KORAK 3:** API Endpoint `/api/auth/verify-email`

Kreirajmo endpoint koji će:
1. Primiti GET zahtjev sa token-om
2. Verificirati token
3. Preusmeravati na success/error stranicu

