/**
 * Welcome Email Template
 */
import { createBaseTemplate, type EmailTemplate } from './base';

export function createWelcomeEmailTemplate(userName: string): EmailTemplate {
  const content = `
    <p>Zdravo <strong>${escapeHtml(userName)}</strong>! 🎉</p>
    <p>Tvoj email je potvrđen! Sada možeš u potpunosti koristiti Osnovci aplikaciju.</p>
    <p>Možeš početi sa:</p>
    <ul>
      <li>📚 Dodavanjem domaćih zadataka</li>
      <li>📅 Podešavanjem rasporeda časova</li>
      <li>📊 Praćenjem ocena i napretka</li>
      <li>🎮 Zarađivanjem XP poena i otključavanjem bedževa</li>
    </ul>
    <p>Sretno sa učenjem! 🚀</p>
  `;

  const html = createBaseTemplate(content, '🎉 Dobrodošao/la u Osnovci!');
  
  const text = `
Dobrodošao/la u Osnovci!

Zdravo ${userName}!

Tvoj email je potvrđen! Sada možeš u potpunosti koristiti Osnovci aplikaciju.

Možeš početi sa:
- Dodavanjem domaćih zadataka
- Podešavanjem rasporeda časova
- Praćenjem ocena i napretka
- Zarađivanjem XP poena i otključavanjem bedževa

Sretno sa učenjem!

Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: '🎉 Dobrodošao/la u Osnovci!',
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

