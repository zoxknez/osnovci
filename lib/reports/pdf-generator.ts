/**
 * PDF Report Generator
 * Generisanje PDF izveštaja za učenike
 * Koristi jsPDF + jspdf-autotable
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { log } from "@/lib/logger";
import type { AggregatedStudentData } from "./data-aggregator";

// Colors
const COLORS = {
  primary: [59, 130, 246] as [number, number, number], // Blue
  secondary: [100, 116, 139] as [number, number, number], // Slate
  success: [34, 197, 94] as [number, number, number], // Green
  warning: [234, 179, 8] as [number, number, number], // Yellow
  danger: [239, 68, 68] as [number, number, number], // Red
  text: [30, 41, 59] as [number, number, number], // Slate-800
  lightGray: [241, 245, 249] as [number, number, number], // Slate-100
};

/**
 * Generate PDF report from aggregated data
 */
export async function generatePDFReport(
  data: AggregatedStudentData,
  reportType: "weekly" | "monthly" | "semester" | "annual",
): Promise<Blob> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPosition = 20;

    // Header
    yPosition = addHeader(doc, data, reportType, yPosition);

    // Summary Section
    yPosition = addSummarySection(doc, data, yPosition);

    // Grades Section
    if (data.grades.totalCount > 0) {
      yPosition = addGradesSection(doc, data, yPosition);
    }

    // Homework Section
    if (data.homework.total > 0) {
      yPosition = addHomeworkSection(doc, data, yPosition);
    }

    // Gamification Section
    yPosition = addGamificationSection(doc, data, yPosition);

    // Achievements Section (if any)
    if (data.achievements.length > 0) {
      yPosition = addAchievementsSection(doc, data, yPosition);
    }

    // Footer
    addFooter(doc);

    log.info("PDF report generated", {
      studentId: data.student.id,
      reportType,
      pages: doc.getNumberOfPages(),
    });

    return doc.output("blob");
  } catch (error) {
    log.error("Error generating PDF report", { error });
    throw new Error("Greška pri generisanju PDF izveštaja");
  }
}

/**
 * Add header with logo and title
 */
function addHeader(
  doc: jsPDF,
  data: AggregatedStudentData,
  reportType: string,
  y: number,
): number {
  // Title
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text("📚 Osnovci", 20, y);

  // Report type badge
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.secondary);
  const reportTypeLabels: Record<string, string> = {
    weekly: "Nedeljni izveštaj",
    monthly: "Mesečni izveštaj",
    semester: "Polugodišnji izveštaj",
    annual: "Godišnji izveštaj",
  };
  doc.text(reportTypeLabels[reportType] || "Izveštaj", 20, y + 10);

  // Student info
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text(`Učenik: ${data.student.name}`, 20, y + 22);

  if (data.student.grade) {
    doc.setFontSize(11);
    doc.text(`Razred: ${data.student.grade}`, 20, y + 30);
  }

  if (data.student.school) {
    doc.text(`Škola: ${data.student.school}`, 20, y + 38);
  }

  // Period
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Period: ${data.period.label}`, 20, y + 48);

  // Horizontal line
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(20, y + 54, 190, y + 54);

  return y + 62;
}

/**
 * Add summary cards section
 */
function addSummarySection(
  doc: jsPDF,
  data: AggregatedStudentData,
  y: number,
): number {
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text("📊 Pregled", 20, y);

  y += 8;

  // Create summary boxes
  const boxWidth = 40;
  const boxHeight = 25;
  const gap = 5;
  let x = 20;

  // Box 1: Average Grade
  drawSummaryBox(doc, x, y, boxWidth, boxHeight, {
    label: "Prosek",
    value:
      data.grades.overallAverage > 0
        ? data.grades.overallAverage.toFixed(2)
        : "-",
    color: getGradeColor(data.grades.overallAverage),
  });
  x += boxWidth + gap;

  // Box 2: Homework Completion
  drawSummaryBox(doc, x, y, boxWidth, boxHeight, {
    label: "Domaći",
    value: `${data.homework.completionRate}%`,
    color:
      data.homework.completionRate >= 80
        ? COLORS.success
        : data.homework.completionRate >= 50
          ? COLORS.warning
          : COLORS.danger,
  });
  x += boxWidth + gap;

  // Box 3: Level
  drawSummaryBox(doc, x, y, boxWidth, boxHeight, {
    label: "Nivo",
    value: `${data.gamification.level}`,
    color: COLORS.primary,
  });
  x += boxWidth + gap;

  // Box 4: Streak
  drawSummaryBox(doc, x, y, boxWidth, boxHeight, {
    label: "Niz dana",
    value: `${data.gamification.streak}`,
    color: data.gamification.streak >= 7 ? COLORS.success : COLORS.secondary,
  });

  return y + boxHeight + 12;
}

/**
 * Draw a summary box
 */
function drawSummaryBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  content: { label: string; value: string; color: [number, number, number] },
): void {
  // Background
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(x, y, width, height, 3, 3, "F");

  // Value
  doc.setFontSize(16);
  doc.setTextColor(...content.color);
  doc.text(content.value, x + width / 2, y + 12, { align: "center" });

  // Label
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(content.label, x + width / 2, y + 20, { align: "center" });
}

/**
 * Add grades table section
 */
function addGradesSection(
  doc: jsPDF,
  data: AggregatedStudentData,
  y: number,
): number {
  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text("📝 Ocene po predmetima", 20, y);

  y += 6;

  // Grades by subject table
  const tableData = data.grades.bySubject.map((item) => [
    item.subject,
    item.grades.join(", "),
    item.count.toString(),
    item.average.toFixed(2),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Predmet", "Ocene", "Broj", "Prosek"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
    },
  });

  return (doc as any).lastAutoTable.finalY + 12;
}

/**
 * Add homework section
 */
function addHomeworkSection(
  doc: jsPDF,
  data: AggregatedStudentData,
  y: number,
): number {
  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text("📚 Domaći zadaci", 20, y);

  y += 8;

  // Stats row
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Ukupno: ${data.homework.total}  |  `, 20, y);

  doc.setTextColor(...COLORS.success);
  doc.text(`Završeno: ${data.homework.completed}  |  `, 60, y);

  doc.setTextColor(...COLORS.warning);
  doc.text(`Na čekanju: ${data.homework.pending}  |  `, 105, y);

  doc.setTextColor(...COLORS.danger);
  doc.text(`Zakasnelo: ${data.homework.overdue}`, 150, y);

  y += 8;

  // Homework by subject table
  if (data.homework.bySubject.length > 0) {
    const tableData = data.homework.bySubject.map((item) => [
      item.subject,
      item.completed.toString(),
      item.total.toString(),
      `${item.rate}%`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Predmet", "Završeno", "Ukupno", "Procenat"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 35, halign: "center" },
        3: { cellWidth: 35, halign: "center" },
      },
    });

    return (doc as any).lastAutoTable.finalY + 12;
  }

  return y + 10;
}

/**
 * Add gamification section
 */
function addGamificationSection(
  doc: jsPDF,
  data: AggregatedStudentData,
  y: number,
): number {
  // Check if we need a new page
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text("🎮 Napredak i postignuća", 20, y);

  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);

  const gamifItems = [
    `🏆 Nivo: ${data.gamification.level}`,
    `⭐ XP: ${data.gamification.xp.toLocaleString()}`,
    `📈 Ukupan XP: ${data.gamification.totalXPEarned.toLocaleString()}`,
    `🔥 Trenutni niz: ${data.gamification.streak} dana`,
    `📅 Najduži niz: ${data.gamification.longestStreak} dana`,
    `🎯 Postignuća: ${data.gamification.achievementsUnlocked}`,
  ];

  if (data.gamification.rank) {
    gamifItems.push(`🥇 Rang: #${data.gamification.rank}`);
  }

  // Draw in two columns
  const colWidth = 85;
  for (let i = 0; i < gamifItems.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    doc.text(gamifItems[i] ?? "", 20 + col * colWidth, y + row * 7);
  }

  return y + Math.ceil(gamifItems.length / 2) * 7 + 10;
}

/**
 * Add achievements section
 */
function addAchievementsSection(
  doc: jsPDF,
  data: AggregatedStudentData,
  y: number,
): number {
  // Check if we need a new page
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text("🏅 Nova postignuća u periodu", 20, y);

  y += 6;

  const tableData = data.achievements
    .slice(0, 10)
    .map((a) => [
      getRarityEmoji(a.rarity) + " " + a.title,
      a.description.substring(0, 50) + (a.description.length > 50 ? "..." : ""),
      formatDate(a.unlockedAt),
    ]);

  autoTable(doc, {
    startY: y,
    head: [["Postignuće", "Opis", "Datum"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 85 },
      2: { cellWidth: 30 },
    },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Add footer to all pages
 */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const now = new Date();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);

    // Footer text
    doc.text(`Generisano: ${formatDate(now)} | Osnovci App`, 20, 285);

    // Page number
    doc.text(`Strana ${i} od ${pageCount}`, 190, 285, { align: "right" });
  }
}

// Helper functions

function getGradeColor(average: number): [number, number, number] {
  if (average >= 4.5) return COLORS.success;
  if (average >= 3.5) return COLORS.primary;
  if (average >= 2.5) return COLORS.warning;
  return COLORS.danger;
}

function getRarityEmoji(rarity: string): string {
  switch (rarity) {
    case "LEGENDARY":
      return "🌟";
    case "EPIC":
      return "💎";
    case "RARE":
      return "✨";
    default:
      return "⭐";
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Generate PDF and return as base64
 */
export async function generatePDFBase64(
  data: AggregatedStudentData,
  reportType: "weekly" | "monthly" | "semester" | "annual",
): Promise<string> {
  const blob = await generatePDFReport(data, reportType);
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}
