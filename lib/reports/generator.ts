/**
 * Report Generator Module
 * Generates PDF/Excel reports for students
 */

import { log } from '@/lib/logger';
import { aggregateStudentData, getReportDateRange, type AggregatedStudentData } from './data-aggregator';
import { generatePDFReport, generatePDFBase64 } from './pdf-generator';

export interface ReportData {
  studentId: string;
  reportType: 'weekly' | 'monthly' | 'semester' | 'annual';
  startDate: Date;
  endDate: Date;
  format: 'pdf' | 'excel' | 'json';
}

export interface GeneratedReport {
  success: boolean;
  data?: Blob | string | AggregatedStudentData;
  mimeType?: string;
  filename?: string;
  error?: string;
}

/**
 * Generate complete report for student
 */
export async function generateReport(data: ReportData): Promise<GeneratedReport> {
  log.info('Generating report', { 
    studentId: data.studentId, 
    type: data.reportType,
    format: data.format 
  });

  try {
    // Aggregate student data
    const aggregatedData = await aggregateStudentData(
      data.studentId,
      data.startDate,
      data.endDate,
      data.reportType
    );

    if (!aggregatedData) {
      return {
        success: false,
        error: 'Nije moguće prikupiti podatke za izveštaj',
      };
    }

    // Generate report based on format
    switch (data.format) {
      case 'pdf':
        const pdfBlob = await generatePDFReport(aggregatedData, data.reportType);
        return {
          success: true,
          data: pdfBlob,
          mimeType: 'application/pdf',
          filename: `izvestaj_${data.reportType}_${Date.now()}.pdf`,
        };

      case 'json':
        return {
          success: true,
          data: aggregatedData,
          mimeType: 'application/json',
          filename: `izvestaj_${data.reportType}_${Date.now()}.json`,
        };

      case 'excel':
        // Excel generation would require xlsx package
        // For now, return JSON as fallback
        log.warn('Excel format not yet implemented, returning JSON');
        return {
          success: true,
          data: aggregatedData,
          mimeType: 'application/json',
          filename: `izvestaj_${data.reportType}_${Date.now()}.json`,
        };

      default:
        return {
          success: false,
          error: 'Nepoznat format izveštaja',
        };
    }
  } catch (error) {
    log.error('Report generation failed', { error, studentId: data.studentId });
    return {
      success: false,
      error: 'Greška pri generisanju izveštaja',
    };
  }
}

/**
 * Generate report with automatic date range
 */
export async function generateReportAuto(
  studentId: string,
  reportType: 'weekly' | 'monthly' | 'semester' | 'annual',
  format: 'pdf' | 'excel' | 'json' = 'pdf'
): Promise<GeneratedReport> {
  const { startDate, endDate } = getReportDateRange(reportType);
  
  return generateReport({
    studentId,
    reportType,
    startDate,
    endDate,
    format,
  });
}

/**
 * Get report as base64 string (useful for email attachments)
 */
export async function generateReportBase64(
  studentId: string,
  reportType: 'weekly' | 'monthly' | 'semester' | 'annual'
): Promise<string | null> {
  try {
    const { startDate, endDate } = getReportDateRange(reportType);
    
    const aggregatedData = await aggregateStudentData(
      studentId,
      startDate,
      endDate,
      reportType
    );

    if (!aggregatedData) {
      return null;
    }

    return generatePDFBase64(aggregatedData, reportType);
  } catch (error) {
    log.error('Report base64 generation failed', { error, studentId });
    return null;
  }
}

/**
 * Get available report types for UI
 */
export function getReportTypes() {
  return [
    { 
      id: 'weekly', 
      label: 'Nedeljni izveštaj', 
      description: 'Pregled aktivnosti u poslednjih 7 dana',
      icon: '📅',
    },
    { 
      id: 'monthly', 
      label: 'Mesečni izveštaj', 
      description: 'Detaljni pregled tekućeg meseca',
      icon: '📆',
    },
    { 
      id: 'semester', 
      label: 'Polugodišnji izveštaj', 
      description: 'Kompletna analiza polugodišta',
      icon: '📊',
    },
    { 
      id: 'annual', 
      label: 'Godišnji izveštaj', 
      description: 'Pregled cele školske godine',
      icon: '🎓',
    },
  ];
}

/**
 * Get report by ID (for future storage retrieval)
 */
export async function getReport(reportId: string): Promise<Buffer | null> {
  log.info('Fetching report', { reportId });
  
  // TODO: Implement storage retrieval when S3/Cloudinary is added
  // For now, reports are generated on-demand
  return null;
}

/**
 * Delete report
 */
export async function deleteReport(reportId: string): Promise<void> {
  log.info('Deleting report', { reportId });
  
  // TODO: Implement storage deletion when S3/Cloudinary is added
}
