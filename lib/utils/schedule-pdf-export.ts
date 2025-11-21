// PDF Export Utility - Generate PDF schedule
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ScheduleEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: { id: string; name: string; color: string; icon: string | null };
  classroom: string | null;
  notes: string | null;
}

const DAYS = [
  { key: "MONDAY", label: "Ponedeljak" },
  { key: "TUESDAY", label: "Utorak" },
  { key: "WEDNESDAY", label: "Sreda" },
  { key: "THURSDAY", label: "Četvrtak" },
  { key: "FRIDAY", label: "Petak" },
];

export function exportScheduleToPDF(
  schedule: ScheduleEntry[],
  studentName: string = "Učenik",
) {
  // Kreiraj PDF dokument (A4, landscape za bolji pregled rasporeda)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // ========================================
  // HEADER
  // ========================================
  doc.setFillColor(249, 115, 22); // Orange-500
  doc.rect(0, 0, 297, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Osnovci", 148.5, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Raspored časova", 148.5, 23, { align: "center" });

  // ========================================
  // INFO
  // ========================================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Učenik: ${studentName}`, 15, 40);
  doc.text(`Generisano: ${new Date().toLocaleDateString("sr-RS")}`, 15, 46);

  // ========================================
  // RASPORED TABELA
  // ========================================
  
  // Pripremi podatke za tabelu
  // Kolone: Vreme, Pon, Uto, Sre, Čet, Pet
  // Redovi: Termini časova (moramo ih grupisati po vremenu ili samo listati)
  
  // Jednostavniji pristup: Tabela gde je svaki dan jedna sekcija ili kolona
  // Najbolje: Kolone su dani, redovi su časovi (1. čas, 2. čas...)
  
  // 1. Nađi maksimalan broj časova u danu da znamo koliko redova nam treba
  let maxLessons = 0;
  DAYS.forEach(day => {
    const count = schedule.filter(s => s.dayOfWeek === day.key).length;
    if (count > maxLessons) maxLessons = count;
  });

  // Ako nema časova, stavi bar 5-6 redova
  if (maxLessons < 6) maxLessons = 6;

  const tableBody = [];

  for (let i = 0; i < maxLessons; i++) {
    const row: string[] = [`${i + 1}. čas`]; // Prva kolona je broj časa
    
    DAYS.forEach(day => {
      // Nađi i-ti čas za ovaj dan
      // Sortiraj po vremenu prvo
      const dayLessons = schedule
        .filter(s => s.dayOfWeek === day.key)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      const lesson = dayLessons[i];
      
      if (lesson) {
        row.push(`${lesson.subject.name}\n${lesson.startTime}-${lesson.endTime}\n${lesson.classroom || ''}`);
      } else {
        row.push("");
      }
    });
    
    tableBody.push(row);
  }

  autoTable(doc, {
    startY: 55,
    head: [["", ...DAYS.map(d => d.label)]],
    body: tableBody,
    theme: "grid",
    headStyles: { 
      fillColor: [249, 115, 22], 
      textColor: 255,
      halign: 'center',
      valign: 'middle',
      fontSize: 12
    },
    styles: {
      cellPadding: 3,
      fontSize: 10,
      valign: 'middle',
      halign: 'center',
      overflow: 'linebreak',
      minCellHeight: 20
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' }, // Broj časa
      // Ostale kolone automatski
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
    doc.text(`Stranica ${i} od ${pageCount}`, 148.5, 200, { align: "center" });
  }

  const fileName = `raspored_${studentName.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
  
  return fileName;
}
