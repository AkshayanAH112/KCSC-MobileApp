import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Html5Qrcode } from "html5-qrcode"
import { AlertTriangleIcon, SaveIcon, SearchIcon, UserSearchIcon } from "lucide-react"

import { api, type ClassSession, type Student } from "@/lib/api"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

type Mode = "attendance" | "lookup"

export default function ScannerPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("attendance")
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null)
  const [message, setMessage] = useState<{
    text: string
    kind: "error" | "success"
  } | null>(null)

  const [isPresent, setIsPresent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [findingStudent, setFindingStudent] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastCode = useRef<string | null>(null)
  const selectedClassRef = useRef(selectedClass)
  selectedClassRef.current = selectedClass
  const modeRef = useRef(mode)
  modeRef.current = mode

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
        setIsPresent(true)
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
    const scanner = new Html5Qrcode("qr-reader")
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
  }, [mode, selectedClass, lookup])

  const submit = async () => {
    if (!student || !selectedClass) return
    setSubmitting(true)
    try {
      await api.saveAttendance({
        studentId: student._id,
        classId: selectedClass,
        present: isPresent,
      })
      setStudent(null)
      lastCode.current = null
      setManualCode("")
      setMessage({ text: "Attendance saved successfully!", kind: "success" })
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

  const switchMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    setStudent(null)
    setMessage(null)
    setManualCode("")
    lastCode.current = null
  }

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
          <Label htmlFor="session">Active Class Session</Label>
          <Select
            id="session"
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
          id="qr-reader"
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

      {mode === "attendance" && student && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{student.name}</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <span className="text-sm font-medium">Mark Present?</span>
              <Switch
                checked={isPresent}
                onCheckedChange={(checked) => setIsPresent(checked)}
              />
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? (
                <Spinner />
              ) : (
                <>
                  <SaveIcon data-icon="inline-start" />
                  Confirm & Save
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
