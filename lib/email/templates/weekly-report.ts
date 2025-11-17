/**
 * Weekly Report Email Template
 */
import { createBaseTemplate, escapeHtml, type EmailTemplate } from './base';
import type { WeeklyReportData } from '@/lib/reports/weekly-report-generator';

export function createWeeklyReportTemplate(
  guardianName: string,
  report: WeeklyReportData,
  viewOnlineUrl: string,
): EmailTemplate {
  const completedHomework = report.homework.completed ?? 0;
  const totalHomework = report.homework.total ?? 0;
  const averageGrade = '0.00'; // Will be calculated from grades in future
  const attendanceRate = 95; // Placeholder - attendance tracking not implemented
  const xp = report.gamification.weeklyXP ?? 0;

  const content = `
    <p>Poštovani/a <strong>${escapeHtml(guardianName)}</strong>,</p>
    <p>Evo nedeljnog izveštaja o napretku vašeg deteta:</p>
    
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${completedHomework}/${totalHomework}</div>
        <div class="stat-label">Urađeni domaći</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${averageGrade}</div>
        <div class="stat-label">Prosek ocena</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${attendanceRate}%</div>
        <div class="stat-label">Prisutnost</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${xp}</div>
        <div class="stat-label">XP poeni</div>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(viewOnlineUrl)}" class="email-button">Vidi pun izveštaj</a>
    </div>

    <p>S poštovanjem,<br><strong>Tim Osnovci</strong></p>
  `;

  const html = createBaseTemplate(content, '📊 Nedeljni izveštaj');
  
  const text = `
Nedeljni izveštaj

Poštovani/a ${guardianName},

Evo nedeljnog izveštaja o napretku vašeg deteta:

Urađeni domaći: ${completedHomework}/${totalHomework}
Prosek ocena: ${averageGrade}
Prisutnost: ${attendanceRate}%
XP poeni: ${xp}

Vidi pun izveštaj na: ${viewOnlineUrl}

S poštovanjem,
Tim Osnovci

Osnovci - Aplikacija za Učenike i Roditelje
© ${new Date().getFullYear()} Sva Prava Zadržana
  `.trim();

  return {
    subject: '📊 Nedeljni izveštaj - Osnovci',
    html,
    text,
  };
}

// Alias export for backwards compatibility
export const generateWeeklyReportEmail = createWeeklyReportTemplate;
