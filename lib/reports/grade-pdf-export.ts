import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Types (matching analytics types)
interface GradeTrendData {
  date: string;
  grade: number;
  subject: string;
  category: string;
}

interface SubjectTrend {
  subjectId: string;
  subjectName: string;
  currentAverage: number;
  previousAverage: number;
  trend: "up" | "down" | "stable";
  percentageChange: number;
  grades: GradeTrendData[];
}

interface CategoryPerformance {
  category: string;
  count: number;
  average: number;
  trend: "up" | "down" | "stable";
}

interface GradeDistribution {
  grade: number;
  count: number;
  percentage: number;
}

interface Prediction {
  subjectId: string;
  subjectName: string;
  predictedGrade: number;
  confidence: number;
  trend: "up" | "down" | "stable";
}

interface Alert {
  type: "declining" | "improvement" | "below-threshold" | "high-performer";
  severity: "low" | "medium" | "high";
  message: string;
  subjectId?: string;
  subjectName?: string;
}

interface GradeAnalytics {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalGrades: number;
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
  };
  timeline: GradeTrendData[];
  movingAverages: any[];
  subjectTrends: SubjectTrend[];
  categoryPerformance: CategoryPerformance[];
  distribution: GradeDistribution[];
  predictions: Prediction[];
  alerts: Alert[];
}

function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), "dd. MMMM yyyy", { locale: sr });
  } catch {
    return dateString;
  }
}

function getTrendText(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up":
      return "↗ Napreduje";
    case "down":
      return "↘ Opada";
    default:
      return "→ Stabilno";
  }
}

export async function generateGradeAnalyticsPDF(
  studentName: string,
  analytics: GradeAnalytics,
): Promise<Blob> {
  const doc = new jsPDF();
  const {
    overview,
    subjectTrends,
    categoryPerformance,
    distribution,
    predictions,
    alerts,
  } = analytics;

  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Analitika Ocena", 105, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(studentName, 105, yPos, { align: "center" });

  yPos += 6;
  doc.setFontSize(10);
  doc.text(
    `${formatDate(analytics.period.startDate)} - ${formatDate(analytics.period.endDate)}`,
    105,
    yPos,
    { align: "center" },
  );

  yPos += 15;

  // Overview Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Pregled", 14, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Metrika", "Vrednost"]],
    body: [
      ["Ukupno ocena", overview.totalGrades.toString()],
      ["Prosečna ocena", overview.averageGrade.toFixed(2)],
      ["Najviša ocena", overview.highestGrade.toString()],
      ["Najniža ocena", overview.lowestGrade.toString()],
      ["Trend", getTrendText(overview.trend)],
      [
        "Promena",
        `${overview.trendPercentage > 0 ? "+" : ""}${overview.trendPercentage.toFixed(1)}%`,
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Alerts Section
  if (alerts.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Upozorenja i Obaveštenja", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Tip", "Poruka"]],
      body: alerts.map((alert) => [
        alert.type === "declining"
          ? "Opadanje"
          : alert.type === "improvement"
            ? "Poboljšanje"
            : alert.type === "below-threshold"
              ? "Ispod praga"
              : "Visoke performanse",
        alert.message,
      ]),
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 140 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Subject Trends
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Trendovi po Predmetima", 14, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [
      ["Predmet", "Trenutni Prosek", "Prethodni Prosek", "Trend", "Promena"],
    ],
    body: subjectTrends.map((subject) => [
      subject.subjectName,
      subject.currentAverage.toFixed(2),
      subject.previousAverage.toFixed(2),
      getTrendText(subject.trend),
      `${subject.percentageChange > 0 ? "+" : ""}${subject.percentageChange.toFixed(1)}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Category Performance
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Performanse po Kategorijama", 14, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Kategorija", "Broj Ocena", "Prosek", "Trend"]],
    body: categoryPerformance.map((category) => [
      category.category,
      category.count.toString(),
      category.average.toFixed(2),
      getTrendText(category.trend),
    ]),
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Distribution
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Distribucija Ocena", 14, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Ocena", "Broj", "Procenat"]],
    body: distribution.map((dist) => [
      dist.grade.toString(),
      dist.count.toString(),
      `${dist.percentage.toFixed(1)}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Predictions
  if (predictions.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Predikcije", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Predmet", "Predviđena Ocena", "Pouzdanost", "Trend"]],
      body: predictions.map((pred) => [
        pred.subjectName,
        pred.predictedGrade.toFixed(2),
        `${pred.confidence.toFixed(0)}%`,
        getTrendText(pred.trend),
      ]),
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generisano: ${format(new Date(), "dd. MMMM yyyy, HH:mm", { locale: sr })}`,
      105,
      285,
      { align: "center" },
    );
    doc.text("Osnovci - Platforma za Praćenje Napretka Učenika", 105, 290, {
      align: "center",
    });
  }

  return doc.output("blob");
}
