/**
 * Homework Export Utilities
 * Export homework to PDF and CSV formats
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { showSuccessToast, showErrorToast } from "@/components/features/error-toast";

interface HomeworkItem {
  id: string;
  title: string;
  subject?: string | undefined;
  description?: string | undefined;
  dueDate: Date | string;
  status: string;
  priority?: string | undefined;
}

/**
 * Export homework to PDF
 */
export function exportHomeworkToPDF(
  homework: HomeworkItem[],
  studentName: string = "Učenik"
) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Osnovci", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Izveštaj o domaćim zadacima", 105, 23, { align: "center" });

    // Info section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Učenik: ${studentName}`, 20, 40);
    doc.text(
      `Datum: ${new Date().toLocaleDateString("sr-RS")}`,
      20,
      46
    );
    doc.text(`Ukupno zadataka: ${homework.length}`, 20, 52);

    // Statistics
    const stats = {
      total: homework.length,
      completed: homework.filter((h) =>
        ["done", "submitted", "DONE", "SUBMITTED"].includes(h.status)
      ).length,
      pending: homework.filter(
        (h) => !["done", "submitted", "DONE", "SUBMITTED"].includes(h.status)
      ).length,
      urgent: homework.filter(
        (h) => h.priority === "urgent" || h.priority === "URGENT"
      ).length,
    };

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Statistika", 20, 64);

    autoTable(doc, {
      startY: 68,
      head: [["Metrika", "Vrednost"]],
      body: [
        ["Ukupno zadataka", stats.total.toString()],
        ["Urađeno", stats.completed.toString()],
        ["Na čekanju", stats.pending.toString()],
        ["Hitno", stats.urgent.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: 20, right: 20 },
    });

    // Homework list
    const currentY =
      (doc as typeof doc & { lastAutoTable?: { finalY: number } })
        .lastAutoTable?.finalY ?? 90;
    const nextY = currentY + 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Lista zadataka", 20, nextY);

    const tableData = homework.map((h) => [
      h.subject || "N/A",
      h.title,
      formatStatus(h.status),
      formatPriority(h.priority),
      new Date(h.dueDate).toLocaleDateString("sr-RS"),
    ]);

    autoTable(doc, {
      startY: nextY + 5,
      head: [["Predmet", "Naslov", "Status", "Prioritet", "Rok"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
      },
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Strana ${i} od ${pageCount}`,
        105,
        287,
        { align: "center" }
      );
    }

    // Save PDF
    doc.save(`domaci-zadaci-${new Date().toISOString().split("T")[0]}.pdf`);
    showSuccessToast("PDF izveštaj je uspešno generisan!");
  } catch (error) {
    showErrorToast({
      error:
        error instanceof Error
          ? error
          : new Error("Greška pri generisanju PDF-a"),
    });
  }
}

/**
 * Export homework to CSV
 */
export function exportHomeworkToCSV(
  homework: HomeworkItem[],
  filename: string = "domaci-zadaci"
) {
  try {
    const headers = ["Predmet", "Naslov", "Status", "Prioritet", "Rok", "Opis"];
    const rows = homework.map((h) => [
      h.subject || "",
      h.title,
      formatStatus(h.status),
      formatPriority(h.priority),
      new Date(h.dueDate).toLocaleDateString("sr-RS"),
      h.description || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccessToast("CSV fajl je uspešno preuzet!");
  } catch (error) {
    showErrorToast({
      error:
        error instanceof Error
          ? error
          : new Error("Greška pri generisanju CSV-a"),
    });
  }
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    ASSIGNED: "Dodeljeno",
    IN_PROGRESS: "U toku",
    DONE: "Urađeno",
    SUBMITTED: "Poslato",
    assigned: "Dodeljeno",
    in_progress: "U toku",
    done: "Urađeno",
    submitted: "Poslato",
  };
  return statusMap[status] || status;
}

function formatPriority(priority?: string): string {
  if (!priority) return "-";
  const priorityMap: Record<string, string> = {
    URGENT: "Hitno",
    IMPORTANT: "Važno",
    NORMAL: "Normalno",
    LOW: "Nisko",
    urgent: "Hitno",
    important: "Važno",
    normal: "Normalno",
    low: "Nisko",
  };
  return priorityMap[priority] || priority;
}

