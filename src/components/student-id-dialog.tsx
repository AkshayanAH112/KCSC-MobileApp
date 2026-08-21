import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { ShareIcon } from "lucide-react"

import type { Student } from "@/lib/api"
import { downloadCardImage } from "@/lib/card-capture"
import { AlertModal } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

// The name box has a fixed budget (14% of card height) before it runs into the
// batch ribbon baked into the template art below it — a long name at a single
// fixed font size wraps to a second line that gets clipped mid-glyph and
// visually collides with that ribbon. Shrinking the font for longer names
// keeps two wrapped lines inside that budget instead. Mirrors the Web app.
function nameFontSize(name: string): number {
  if (name.length <= 12) return 17
  if (name.length <= 20) return 13
  return 10
}

/**
 * Shared by the students list ("QR" button per row) and the student detail
 * page, so a card is reachable any time after registration, not just once.
 * Mirrors the Web app's templated ID card design (public/id-card-template.png)
 * field-for-field so a card looks the same regardless of which app made it.
 */
export function StudentIdDialog({
  student,
  onClose,
}: {
  student: Student | null
  onClose: () => void
}) {
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!student) return
    QRCode.toDataURL(student.qrCode, { margin: 1, scale: 10 }).then(setQrDataUrl)
  }, [student])

  const share = async () => {
    if (!cardRef.current || !student) return
    setSharing(true)
    try {
      await downloadCardImage(cardRef.current, `${student.name.replace(/\s+/g, "_")}_ID_Card.png`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to share card")
    } finally {
      setSharing(false)
    }
  }

  return (
    <Dialog open={student !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Student ID Card</DialogTitle>
          <DialogDescription>{student?.name}</DialogDescription>
        </DialogHeader>
        {student && qrDataUrl && (
          <div className="flex flex-col items-center gap-4">
            {/* Card art is the club's Canva-designed template; only the fields
                below are overlaid. Positions are percentages derived from the
                template's native 1586x992 canvas, matching the Web app exactly. */}
            <div
              ref={cardRef}
              className="relative h-[53.54mm] w-[85.6mm] shrink-0 overflow-hidden rounded-2xl"
            >
              <img src="/id-card-template.png" alt="" className="absolute inset-0 h-full w-full object-cover" />

              <h4
                className="absolute font-bold text-[#14213D] uppercase leading-[1.05] line-clamp-2"
                style={{ left: "8%", top: "38%", width: "45%", height: "14%", fontSize: `${nameFontSize(student.name)}px` }}
              >
                {student.name}
              </h4>

              <p
                className="absolute flex items-center font-extrabold text-white uppercase tracking-wide"
                style={{ left: "8.5%", top: "52.3%", width: "30%", height: "7%", fontSize: "6.5px" }}
              >
                {typeof student.batchId === "object" && student.batchId ? student.batchId.name : "Scholarship Batch"}
              </p>

              <p
                className="absolute font-semibold text-gray-800"
                style={{ left: "28%", top: "69.5%", width: "35%", fontSize: "8px", transform: "translateY(-50%)" }}
              >
                {student.grade}
              </p>

              <p
                className="absolute font-semibold text-gray-800"
                style={{ left: "28%", top: "79.3%", width: "35%", fontSize: "8px", transform: "translateY(-50%)" }}
              >
                {student.guardianPhone}
              </p>

              <div
                className="absolute flex items-center justify-center"
                style={{ left: "66.9%", top: "25.7%", width: "25.5%", height: "37.8%" }}
              >
                <img src={qrDataUrl} alt="QR Code" className="h-auto w-[88%]" />
              </div>

              <p
                className="absolute text-center font-mono tracking-tight text-gray-500"
                style={{ left: "66.9%", top: "64.8%", width: "25.5%", fontSize: "7px" }}
              >
                {student.qrCode}
              </p>
            </div>

            <Button className="w-full" onClick={share} disabled={sharing}>
              {sharing ? <Spinner /> : <><ShareIcon data-icon="inline-start" />Save / Share</>}
            </Button>
          </div>
        )}
      </DialogContent>
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Failed to share card" description={error ?? undefined} tone="danger" />
    </Dialog>
  )
}
