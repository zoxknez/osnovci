// lib/email/service.ts
/**
 * Email Service - Slanje Email-a
 * Koristi Nodemailer za slanje verifikacijskih, welcome, i drugih email-a
 */

import nodemailer from 'nodemailer';
import { log } from '@/lib/logger';

// Tip za email rezultat
interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Inicijalizuj email transporter
 * Koristi različite provider-e ovisno od okruženja
 */
function createTransporter() {
  // Za development - koristi Ethereal test account
  if (process.env.NODE_ENV === 'development' || !process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_TEST_USER,
        pass: process.env.EMAIL_TEST_PASS,
      },
    });
  }

  // Za production - koristi SendGrid
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
    const transporter = createTransporter();

    // Kreiraj verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // HTML template
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
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Potvrdi Svoj Email ✉️</h1>
    </div>
    
    <div class="content">
      <p>Zdravo <strong>${userName}</strong>! 👋</p>
      <p>Hvala što si se prijavio/la u <strong>Osnovci</strong>! 🎓</p>
      
      <p>Trebam da potvrdiš svoj email adresu. Klikni na dugme ispod da završiš registraciju.</p>
      
      <p style="font-size: 14px; color: #666;">
        <strong>Važno:</strong> Ovaj link je validan samo <strong>24 sata</strong>.
      </p>
      
      <center>
        <a href="${verificationUrl}" class="button">✓ Potvrdi Moj Email</a>
      </center>
      
      <div class="code-block">
        <strong>Ili kopbiraj link:</strong><br><br>
        ${verificationUrl}
      </div>
      
      <p style="font-size: 14px; color: #999;">
        Ako nisi kreirao/la ovaj nalog, slobodno ignoriši ovaj email.
      </p>
    </div>
    
    <div class="footer">
      <p>
        <strong>Osnovci</strong> - Aplikacija za Učenike i Roditelje<br>
        © 2025 Sva Prava Zadržana
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text verzija
    const textContent = `
POTVRDI SVOJ EMAIL
=====================

Zdravo ${userName}!

Hvala što si se prijavio/la u Osnovci!

Trebam da potvrdiš svoj email adresu. Klikni na link ispod:

${verificationUrl}

Ili kopbiraj i zalijepi URL iznad u pretraživač.

VAŽNO: Ovaj link je validan samo 24 sata.

Ako nisi kreirao/la ovaj nalog, slobodno ignoriši ovaj email.

=====================
Osnovci - Aplikacija za Učenike i Roditelje
© 2025 Sva Prava Zadržana
    `;

    // Pošalji email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@osnovci.app',
      to: toEmail,
      subject: '✅ Potvrdi svoj email | Osnovci',
      text: textContent,
      html: htmlContent,
    });

    // Za Ethereal - dobij preview URL
    let previewUrl: string | undefined;
    if (process.env.NODE_ENV === 'development') {
      const url = nodemailer.getTestMessageUrl(info);
      previewUrl = url || undefined;
    }

    log.info('Verification email sent', {
      to: toEmail,
      messageId: info.messageId,
      previewUrl,
    });

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
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
      <h1>🎉 Dobrodošao/la u Osnovci!</h1>
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
