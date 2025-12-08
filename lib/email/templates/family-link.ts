/**
 * Family Link Invitation Email Template
 */
import { createBaseTemplate, type EmailTemplate } from "./base";

export function createFamilyLinkTemplate(
  linkCode: string,
  studentName: string,
): EmailTemplate {
  const content = `
    <p>Poštovani/a,</p>
    <p><strong>${escapeHtml(studentName)}</strong> vas poziva da se povežete sa njihovim nalogom na Osnovci aplikaciji.</p>
    
    <div class="info-box">
      <p style="margin: 0 0 10px 0;"><strong>Vaš kod za povezivanje je:</strong></p>
      <div style="text-align: center; font-size: 32px; font-weight: 700; color: #667eea; letter-spacing: 4px; padding: 15px 0;">
        ${escapeHtml(linkCode)}
      </div>
    </div>
    
    <p>Unesite ovaj kod u aplikaciji da završite povezivanje.</p>
    
    <div class="warning-box">
      <strong>⚠️ Važno:</strong> Ovaj kod važi 7 dana.
    </div>
    
    <p>S poštovanjem,<br><strong>Tim Osnovci</strong></p>
  `;

  const html = createBaseTemplate(content, "📧 Poziv za povezivanje");

  const text = `
Poziv za povezivanje

Poštovani/a,

${studentName} vas poziva da se povežete sa njihovim nalogom na Osnovci aplikaciji.

Vaš kod za povezivanje je: ${linkCode}

Unesite ovaj kod u aplikaciji da završite povezivanje.

⚠️ VAŽNO: Ovaj kod važi 7 dana.

S poštovanjem,
Tim Osnovci

Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: "📧 Poziv za povezivanje sa Osnovci",
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
