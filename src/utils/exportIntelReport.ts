import { ScoredEvent } from '@/data/eventPriorityEngine';
import { jsPDF } from 'jspdf';

/**
 * Export scored intel events as CSV and trigger download.
 */
export function exportIntelCSV(events: ScoredEvent[]) {
  const header = 'Priority,Category,Severity,Title,Country,Source,Score,Lat,Lng,Time,URL\n';
  const rows = events.map(e =>
    [
      e.priorityLevel.toUpperCase(),
      e.category.toUpperCase(),
      e.severity,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      e.country ?? '',
      e.source ?? '',
      e.priorityScore,
      e.lat ?? '',
      e.lng ?? '',
      e.created_at,
      e.url ?? '',
    ].join(',')
  ).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  download(blob, `sentra-intel-report-${dateStamp()}.csv`);
}

/**
 * Export scored intel events as a styled PDF report.
 */
export function exportIntelPDF(events: ScoredEvent[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 20, 30);
  doc.rect(0, 0, w, 35, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 200, 255);
  doc.text('SENTRA — INTELLIGENCE REPORT', 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(150, 160, 180);
  doc.text(`Generated: ${new Date().toISOString()}`, 14, 24);
  doc.text(`Events: ${events.length}  |  Critical: ${events.filter(e => e.priorityScore >= 80).length}  |  High: ${events.filter(e => e.priorityScore >= 60 && e.priorityScore < 80).length}`, 14, 30);

  let y = 42;
  const lineH = 6;
  const margin = 14;
  const colScore = margin;
  const colCat = margin + 18;
  const colTitle = margin + 48;
  const maxTitleW = w - colTitle - margin;

  // Column headers
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 110, 130);
  doc.text('SCORE', colScore, y);
  doc.text('CATEGORY', colCat, y);
  doc.text('EVENT', colTitle, y);
  y += 3;
  doc.setDrawColor(40, 50, 70);
  doc.line(margin, y, w - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  events.forEach((event) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    // Score badge color
    if (event.priorityScore >= 80) doc.setTextColor(220, 50, 50);
    else if (event.priorityScore >= 60) doc.setTextColor(230, 160, 30);
    else doc.setTextColor(100, 180, 100);

    doc.setFont('helvetica', 'bold');
    doc.text(String(event.priorityScore), colScore, y);

    // Category
    doc.setTextColor(80, 160, 220);
    doc.setFont('helvetica', 'bold');
    doc.text(event.category.toUpperCase(), colCat, y);

    // Title (wrap)
    doc.setTextColor(200, 210, 220);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(event.title, maxTitleW);
    doc.text(lines, colTitle, y);
    y += Math.max(lineH, lines.length * 3.5);

    // Details line
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 150);
    const details = [
      event.country,
      event.severity.toUpperCase(),
      event.source,
      new Date(event.created_at).toLocaleString(),
    ].filter(Boolean).join('  •  ');
    doc.text(details, colTitle, y);
    y += lineH + 1;

    doc.setFontSize(8);
  });

  doc.save(`sentra-intel-report-${dateStamp()}.pdf`);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
