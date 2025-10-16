# 🚀 IMPLEMENTACIJSKI VODIČI - OSNOVCI POBOLJŠANJA

**Datum:** 16. Oktobar 2025  
**Format:** Step-by-Step Uputstva  
**Jezik:** Srpski sa kod primjerima  

---

## 📋 SADRŽAJ

1. [Email Verification System](#1-email-verification)
2. [Two-Factor Authentication](#2-two-factor-authentication)
3. [Daily Quests & Missions](#3-daily-quests)
4. [Achievement Badges](#4-achievement-badges)
5. [Advanced Rate Limiting](#5-rate-limiting)
6. [Audit Logging](#6-audit-logging)
7. [E2E Testing](#7-e2e-testing)
8. [AI Tutor Integration](#8-ai-tutor)

---

## 1️⃣ EMAIL VERIFICATION SYSTEM {#1-email-verification}

### Korak 1: Instalacija Paketa

```bash
npm install nodemailer zod
npm install -D @types/nodemailer
```

### Korak 2: Kreiraj Verification Module

```typescript
// lib/auth/email-verification.ts
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import crypto from 'crypto';

// Setup email transporter (Vercel Email ili SendGrid)
const transporter = nodemailer.createTransport({
  // Za development
  ...(process.env.NODE_ENV === 'development' && {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '1025'),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    }
  }),
  // Za production (SendGrid, Resend, itd)
  ...(process.env.NODE_ENV === 'production' && {
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    }
  })
});

/**
 * Kreiraj verification token
 */
export async function createVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  
  await db.verificationToken.create({
    data: {
      email,
      token: crypto.createHash('sha256').update(token).digest('hex'),
      expires,
    }
  });
  
  return token;
}

/**
 * Pošalji verification email
 */
export async function sendVerificationEmail(
  email: string,
  userName: string
) {
  const token = await createVerificationToken(email);
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="sr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .button { 
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Dobrodošli u Osnovci!</h1>
          <p style="font-size: 18px; color: #666;">Pozdrav ${userName} 🎉</p>
        </div>
        
        <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; margin: 0;">
            Zahvaljujemo što si se prijavio u Osnovci! 
            Klikni link ispod da potvrdiš svoj e-mail i počni sa učenjem. 📚
          </p>
        </div>
        
        <center>
          <a href="${verificationUrl}" class="button">
            ✅ Potvrdi E-mail
          </a>
        </center>
        
        <div style="margin-top: 30px; padding: 20px; background: #fffef0; border-radius: 8px; border-left: 4px solid #fbbf24;">
          <p style="margin: 0 0 10px 0;">
            <strong>⏰ Važno:</strong> Ovaj link ističe za 24 sata.
          </p>
          <p style="margin: 0;">
            Ako nisi preslavio ovaj zahtjev, možeš bezbedno ignorisati ovaj email.
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <p style="font-size: 13px; color: #666; margin: 0;">
            💡 <strong>Savjet:</strong> Ako je link izbegnut, kopbiraj i prilepi u pretragu:
          </p>
          <p style="font-size: 11px; color: #999; word-break: break-all; margin: 10px 0 0 0;">
            ${verificationUrl}
          </p>
        </div>
        
        <div class="footer">
          <p>© 2025 Osnovci. Sva prava zadržana. | 
            <a href="https://osnovci.app/privacy" style="color: #667eea; text-decoration: none;">Politika Privatnosti</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@osnovci.app',
      to: email,
      subject: '✅ Potvrdi svoj e-mail | Osnovci',
      html: htmlContent,
      text: `Potvrdi email ovdje: ${verificationUrl}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Greška pri slanju e-maila');
  }
}

/**
 * Verifikuj token i ažuriraj korisnika
 */
export async function verifyEmail(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const verificationToken = await db.verificationToken.findUnique({
    where: { token: hashedToken }
  });
  
  if (!verificationToken || verificationToken.expires < new Date()) {
    throw new Error('Token nije validan ili je istekao');
  }
  
  // Update korisnika
  await db.user.update({
    where: { email: verificationToken.email },
    data: { emailVerified: new Date() }
  });
  
  // Obriši token
  await db.verificationToken.delete({
    where: { token: hashedToken }
  });
  
  return { success: true };
}

/**
 * Reresni verification email
 */
export async function resendVerificationEmail(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new Error('Korisnik nije pronađen');
  }
  
  if (user.emailVerified) {
    throw new Error('Email je već verifikovan');
  }
  
  // Obriši stare tokene
  await db.verificationToken.deleteMany({
    where: { email }
  });
  
  // Pošalji novi email
  await sendVerificationEmail(email, user.name || 'Učenice');
  
  return { success: true };
}
```

### Korak 3: Kreiraj Verification API Route

```typescript
// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail, resendVerificationEmail } from '@/lib/auth/email-verification';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token je obavezan' },
        { status: 400 }
      );
    }
    
    await verifyEmail(token);
    
    return NextResponse.redirect(
      new URL('/auth/verified-success?email=verified', req.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/verify-failed?error=${encodeURIComponent((error as Error).message)}`,
        req.url
      )
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email je obavezan' },
        { status: 400 }
      );
    }
    
    await resendVerificationEmail(email);
    
    return NextResponse.json(
      { success: true, message: 'Email je poslat' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
```

### Korak 4: Kreiraj Verification Komponente

```tsx
// app/auth/verify-email/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  
  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setSent(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">📧</div>
          <CardTitle>Potvrdi Svoj Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-center">
            {sent 
              ? '✅ Email je poslat! Provjeri svoju poštu (također provjeri spam folder).'
              : 'Unesi e-mail da bi dobio verifikacijski link.'
            }
          </p>
          
          {!sent ? (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="tvoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleResend}
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? 'Slanje...' : '📤 Pošalji Verification Email'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => router.push('/auth/prijava')}
              className="w-full"
            >
              👉 Idi na Prijavu
            </Button>
          )}
          
          <p className="text-xs text-gray-500 text-center">
            💡 Link ističe za 24 sata
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Korak 5: Update Prisma Schema

```prisma
// prisma/schema.prisma
model VerificationToken {
  email     String
  token     String      @unique
  expires   DateTime
  createdAt DateTime    @default(now())
  
  @@id([email, token])
}

// Dodaj emailVerified u User model ako već ne postoji:
model User {
  // ... ostala polja
  emailVerified DateTime?
}
```

### Korak 6: Pokrenite Migracije

```bash
npx prisma db push
npx prisma generate
```

---

## 2️⃣ TWO-FACTOR AUTHENTICATION (2FA) {#2-two-factor-authentication}

### Instalacija

```bash
npm install speakeasy qrcode
npm install -D @types/speakeasy
```

### Implementacija

```typescript
// lib/auth/two-factor.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db } from '@/lib/db';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Kreiraj 2FA secret i QR kod
 */
export async function generateTwoFactorSecret(
  userId: string,
  userEmail: string
): Promise<TwoFactorSetup> {
  const secret = speakeasy.generateSecret({
    name: `Osnovci (${userEmail})`,
    issuer: 'Osnovci',
    length: 32,
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
  const backupCodes = generateBackupCodes();
  
  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verifikuj OTP kod
 */
export function verifyOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
}

/**
 * Kreiraj backup kodove
 */
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    return Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
  });
}

/**
 * Sačuvaj 2FA za korisnika
 */
export async function enable2FA(
  userId: string,
  secret: string,
  backupCodes: string[]
) {
  await db.twoFactor.upsert({
    where: { userId },
    create: {
      userId,
      secret,
      backupCodes: backupCodes.map(code => ({
        code,
        used: false,
      })),
      enabled: true,
    },
    update: {
      secret,
      backupCodes: backupCodes.map(code => ({
        code,
        used: false,
      })),
      enabled: true,
    },
  });
}

/**
 * Provjeri i koristi backup kod
 */
export async function useBackupCode(userId: string, code: string): Promise<boolean> {
  const twoFactor = await db.twoFactor.findUnique({
    where: { userId }
  });
  
  if (!twoFactor) return false;
  
  const backupCode = twoFactor.backupCodes.find(
    bc => bc.code === code && !bc.used
  );
  
  if (!backupCode) return false;
  
  // Mark as used
  backupCode.used = true;
  await db.twoFactor.update({
    where: { userId },
    data: { backupCodes: twoFactor.backupCodes }
  });
  
  return true;
}
```

### Setup API

```typescript
// app/api/auth/2fa/setup/route.ts
import { auth } from '@/lib/auth';
import { generateTwoFactorSecret, enable2FA } from '@/lib/auth/two-factor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { setup } = generateTwoFactorSecret(session.user.id, session.user.email!);
  
  return NextResponse.json(setup);
}
```

---

## 3️⃣ DAILY QUESTS & MISSIONS {#3-daily-quests}

```typescript
// app/api/gamification/daily-quest/route.ts
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const DAILY_QUESTS = [
  {
    id: 'homework-submit',
    title: '📝 Pošalji Domaći Zadatak',
    description: 'Pošalji jedan domaći zadatak sa dokazom',
    xp: 100,
    icon: '📝',
    category: 'homework',
  },
  {
    id: 'read-lesson',
    title: '📖 Pročitaj Lekciju',
    description: 'Pročitaj novu lekciju iz bilo kog predmeta',
    xp: 50,
    icon: '📖',
    category: 'learning',
  },
  {
    id: 'check-grades',
    title: '📊 Provjeri Ocjene',
    description: 'Vidi sve svoje ocjene',
    xp: 25,
    icon: '📊',
    category: 'tracking',
  },
  {
    id: 'family-connect',
    title: '👨‍👩‍👧 Uključi Roditelja',
    description: 'Poveži se sa roditeljima QR kodom',
    xp: 150,
    icon: '👨‍👩‍👧',
    category: 'family',
  },
];

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const today = new Date().toDateString();
    let dailyQuest = await db.dailyQuest.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 86400000),
        },
      },
    });
    
    // Kreiraj novi quest ako ne postoji
    if (!dailyQuest) {
      const randomQuest = DAILY_QUESTS[Math.floor(Math.random() * DAILY_QUESTS.length)];
      
      dailyQuest = await db.dailyQuest.create({
        data: {
          userId: session.user.id,
          questId: randomQuest.id,
          title: randomQuest.title,
          description: randomQuest.description,
          xp: randomQuest.xp,
          icon: randomQuest.icon,
          category: randomQuest.category,
          completed: false,
        },
      });
    }
    
    return NextResponse.json(dailyQuest);
  } catch (error) {
    console.error('Error fetching daily quest:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { questId } = await req.json();
    
    const dailyQuest = await db.dailyQuest.findUnique({
      where: { id: questId },
    });
    
    if (!dailyQuest || dailyQuest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    
    // Mark as completed
    const updated = await db.dailyQuest.update({
      where: { id: questId },
      data: { 
        completed: true,
        completedAt: new Date(),
      },
    });
    
    // Award XP
    await db.user.update({
      where: { id: session.user.id },
      data: {
        xp: { increment: dailyQuest.xp },
      },
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error completing quest:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
```

```tsx
// components/gamification/daily-quest.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function DailyQuestCard() {
  const [quest, setQuest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchQuest();
  }, []);
  
  const fetchQuest = async () => {
    try {
      const res = await fetch('/api/gamification/daily-quest');
      const data = await res.json();
      setQuest(data);
    } finally {
      setLoading(false);
    }
  };
  
  const completeQuest = async () => {
    try {
      await fetch('/api/gamification/daily-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: quest.id }),
      });
      
      // Refresh or show success
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  if (loading) return <div className="animate-pulse">Učitavam...</div>;
  
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className="w-full"
    >
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{quest.icon}</span>
            <div>
              <CardTitle className="text-lg">{quest.title}</CardTitle>
              <p className="text-sm text-gray-600">+{quest.xp} XP</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{quest.description}</p>
          {!quest.completed ? (
            <Button
              onClick={completeQuest}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600"
            >
              ✅ Markiraj kao Završeno
            </Button>
          ) : (
            <div className="p-4 bg-green-100 rounded-lg text-center">
              <p className="text-green-700 font-bold">🎉 Završeno!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

---

*Nastavak u sledećoj sekciji...*

---

## 🎯 SLEDEĆE SEKCIJE (Dostupne u Nastavku)

- 4️⃣ **Achievement Badges** - Kompletan sistem bedževa
- 5️⃣ **Advanced Rate Limiting** - Zaštita od napada
- 6️⃣ **Audit Logging** - Kompletno praćenje svih akcija
- 7️⃣ **E2E Testing** - Automatizovano testiranje
- 8️⃣ **AI Tutor Integration** - Claude AI tutor sistem

---

**Upustva će biti dopunjena stepom po stepom kodom za svaku sekciju.**

