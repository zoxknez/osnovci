// PDF Export Utility - Generate PDF reports for grades
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface GradeData {
  subject: { name: string; color: string };
  grade: string;
  category: string;
  description: string | null;
  date: string | Date;
}

interface GradeStats {
  average: number;
  total: number;
  byCategory: Record<string, number>;
  bySubject: Array<{
    subject: string;
    average: number;
    count: number;
  }>;
}

export function exportGradesToPDF(
  grades: GradeData[],
  stats: GradeStats,
  studentName: string = "Učenik",
) {
  // Kreiraj PDF dokument (A4, portrait)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // ========================================
  // HEADER - Logo i naziv aplikacije
  // ========================================
  doc.setFillColor(59, 130, 246); // Blue-500
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Osnovci", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
      doc.text('Izveštaj o ocenama', 105, 20, { align: 'center' });

  // ========================================
  // INFO SEKCIJA
  // ========================================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const currentDate = new Date().toLocaleDateString("sr-RS", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.text(`Učenik: ${studentName}`, 20, 40);
  doc.text(`Datum: ${currentDate}`, 20, 46);

  // ========================================
  // STATISTIKA
  // ========================================
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Opšta statistika", 20, 56);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Statistika u tabeli
  autoTable(doc, {
    startY: 60,
    head: [["Metrika", "Vrednost"]],
    body: [
      ["Opšti prosek", stats.average.toFixed(2)],
      ["Ukupno ocena", stats.total.toString()],
      [
        "Najbolji predmet",
        stats.bySubject.length > 0
          ? stats.bySubject.reduce((max, s) =>
              (s?.average ?? 0) > (max?.average ?? 0) ? s : max,
            ).subject
          : "N/A",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: 20, right: 20 },
  });

  // ========================================
  // PROSJECI PO PREDMETU
  // ========================================
  const currentY =
    (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 90;
  const nextY = currentY + 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Proseci po predmetu", 20, nextY);

  autoTable(doc, {
    startY: nextY + 5,
    head: [["Predmet", "Prosek", "Broj ocena"]],
    body: stats.bySubject.map((s) => [
      s?.subject || "",
      s?.average?.toFixed(2) || "0.00",
      s?.count?.toString() || "0",
    ]),
    theme: "striped",
    headStyles: { fillColor: [139, 92, 246], textColor: 255 }, // Purple
    margin: { left: 20, right: 20 },
  });

  // ========================================
  // SVE OCENE - Detaljna tabela
  // ========================================
  const gradesY =
    (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 150;
  const gradesStartY = gradesY + 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Sve ocene", 20, gradesStartY);

  autoTable(doc, {
    startY: gradesStartY + 5,
    head: [["Predmet", "Ocena", "Kategorija", "Datum", "Opis"]],
    body: grades.map((g) => [
      g.subject.name,
      g.grade,
      g.category,
      new Date(g.date).toLocaleDateString("sr-RS"),
      g.description || "-",
    ]),
    theme: "grid",
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 40 }, // Subject
      1: { cellWidth: 20, halign: "center" }, // Grade
      2: { cellWidth: 30 }, // Category
      3: { cellWidth: 25 }, // Date
      4: { cellWidth: "auto" }, // Description
    },
  });

  // ========================================
  // FOOTER
  // ========================================
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Stranica ${i} od ${pageCount}`, 105, 290, { align: "center" });
    doc.text("Generisano: Osnovci App", 20, 290);
  }

  // ========================================
  // DOWNLOAD
  // ========================================
  const fileName = `ocene_${studentName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);

  return fileName;
}
