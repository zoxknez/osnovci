/**
 * PDF Export Service for Analytics
 * Generates PDF reports from analytics data
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AnalyticsData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  homework: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    avgCompletionTime: number;
  };
  grades: {
    count: number;
    average: number;
    highest: number;
    lowest: number;
    trend: string;
    bySubject: Array<{
      subjectName: string;
      count: number;
      average: number;
    }>;
  };
  timeSpent: {
    totalHours: number;
    sessions: number;
    avgSessionMinutes: number;
  };
  subjectPerformance: Array<{
    subjectName: string;
    gradeAverage: number | null;
    gradeCount: number;
    homeworkCompletionRate: number | null;
    homeworkTotal: number;
  }>;
  weeklyComparison: {
    currentWeek: {
      homeworkCompleted: number;
      homeworkTotal: number;
      gradeAverage: number;
    };
    previousWeek: {
      homeworkCompleted: number;
      homeworkTotal: number;
      gradeAverage: number;
    };
    changes: {
      homework: number;
      grade: number;
    };
  };
  achievements: {
    total: number;
    totalPoints: number;
  };
}

export async function generateAnalyticsPDF(
  studentName: string,
  analytics: AnalyticsData
): Promise<Blob> {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Izvestaj o Napretku Ucenika", 105, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Ucenik: ${studentName}`, 105, yPosition, { align: "center" });

  yPosition += 8;
  doc.setFontSize(10);
  doc.text(
    `Period: ${formatDate(analytics.period.startDate)} - ${formatDate(analytics.period.endDate)}`,
    105,
    yPosition,
    { align: "center" }
  );

  yPosition += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Pregled", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    ["Domaci Zadaci", `${analytics.homework.completed}/${analytics.homework.total}`, `${analytics.homework.completionRate}%`],
    ["Prosek Ocena", analytics.grades.count > 0 ? analytics.grades.average.toFixed(2) : "N/A", getTrendText(analytics.grades.trend)],
    ["Vreme Ucenja", `${analytics.timeSpent.totalHours}h`, `${analytics.timeSpent.sessions} sesija`],
    ["Dostignuca", `${analytics.achievements.total}`, `${analytics.achievements.totalPoints} poena`],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Kategorija", "Vrednost", "Dodatno"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Homework Details
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Domaci Zadaci - Detalji", 20, yPosition);
  yPosition += 8;

  const homeworkData = [
    ["Ukupno dodeljeno", analytics.homework.total.toString()],
    ["Zavrseno", analytics.homework.completed.toString()],
    ["U toku", analytics.homework.pending.toString()],
    ["Prekoraceno", analytics.homework.overdue.toString()],
    ["Stopa zavrsavanja", `${analytics.homework.completionRate}%`],
    ["Prosecno vreme", `${analytics.homework.avgCompletionTime}h`],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: homeworkData,
    theme: "plain",
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { cellWidth: 40 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Grades by Subject
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Ocene po Predmetima", 20, yPosition);
  yPosition += 8;

  const gradesData = analytics.grades.bySubject.map((subject) => [
    subject.subjectName,
    subject.count.toString(),
    subject.average.toFixed(2),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Predmet", "Broj Ocena", "Prosek"]],
    body: gradesData,
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Subject Performance
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Performanse po Predmetima", 20, yPosition);
  yPosition += 8;

  const subjectData = analytics.subjectPerformance.map((subject) => [
    subject.subjectName,
    subject.gradeAverage !== null ? subject.gradeAverage.toFixed(2) : "N/A",
    `${subject.gradeCount}`,
    subject.homeworkCompletionRate !== null ? `${subject.homeworkCompletionRate}%` : "N/A",
    `${subject.homeworkTotal}`,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Predmet", "Prosek", "Ocene", "Stopa", "Domaci"]],
    body: subjectData,
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Weekly Comparison
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Nedeljno Poredjenje", 20, yPosition);
  yPosition += 8;

  const weeklyData = [
    [
      "Domaci zavrseno",
      `${analytics.weeklyComparison.previousWeek.homeworkCompleted}/${analytics.weeklyComparison.previousWeek.homeworkTotal}`,
      `${analytics.weeklyComparison.currentWeek.homeworkCompleted}/${analytics.weeklyComparison.currentWeek.homeworkTotal}`,
      analytics.weeklyComparison.changes.homework > 0
        ? `+${analytics.weeklyComparison.changes.homework}`
        : analytics.weeklyComparison.changes.homework.toString(),
    ],
    [
      "Prosek ocena",
      analytics.weeklyComparison.previousWeek.gradeAverage.toFixed(2),
      analytics.weeklyComparison.currentWeek.gradeAverage.toFixed(2),
      analytics.weeklyComparison.changes.grade > 0
        ? `+${analytics.weeklyComparison.changes.grade.toFixed(2)}`
        : analytics.weeklyComparison.changes.grade.toFixed(2),
    ],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Metrika", "Prethodna Nedelja", "Trenutna Nedelja", "Promena"]],
    body: weeklyData,
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Footer
  if (yPosition > 270) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generisano: ${formatDate(new Date().toISOString())}`, 105, 285, {
    align: "center",
  });
  doc.text("Osnovci - Platforma za Pracenje Napretka Ucenika", 105, 290, {
    align: "center",
  });

  return doc.output("blob");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTrendText(trend: string): string {
  switch (trend) {
    case "improving":
      return "↗ Napreduje";
    case "declining":
      return "↘ Opada";
    default:
      return "→ Stabilno";
  }
}
