/**
 * Activity Notification Email Template
 */
import { createBaseTemplate, type EmailTemplate } from './base';

export function createActivityNotificationTemplate(
  activityType: string,
  description: string,
  studentName: string,
): EmailTemplate {
  const content = `
    <p>Poštovani/a roditelju/staratelju,</p>
    <p>Vaše dete <strong>${escapeHtml(studentName)}</strong> je izvršilo sledeću aktivnost:</p>
    
    <div class="info-box">
      <strong style="color: #17a2b8;">${escapeHtml(activityType)}</strong>
      <p style="margin: 10px 0 0 0;">${escapeHtml(description)}</p>
    </div>
    
    <p>Možete pregledati sve aktivnosti svog deteta u aplikaciji.</p>
    
    <p>S poštovanjem,<br><strong>Tim Osnovci</strong></p>
  `;

  const html = createBaseTemplate(content, '📱 Obaveštenje o aktivnosti');
  
  const text = `
Obaveštenje o aktivnosti

Poštovani/a roditelju/staratelju,

Vaše dete ${studentName} je izvršilo sledeću aktivnost:

${activityType}
${description}

Možete pregledati sve aktivnosti svog deteta u aplikaciji.

S poštovanjem,
Tim Osnovci

Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: `📱 Obaveštenje: ${activityType} - Osnovci`,
    html,
    text,
  };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

