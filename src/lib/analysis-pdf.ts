import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"

import type { AnalysisResult } from "@/lib/api"

/**
 * PDF export for the Analysis report — mirrors Web app/lib/analysis-pdf.ts so
 * both apps hand out the same document. jsPDF + autotable produce a real text
 * PDF rather than a screenshot, and are imported lazily so they only load when
 * someone taps "Download PDF".
 *
 * On device the file goes to Directory.Cache and out through the native share
 * sheet, same as the ID cards (see card-capture.ts) — a Capacitor WebView has
 * no Downloads folder of its own. In a desktop browser (npm run dev) it falls
 * back to a normal download.
 */

export type AnalysisPdfFilters = {
  start: string // yyyy-mm-dd
  end: string
  gradeLabel: string
  batchLabel: string
}

const MAROON: [number, number, number] = [114, 0, 0]
const GOLD: [number, number, number] = [184, 134, 11]

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Crest scaled down to 240px on a canvas, so it doesn't bloat the PDF. */
async function loadLogo(): Promise<string | null> {
  try {
    const img = new Image()
    img.src = "/logo.png"
    await img.decode()
    const scale = Math.min(1, 240 / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

const pct = (v: number | null) => (v === null ? "—" : `${v}%`)

export async function downloadAnalysisPdf(rows: AnalysisResult[], filters: AnalysisPdfFilters) {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadLogo(),
  ])

  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // Header band
  doc.setFillColor(...MAROON)
  doc.rect(0, 0, pageWidth, 28, "F")
  doc.setFillColor(...GOLD)
  doc.rect(0, 28, pageWidth, 1.2, "F")
  let textX = margin
  if (logo) {
    doc.addImage(logo, "PNG", margin, 5, 18, 18)
    textX = margin + 22
  }
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("Kallar Central Sports Club", textX, 13)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Student Analysis Report — exam results & attendance", textX, 20)

  // Filter summary
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(10)
  const summary = [
    `Period: ${formatDate(filters.start)} – ${formatDate(filters.end)}`,
    `Grade: ${filters.gradeLabel}`,
    `Batch: ${filters.batchLabel}`,
    `Students: ${rows.length}`,
  ]
  doc.text(summary.join("     "), margin, 38)

  autoTable(doc, {
    startY: 43,
    margin: { left: margin, right: margin },
    head: [["Rank", "Student", "Grade", "Exams", "Avg. Marks", "Attendance", "Combined"]],
    body: rows.map((r, i) => [
      String(i + 1),
      r.name,
      `Grade ${r.grade}`,
      String(r.examCount),
      pct(r.avgMarksPercent),
      pct(r.attendancePercent),
      r.partial ? `${pct(r.combinedScore)} (partial)` : pct(r.combinedScore),
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: [40, 40, 40] },
    headStyles: { fillColor: MAROON, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 245, 245] },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 14 },
      1: { fontStyle: "bold" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right", fontStyle: "bold", textColor: MAROON },
    },
  })

  // Footer on every page: explanation note, generated date, page numbers
  const pageCount = doc.getNumberOfPages()
  const pageHeight = doc.internal.pageSize.getHeight()
  const generated = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(110, 110, 110)
    doc.text(
      'Combined score = average of avg. exam % and attendance % over the period. "partial" = only one of the two was available.',
      margin,
      pageHeight - 12
    )
    doc.text(`Generated ${generated}`, margin, pageHeight - 7)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: "right" })
  }

  const filename = `KCSC-analysis-${filters.start}-to-${filters.end}.pdf`
  if (!Capacitor.isNativePlatform()) {
    doc.save(filename)
    return
  }
  const base64 = doc.output("datauristring").split(",")[1]
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })
  await Share.share({ title: filename, url: uri })
}
