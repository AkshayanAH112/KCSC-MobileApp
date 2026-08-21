import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, PencilIcon, SearchIcon, Trash2Icon } from "lucide-react"

import { api, type Exam, type ExamRosterEntry } from "@/lib/api"
import { ConfirmDialog, AlertModal } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [roster, setRoster] = useState<ExamRosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [entries, setEntries] = useState<Record<string, string>>({})
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const d = await api.examDetail(id)
      setExam(d.exam)
      setRoster(d.roster)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveOne = async (studentId: string) => {
    if (!id) return
    const value = entries[studentId]
    if (value === undefined || value === "") return
    try {
      await api.saveExamMarks(id, { studentId, marks: Number(value) })
      setEntries((prev) => {
        const next = { ...prev }
        delete next[studentId]
        return next
      })
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    }
  }

  const toggleAbsent = async (studentId: string, isAbsent: boolean) => {
    if (!id) return
    try {
      await api.saveExamMarks(id, { studentId, isAbsent })
      setEntries((prev) => {
        const next = { ...prev }
        delete next[studentId]
        return next
      })
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setConfirmDeleteOpen(false)
    try {
      await api.deleteExam(id)
      navigate("/exams", { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }
  if (!exam) {
    return <p className="p-12 text-center text-sm text-muted-foreground">Exam not found</p>
  }

  const filtered = roster.filter((r) => r.student.name.toLowerCase().includes(search.toLowerCase()))
  const recordedCount = roster.filter((r) => r.isRecorded).length

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Button>

      <Card className="py-4">
        <CardContent className="px-4">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary">Grade {exam.grade}</Badge>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" aria-label="Edit exam" onClick={() => setEditOpen(true)}>
                <PencilIcon />
              </Button>
              <Button variant="outline" size="icon" aria-label="Delete exam" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
          <h1 className="mt-2 font-heading text-lg font-bold">
            {exam.name ? `${exam.subject} — ${exam.name}` : exam.subject}
          </h1>
          <p className="text-sm text-muted-foreground">
            {typeof exam.batchId === "object" ? exam.batchId.name : ""} · {new Date(exam.examDate).toLocaleDateString()} · Out of{" "}
            {exam.maxMarks}
          </p>
          <div className="mt-3 rounded-xl bg-muted p-3 text-center">
            <p className="tabular text-xl font-bold">
              {recordedCount}
              <span className="text-sm font-normal text-muted-foreground">/{roster.length}</span>
            </p>
            <p className="text-xs font-medium text-muted-foreground uppercase">Recorded</p>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search roster…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="py-10">
            <CardContent className="text-center text-sm text-muted-foreground">
              {roster.length === 0
                ? `No Grade ${exam.grade} students are registered in ${typeof exam.batchId === "object" ? exam.batchId.name : "this batch"} yet.`
                : "No students match your search."}
            </CardContent>
          </Card>
        )}
        {filtered.map((r) => {
          const isAbsent = Boolean(r.mark?.isAbsent)
          return (
          <Card key={r.student._id} className="py-4">
            <CardContent className="flex items-center justify-between gap-3 px-4">
              <p className="min-w-0 flex-1 truncate font-semibold">{r.student.name}</p>
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`absent-${r.student._id}`} className="text-xs text-muted-foreground">
                  Absent
                </Label>
                <Switch
                  id={`absent-${r.student._id}`}
                  checked={isAbsent}
                  onCheckedChange={(checked) => toggleAbsent(r.student._id, checked)}
                />
              </div>
              {isAbsent ? (
                <span className="w-20 rounded-lg border border-dashed py-2 text-center text-xs font-bold uppercase text-muted-foreground">
                  Absent
                </span>
              ) : (
                <Input
                  type="number"
                  min={0}
                  max={exam.maxMarks}
                  inputMode="numeric"
                  placeholder={r.mark ? String(r.mark.marks) : "—"}
                  className="w-20 text-center"
                  value={entries[r.student._id] ?? ""}
                  onChange={(e) => setEntries({ ...entries, [r.student._id]: e.target.value })}
                  onBlur={() => saveOne(r.student._id)}
                />
              )}
            </CardContent>
          </Card>
          )
        })}
      </div>

      {editOpen && (
        <EditExamDialog
          exam={exam}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            fetchData()
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this exam?"
        description={`This will also delete its ${recordedCount} recorded mark(s). This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Something went wrong" description={error ?? undefined} tone="danger" />
    </div>
  )
}

function EditExamDialog({
  exam,
  onClose,
  onSaved,
}: {
  exam: Exam
  onClose: () => void
  onSaved: () => void
}) {
  const [subject, setSubject] = useState(exam.subject)
  const [name, setName] = useState(exam.name ?? "")
  const [maxMarks, setMaxMarks] = useState(exam.maxMarks)
  const [examDate, setExamDate] = useState(exam.examDate.slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateExam(exam._id, { subject, name: name || undefined, maxMarks, examDate })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="editExamSubject">Subject</Label>
            <Input id="editExamSubject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editExamName">Label (optional)</Label>
            <Input id="editExamName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editExamDate">Exam Date</Label>
              <Input id="editExamDate" type="date" required value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editExamMax">Max Marks</Label>
              <Input
                id="editExamMax"
                type="number"
                min={1}
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Changing Max Marks does not rescale marks already entered.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Failed to save" description={error ?? undefined} tone="danger" />
    </Dialog>
  )
}
