/**
 * Verification Email Template
 */
import {
  createBaseTemplate,
  type EmailTemplate,
} from "./base";

export function createVerificationEmailTemplate(
  userName: string,
  verificationUrl: string,
): EmailTemplate {
  const content = `
    <p>Zdravo <strong>${escapeHtml(userName)}</strong>! 👋</p>
    <p>Hvala što si se prijavio/la u <strong>Osnovci</strong>! 🎓</p>
    
    <p>Trebam da potvrdiš svoj email adresu. Klikni na dugme ispod da završiš registraciju.</p>
    
    <div class="warning-box">
      <strong>⚠️ Važno:</strong> Ovaj link je validan samo <strong>24 sata</strong>.
    </div>
    
    <div style="text-align: center;">
      <a href="${escapeHtml(verificationUrl)}" class="email-button">✓ Potvrdi Moj Email</a>
    </div>
    
    <div class="code-block">
      <strong>Ili kopiraj link:</strong><br><br>
      ${escapeHtml(verificationUrl)}
    </div>
    
    <p style="font-size: 14px; color: #999999;">
      Ako nisi kreirao/la ovaj nalog, slobodno ignoriši ovaj email.
    </p>
  `;

  const html = createBaseTemplate(content, "📧 Potvrdi Svoj Email ✉️");

  const text = `
POTVRDI SVOJ EMAIL
=====================

Zdravo ${userName}!

Hvala što si se prijavio/la u Osnovci!

Trebam da potvrdiš svoj email adresu. Klikni na link ispod:

${verificationUrl}

Ili kopiraj i zalepi URL iznad u pretraživač.

VAŽNO: Ovaj link je validan samo 24 sata.

Ako nisi kreirao/la ovaj nalog, slobodno ignoriši ovaj email.

=====================
Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: "✅ Potvrdi svoj email | Osnovci",
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
