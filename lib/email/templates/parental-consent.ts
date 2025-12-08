/**
 * Parental Consent Email Template
 */
import { createBaseTemplate, type EmailTemplate } from "./base";

export function createParentalConsentTemplate(
  verificationCode: string,
  studentName: string,
): EmailTemplate {
  const content = `
    <p>Poštovani/a roditelju/staratelju,</p>
    <p><strong>${escapeHtml(studentName)}</strong> želi da se registruje na Osnovci aplikaciji.</p>
    
    <div class="warning-box">
      <strong>⚠️ Važno:</strong> Molimo vas potvrdite da ste odobrili korišćenje aplikacije od strane vašeg deteta.
    </div>
    
    <div class="info-box">
      <p style="margin: 0 0 10px 0;"><strong>Vaš verifikacioni kod je:</strong></p>
      <div style="text-align: center; font-size: 32px; font-weight: 700; color: #667eea; letter-spacing: 4px; padding: 15px 0;">
        ${escapeHtml(verificationCode)}
      </div>
    </div>
    
    <p>Unesite ovaj kod u aplikaciji da potvrdite svoju dozvolu.</p>
    
    <div class="warning-box">
      <strong>⚠️ Važno:</strong> Ovaj kod važi 7 dana.
    </div>
    
    <p>S poštovanjem,<br><strong>Tim Osnovci</strong></p>
  `;

  const html = createBaseTemplate(content, "🔐 Zahtev za roditeljsku dozvolu");

  const text = `
Zahtev za roditeljsku dozvolu

Poštovani/a roditelju/staratelju,

${studentName} želi da se registruje na Osnovci aplikaciji.

⚠️ VAŽNO: Molimo vas potvrdite da ste odobrili korišćenje aplikacije od strane vašeg deteta.

Vaš verifikacioni kod je: ${verificationCode}

Unesite ovaj kod u aplikaciji da potvrdite svoju dozvolu.

⚠️ VAŽNO: Ovaj kod važi 7 dana.

S poštovanjem,
Tim Osnovci

Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: "🔐 Zahtev za roditeljsku dozvolu - Osnovci",
    html,
    text,
  };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}
