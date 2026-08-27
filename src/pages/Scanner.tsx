import { useState } from "react"

import { PageHeader } from "@/components/page-header"
import { QrScannerPanel, type ScannerMode } from "@/components/qr-scanner-panel"

/**
 * The scanner as a full page. The scanning itself lives in QrScannerPanel,
 * which the Dashboard's quick-scan sheet renders too — this page is just the
 * heading around it.
 */
export default function ScannerPage() {
  const [mode, setMode] = useState<ScannerMode>("attendance")

  return (
    <div className="space-y-4">
      <PageHeader
        title="Scanner"
        description={
          mode === "attendance"
            ? "Scan a student QR ID to mark attendance."
            : "Scan a student QR ID to jump straight to their profile."
        }
      />
      <QrScannerPanel onModeChange={setMode} />
    </div>
  )
}
