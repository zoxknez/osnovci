/**
 * Password Reset Email Template
 * Template za email sa linkom za resetovanje lozinke
 */
import { createBaseTemplate, type EmailTemplate, escapeHtml } from "./base";

export function createPasswordResetEmailTemplate(
  userName: string,
  resetUrl: string,
): EmailTemplate {
  const content = `
    <p>Zdravo <strong>${escapeHtml(userName)}</strong>! 👋</p>
    <p>Primili smo zahtev za resetovanje lozinke za tvoj nalog na <strong>Osnovci</strong>.</p>
    
    <p>Ako si zatražio/la resetovanje lozinke, klikni na dugme ispod:</p>
    
    <div class="warning-box">
      <strong>⚠️ Važno:</strong> Ovaj link je validan samo <strong>1 sat</strong>.
    </div>
    
    <div style="text-align: center;">
      <a href="${escapeHtml(resetUrl)}" class="email-button">🔐 Resetuj Lozinku</a>
    </div>
    
    <div class="code-block">
      <strong>Ili kopiraj link:</strong><br><br>
      ${escapeHtml(resetUrl)}
    </div>
    
    <div class="info-box">
      <strong>🛡️ Bezbednost:</strong> Ako nisi zatražio/la resetovanje lozinke, 
      ignoriši ovaj email. Tvoj nalog je siguran i lozinka neće biti promenjena.
    </div>
    
    <p style="font-size: 14px; color: #999999;">
      Ako imaš bilo kakvih pitanja, kontaktiraj našu podršku.
    </p>
  `;

  const html = createBaseTemplate(content, "🔐 Resetovanje Lozinke");

  const text = `
RESETOVANJE LOZINKE
=====================

Zdravo ${userName}!

Primili smo zahtev za resetovanje lozinke za tvoj nalog na Osnovci.

Ako si zatražio/la resetovanje lozinke, klikni na link ispod:

${resetUrl}

VAŽNO: Ovaj link je validan samo 1 sat.

BEZBEDNOST: Ako nisi zatražio/la resetovanje lozinke, 
ignoriši ovaj email. Tvoj nalog je siguran i lozinka neće biti promenjena.

=====================
Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: "🔐 Resetuj svoju lozinku | Osnovci",
    html,
    text,
  };
}
