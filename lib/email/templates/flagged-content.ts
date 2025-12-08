/**
 * Flagged Content Notification Email Template
 */
import { createBaseTemplate, type EmailTemplate } from "./base";

export function createFlaggedContentTemplate(
  fileName: string,
  reasons: string[],
  studentName: string,
): EmailTemplate {
  const reasonsList = reasons
    .map((r) => `<li style="margin: 8px 0;">${escapeHtml(r)}</li>`)
    .join("");

  const content = `
    <p>Poštovani/a roditelju/staratelju,</p>
    <p>Vaše dete <strong>${escapeHtml(studentName)}</strong> je pokušalo da upload-uje sliku koja je označena kao potencijalno nesigurna.</p>
    
    <div class="warning-box">
      <strong>⚠️ Fajl:</strong> ${escapeHtml(fileName)}
      <br><br>
      <strong>Razlozi:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${reasonsList}
      </ul>
    </div>
    
    <p>Molimo vas da razmotrite razgovor sa svojim detetom o sigurnosti na internetu.</p>
    
    <div class="info-box">
      <strong>✅ Važno:</strong> Fajl NIJE upload-ovan i nije dostupan ni vašem detetu ni drugim korisnicima.
    </div>
    
    <p>S poštovanjem,<br><strong>Tim Osnovci</strong></p>
  `;

  const html = createBaseTemplate(content, "⚠️ Upozorenje o sadržaju");

  const text = `
Upozorenje o sadržaju

Poštovani/a roditelju/staratelju,

Vaše dete ${studentName} je pokušalo da upload-uje sliku koja je označena kao potencijalno nesigurna.

⚠️ Fajl: ${fileName}

Razlozi:
${reasons.map((r) => `- ${r}`).join("\n")}

Molimo vas da razmotrite razgovor sa svojim detetom o sigurnosti na internetu.

✅ VAŽNO: Fajl NIJE upload-ovan i nije dostupan ni vašem detetu ni drugim korisnicima.

S poštovanjem,
Tim Osnovci

Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: "⚠️ Upozorenje o sadržaju - Osnovci",
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
