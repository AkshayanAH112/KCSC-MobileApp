import { useEffect, useState } from "react"
import { ClipboardListIcon, SendIcon } from "lucide-react"

import { api, type Batch, type Student } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

export default function MarksPage() {
  const [grade, setGrade] = useState("3")
  const [subject, setSubject] = useState("")
  const [examDate, setExamDate] = useState("")
  const [maxMarks, setMaxMarks] = useState(100)

  // A grade can have more than one active batch at once (e.g. a new intake
  // starting while an older one is still running) — grade alone doesn't
  // uniquely scope an exam roster, same fix as the web Marks page.
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchId, setBatchId] = useState("")
  const gradeBatches = batches.filter((b) => b.grades.includes(Number(grade) as 3 | 4 | 5))

  useEffect(() => {
    api.batches().then((d) => setBatches(d.batches))
  }, [])

  useEffect(() => {
    setBatchId(gradeBatches[0]?._id ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, batches])

  const [students, setStudents] = useState<Student[]>([])
  const [entries, setEntries] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    kind: "error" | "success"
  } | null>(null)

  const loadStudents = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const d = await api.students({ grade, batchId: batchId || undefined })
      setStudents(d.students)
      setEntries({})
      if (d.students.length === 0) {
        setMessage({ text: `No students found in Grade ${grade}.`, kind: "error" })
      }
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Failed to load students",
        kind: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    const payload = students
      .filter((s) => entries[s._id] !== undefined && entries[s._id] !== "")
      .map((s) => ({
        studentId: s._id,
        subject,
        examDate,
        marks: Number(entries[s._id]),
        maxMarks,
        grade: Number(grade),
        batchId: batchId || undefined,
      }))
    if (payload.length === 0) {
      setMessage({ text: "Enter marks for at least one student.", kind: "error" })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await api.saveMarks(payload)
      setMessage({
        text: `Saved ${res.count} records — SMS notifications sent to guardians.`,
        kind: "success",
      })
      setStudents([])
      setEntries({})
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Failed to save marks",
        kind: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const formReady = subject.trim() !== "" && examDate !== "" && maxMarks > 0

  return (
    <div className="space-y-4">
      <PageHeader
        title="Marks & Reporting"
        description="Record exam scores — guardians get an SMS instantly."
      />

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>
            Set the exam first, then load the class list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="grade">Target Grade</Label>
              <Select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch">Batch</Label>
              <Select
                id="batch"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
              >
                {gradeBatches.length === 0 && <option value="">No batches for this grade</option>}
                {gradeBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="examDate">Exam Date</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxMarks">Maximum Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g. Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            variant="outline"
            onClick={loadStudents}
            disabled={loading || !formReady}
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                <ClipboardListIcon data-icon="inline-start" />
                Load Grade {grade} Students
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {message && (
        <div
          className={
            message.kind === "success"
              ? "rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {message.text}
        </div>
      )}

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {subject} — {students.length} students
            </CardTitle>
            <CardDescription>
              Marks out of {maxMarks}. Leave blank to skip a student.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  {s.name}
                </p>
                <Input
                  type="number"
                  min={0}
                  max={maxMarks}
                  inputMode="numeric"
                  placeholder="—"
                  className="w-20 text-center"
                  value={entries[s._id] ?? ""}
                  onChange={(e) =>
                    setEntries({ ...entries, [s._id]: e.target.value })
                  }
                />
              </div>
            ))}
            <Button
              size="lg"
              className="mt-2 w-full"
              onClick={submit}
              disabled={saving}
            >
              {saving ? (
                <Spinner />
              ) : (
                <>
                  <SendIcon data-icon="inline-start" />
                  Save & Send SMS
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
