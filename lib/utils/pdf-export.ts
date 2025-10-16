// PDF Export Utilities - Za izvještaje i raspored
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export Homework List to PDF
 */
export function exportHomeworkToPDF(
  homework: Array<{
    title: string;
    subject: string;
    dueDate: Date;
    status: string;
    priority: string;
  }>,
  studentName: string,
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Domaći Zadaci - Izveštaj", 14, 20);

  // Student info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Učenik: ${studentName}`, 14, 30);
  doc.text(`Datum: ${new Date().toLocaleDateString("sr-RS")}`, 14, 37);

  // Table
  autoTable(doc, {
    head: [["Predmet", "Zadatak", "Rok", "Status", "Prioritet"]],
    body: homework.map((hw) => [
      hw.subject,
      hw.title,
      new Date(hw.dueDate).toLocaleDateString("sr-RS"),
      hw.status === "done" ? "Urađeno" : "Aktivno",
      hw.priority === "urgent"
        ? "Hitno"
        : hw.priority === "important"
          ? "Važno"
          : "Normalno",
    ]),
    startY: 45,
    styles: {
      font: "helvetica",
      fontSize: 10,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
  });

  // Footer - add to all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.text(
      `Generisano: ${new Date().toLocaleString("sr-RS")} | Strana ${page} od ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10,
    );
  }

  // Save
  doc.save(`domaci-zadaci-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Weekly Schedule to PDF
 */
export function exportScheduleToPDF(
  schedule: Array<{
    dayOfWeek: string;
    subject: string;
    startTime: string;
    endTime: string;
    room?: string;
  }>,
  studentName: string,
  weekNumber: number,
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Nedeljni Raspored Časova", 14, 20);

  // Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Učenik: ${studentName}`, 14, 30);
  doc.text(`Nedelja: ${weekNumber}`, 14, 37);

  // Group by day
  const days = ["Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
  const groupedSchedule = days.map((day) => ({
    day,
    classes: schedule.filter((s) => s.dayOfWeek === day),
  }));

  let currentY = 45;

  groupedSchedule.forEach((daySchedule) => {
    if (daySchedule.classes.length === 0) return;

    // Day header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(daySchedule.day, 14, currentY);
    currentY += 7;

    // Classes table
    autoTable(doc, {
      head: [["Vreme", "Predmet", "Učionica"]],
      body: daySchedule.classes.map((c) => [
        `${c.startTime} - ${c.endTime}`,
        c.subject,
        c.room || "-",
      ]),
      startY: currentY,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [147, 51, 234], // Purple
      },
      margin: { left: 20 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.text(
    `Generisano: ${new Date().toLocaleString("sr-RS")}`,
    14,
    doc.internal.pageSize.height - 10,
  );

  doc.save(`raspored-nedelja-${weekNumber}.pdf`);
}

/**
 * Export Weekly Report to PDF
 */
export function exportWeeklyReportToPDF(
  report: {
    weekStart: Date;
    weekEnd: Date;
    totalHomework: number;
    completedHomework: number;
    lateHomework: number;
    subjectBreakdown: Record<string, { total: number; completed: number }>;
  },
  studentName: string,
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Nedeljni Izveštaj", 14, 20);

  // Period
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Učenik: ${studentName}`, 14, 30);
  doc.text(
    `Period: ${new Date(report.weekStart).toLocaleDateString("sr-RS")} - ${new Date(report.weekEnd).toLocaleDateString("sr-RS")}`,
    14,
    37,
  );

  // Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Pregled", 14, 50);

  const completionRate = (
    (report.completedHomework / report.totalHomework) *
    100
  ).toFixed(1);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Ukupno zadataka: ${report.totalHomework}`, 14, 60);
  doc.text(
    `Završeno: ${report.completedHomework} (${completionRate}%)`,
    14,
    67,
  );
  doc.text(`Kasni: ${report.lateHomework}`, 14, 74);

  // Subject breakdown
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Po Predmetima", 14, 90);

  autoTable(doc, {
    head: [["Predmet", "Ukupno", "Završeno", "Procenat"]],
    body: Object.entries(report.subjectBreakdown).map(([subject, data]) => [
      subject,
      data.total.toString(),
      data.completed.toString(),
      `${((data.completed / data.total) * 100).toFixed(1)}%`,
    ]),
    startY: 95,
    styles: {
      fontSize: 10,
    },
    headStyles: {
      fillColor: [34, 197, 94], // Green
    },
  });

  // Footer
  doc.setFontSize(8);
  doc.text(
    `Generisano: ${new Date().toLocaleString("sr-RS")}`,
    14,
    doc.internal.pageSize.height - 10,
  );

  doc.save(
    `nedeljni-izvestaj-${new Date(report.weekStart).toISOString().split("T")[0]}.pdf`,
  );
}

/**
 * Export Student Profile to PDF
 */
export function exportProfileToPDF(profile: {
  name: string;
  school: string;
  grade: number;
  class: string;
  email?: string;
  phone?: string;
}) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Profil Učenika", 14, 20);

  // Profile info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  let y = 35;

  doc.text(`Ime i prezime: ${profile.name}`, 14, y);
  y += 10;
  doc.text(`Škola: ${profile.school}`, 14, y);
  y += 10;
  doc.text(`Razred: ${profile.grade}. ${profile.class}`, 14, y);

  if (profile.email) {
    y += 10;
    doc.text(`Email: ${profile.email}`, 14, y);
  }

  if (profile.phone) {
    y += 10;
    doc.text(`Telefon: ${profile.phone}`, 14, y);
  }

  // Footer
  doc.setFontSize(8);
  doc.text(
    `Generisano: ${new Date().toLocaleString("sr-RS")}`,
    14,
    doc.internal.pageSize.height - 10,
  );

  doc.save(`profil-${profile.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
