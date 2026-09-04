import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Html5Qrcode } from "html5-qrcode"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  SaveIcon,
  SearchIcon,
  UserSearchIcon,
  XCircleIcon,
} from "lucide-react"

import { api, type ClassSession, type Student } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ScannerMode = "attendance" | "lookup"

/**
 * The whole scanning experience — mode switch, class picker, camera, manual
 * entry and the attendance form — with no page chrome of its own.
 *
 * Lives here rather than in the Scanner page because it is rendered in two
 * places: that page, and the quick-scan sheet on the Dashboard. Keeping one
 * implementation means the camera lifecycle, the duplicate-scan guard and the
 * attendance flow cannot drift apart between them.
 */
export function QrScannerPanel({
  onModeChange,
  onScanComplete,
}: {
  /** Lets a host render its own heading text for the current mode. */
  onModeChange?: (mode: ScannerMode) => void
  /** Fired after a scan is fully dealt with, so a sheet host can close itself. */
  onScanComplete?: () => void
}) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<ScannerMode>("attendance")
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null)
  const [message, setMessage] = useState<{
    text: string
    kind: "error" | "success"
  } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [findingStudent, setFindingStudent] = useState(false)

  // html5-qrcode mounts into an element looked up by id, so the id has to be
  // unique per instance — a fixed "qr-reader" would have the page and the
  // sheet fight over the same node if both were ever mounted at once. The
  // colons React puts in useId() are stripped; they are legal in an id but
  // break any selector-based lookup.
  const readerId = `qr-reader-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastCode = useRef<string | null>(null)
  const selectedClassRef = useRef(selectedClass)
  selectedClassRef.current = selectedClass
  const modeRef = useRef(mode)
  modeRef.current = mode
  const onScanCompleteRef = useRef(onScanComplete)
  onScanCompleteRef.current = onScanComplete

  useEffect(() => {
    api.classes().then((d) => {
      setClasses(d.classes)
      if (d.classes.length > 0) setSelectedClass(d.classes[0]._id)
    })
  }, [])

  const lookup = useCallback(
    async (qrCode: string) => {
      if (!qrCode || lastCode.current === qrCode) return
      if (modeRef.current === "attendance" && !selectedClassRef.current) return
      lastCode.current = qrCode
      setMessage(null)

      if (modeRef.current === "lookup") {
        setFindingStudent(true)
        try {
          const data = await api.lookupStudent(qrCode)
          onScanCompleteRef.current?.()
          navigate(`/students/${data.student._id}`)
        } catch (e) {
          setMessage({
            text: e instanceof Error ? e.message : "Lookup failed",
            kind: "error",
          })
          lastCode.current = null
        } finally {
          setFindingStudent(false)
        }
        return
      }

      setStudent(null)
      try {
        const data = await api.lookupStudent(qrCode, selectedClassRef.current)
        setStudent(data.student)
        setAttendanceRate(data.attendanceRate)
      } catch (e) {
        setMessage({
          text: e instanceof Error ? e.message : "Lookup failed",
          kind: "error",
        })
        lastCode.current = null
      }
    },
    [navigate]
  )

  // Start/stop the camera scanner. In "Find Student" mode it mounts
  // immediately; in "Mark Attendance" mode it waits for a class to be picked.
  useEffect(() => {
    if (mode === "attendance" && !selectedClass) return
    const scanner = new Html5Qrcode(readerId)
    scannerRef.current = scanner
    let stopped = false

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => lookup(decodedText),
        () => {
          /* per-frame decode misses are expected */
        }
      )
      .catch((e) => {
        if (!stopped) {
          setMessage({
            text: `Camera unavailable: ${e?.message ?? e}. Use manual entry below.`,
            kind: "error",
          })
        }
      })

    return () => {
      stopped = true
      if (scanner.isScanning) {
        scanner.stop().catch(() => {})
      }
      scannerRef.current = null
    }
  }, [mode, selectedClass, lookup, readerId])

  // `present` comes from whichever button was pressed rather than from state:
  // the dialog offers Present and Absent as two explicit actions, so there is
  // no default sitting around to be submitted by accident.
  const submit = async (present: boolean) => {
    if (!student || !selectedClass) return
    const studentName = student.name
    setSubmitting(true)
    try {
      await api.saveAttendance({
        studentId: student._id,
        classId: selectedClass,
        present,
      })
      setStudent(null)
      lastCode.current = null
      setManualCode("")
      setMessage({
        text: `${studentName} marked ${present ? "present" : "absent"}.`,
        kind: "success",
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Failed to save",
        kind: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = (next: ScannerMode) => {
    if (next === mode) return
    setMode(next)
    onModeChange?.(next)
    setStudent(null)
    setMessage(null)
    setManualCode("")
    lastCode.current = null
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => switchMode("attendance")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
            mode === "attendance"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <SaveIcon className="size-4" />
          Mark Attendance
        </button>
        <button
          onClick={() => switchMode("lookup")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
            mode === "lookup"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <UserSearchIcon className="size-4" />
          Find Student
        </button>
      </div>

      {mode === "attendance" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${readerId}-session`}>Active Class Session</Label>
          <Select
            id={`${readerId}-session`}
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value)
              setStudent(null)
              lastCode.current = null
            }}
          >
            <option value="" disabled>
              Select a class…
            </option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                Grade {c.grade} - {c.subject || "Session"} (
                {new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </Select>
        </div>
      )}

      {mode === "attendance" && !selectedClass ? (
        <Card className="py-10">
          <CardContent className="text-center text-sm text-muted-foreground">
            Please select a class session first.
          </CardContent>
        </Card>
      ) : (
        <div
          id={readerId}
          className="w-full overflow-hidden rounded-xl border bg-black"
        />
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Enter QR code manually"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(manualCode)}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="Look up code"
          disabled={findingStudent}
          onClick={() => lookup(manualCode)}
        >
          {findingStudent ? <Spinner /> : <SearchIcon />}
        </Button>
      </div>

      {message && (
        <div
          className={
            message.kind === "success"
              ? "rounded-lg bg-success/10 p-3 text-sm text-success"
              : "rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {message.text}
        </div>
      )}

      {/* The result is a dialog, not a card under the camera: on a phone that
          card renders below the viewfinder, so whoever is scanning has to
          scroll away from the camera to confirm each student and back again for
          the next one. With a queue of students that is the slowest part of the
          flow. */}
      <Dialog
        open={mode === "attendance" && student !== null}
        onOpenChange={(open) => !open && setStudent(null)}
      >
        <DialogContent className="max-w-sm">
          {student && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{student.name}</DialogTitle>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant="secondary">Grade {student.grade}</Badge>
                  {attendanceRate !== null && attendanceRate < 75 && (
                    <Badge variant="destructive">
                      <AlertTriangleIcon />
                      {attendanceRate}% attendance
                    </Badge>
                  )}
                </div>
                <p className="pt-1 text-sm text-muted-foreground">
                  Guardian: {student.guardianName} ({student.guardianPhone})
                </p>
              </DialogHeader>

              {/* Two explicit actions rather than a toggle plus a save: at the
                  moment of a scan the choice IS present-or-absent, and a toggle
                  left on its default is the easiest way to record the wrong one. */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => submit(false)}
                  disabled={submitting}
                >
                  <XCircleIcon data-icon="inline-start" />
                  Absent
                </Button>
                <Button size="lg" onClick={() => submit(true)} disabled={submitting}>
                  {submitting ? (
                    <Spinner />
                  ) : (
                    <>
                      <CheckCircle2Icon data-icon="inline-start" />
                      Present
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
