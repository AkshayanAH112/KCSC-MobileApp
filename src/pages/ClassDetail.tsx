import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  LockIcon,
  LockOpenIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react"

import { api, ApiError, type Batch, type ClassSession, type RosterEntry } from "@/lib/api"
import { cn } from "@/lib/utils"
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
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [classSession, setClassSession] = useState<ClassSession | null>(null)
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // End-of-class register close. The preview is fetched before the dialog shows
  // so the admin sees who is about to be marked absent — and who that pushes to
  // a 2nd/3rd leave — before anything is written.
  const [endPreview, setEndPreview] = useState<Awaited<
    ReturnType<typeof api.endClassPreview>
  > | null>(null)
  const [endOpen, setEndOpen] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endResult, setEndResult] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const d = await api.classDetail(id)
      setClassSession(d.classSession)
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

  const toggle = async (studentId: string, entry: RosterEntry) => {
    if (!id) return
    const present = !entry.isPresent

    setRoster((prev) =>
      prev.map((r) =>
        r.student._id === studentId
          ? { ...r, isPresent: present, isRecorded: true }
          : r
      )
    )
    try {
      await api.saveAttendance({ studentId, classId: id, present })
    } catch (e) {
      console.error("Failed to update attendance", e)
      fetchData()
    }
  }

  const openEndDialog = async () => {
    if (!id) return
    setEndPreview(null)
    setEndOpen(true)
    try {
      setEndPreview(await api.endClassPreview(id))
    } catch (e) {
      setEndOpen(false)
      setError(e instanceof Error ? e.message : "Could not load preview")
    }
  }

  const handleEndClass = async () => {
    if (!id) return
    setEnding(true)
    try {
      const d = await api.endClass(id)
      setEndResult(
        d.markedAbsentCount === 0
          ? "Class ended. Everyone was already marked, so no leaves were added."
          : `Class ended. ${d.markedAbsentCount} student${d.markedAbsentCount === 1 ? "" : "s"} marked absent` +
            (d.warningsRaised > 0
              ? `, raising ${d.warningsRaised} leave warning${d.warningsRaised === 1 ? "" : "s"}.`
              : ".")
      )
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not end class")
    } finally {
      setEnding(false)
      setEndOpen(false)
    }
  }

  const handleReopen = async () => {
    if (!id) return
    try {
      await api.reopenClass(id)
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reopen class")
    }
  }

  const handleDelete = async () => {
    if (!id || !classSession) return
    setConfirmDeleteOpen(false)
    try {
      await api.deleteClass(id)
      const batchId =
        typeof classSession.batchId === "object" ? classSession.batchId._id : classSession.batchId
      navigate(`/batches/${batchId}`, { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }
  if (!classSession) {
    return (
      <p className="p-12 text-center text-sm text-muted-foreground">
        Class not found
      </p>
    )
  }

  const filtered = roster.filter((r) =>
    r.student.name.toLowerCase().includes(search.toLowerCase())
  )
  const presentCount = roster.filter((r) => r.isPresent).length
  // Explicitly marked absent, which is what actually becomes a leave — as
  // opposed to never scanned at all, which is counted separately. Collapsing
  // the two is what made the dashboard look self-contradictory.
  const absentCount = roster.filter((r) => r.isRecorded && !r.isPresent).length
  const unmarkedCount = roster.filter((r) => !r.isRecorded).length

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Button>

      <Card className="py-4">
        <CardContent className="px-4">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary">Grade {classSession.grade}</Badge>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" aria-label="Edit class" onClick={() => setEditOpen(true)}>
                <PencilIcon />
              </Button>
              <Button variant="outline" size="icon" aria-label="Delete class" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
          <h1 className="mt-2 font-heading text-lg font-bold">
            {classSession.subject || "General Session"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(classSession.date).toDateString()}
            {classSession.time ? ` at ${classSession.time}` : ""}
          </p>
          <div className={cn("mt-3 grid gap-3", unmarkedCount > 0 ? "grid-cols-3" : "grid-cols-2")}>
            <div className="rounded-xl bg-muted p-3 text-center">
              <p className="text-xl font-bold">
                {presentCount}
                <span className="text-sm font-normal text-muted-foreground">
                  /{roster.length}
                </span>
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Present
              </p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <p className="tabular text-xl font-bold">{absentCount}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Absent
              </p>
            </div>
            {unmarkedCount > 0 && (
              <div className="rounded-xl bg-warning/10 p-3 text-center">
                <p className="tabular text-xl font-bold text-warning">{unmarkedCount}</p>
                <p className="text-xs font-medium text-warning uppercase">
                  Unmarked
                </p>
              </div>
            )}
          </div>

          {/* Closing the register turns no-shows into real leaves. Without it
              they only ever drag the attendance percentage down silently. */}
          {classSession.endedAt ? (
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleReopen}>
              <LockOpenIcon data-icon="inline-start" />
              Register closed — reopen
            </Button>
          ) : (
            <Button size="sm" className="mt-3 w-full" onClick={openEndDialog}>
              <LockIcon data-icon="inline-start" />
              End class
              {unmarkedCount > 0 ? ` — mark ${unmarkedCount} absent` : ""}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search roster…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="py-10">
            <CardContent className="text-center text-sm text-muted-foreground">
              No students found.
            </CardContent>
          </Card>
        )}
        {filtered.map((r) => (
          <Card key={r.student._id} className="py-4">
            <CardContent className="px-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate font-semibold">
                  {r.student.name}
                </p>
                <p className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {r.student.qrCode}
                </p>
              </div>
              <button
                onClick={() => toggle(r.student._id, r)}
                aria-pressed={r.isPresent}
                className={cn(
                  "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  r.isPresent
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {r.isPresent ? (
                  <CheckCircle2Icon className="size-4" />
                ) : (
                  <XCircleIcon className="size-4" />
                )}
                {r.isPresent ? "Present" : "Absent"}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {editOpen && (
        <EditClassDialog
          classSession={classSession}
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
        title="Delete this class session?"
        description="This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
      />
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Failed to delete" description={error ?? undefined} tone="danger" />

      <Dialog open={endOpen} onOpenChange={(open) => !open && setEndOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>End class?</DialogTitle>
          </DialogHeader>
          {!endPreview ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Checking who is unmarked...
            </div>
          ) : endPreview.unmarkedCount === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Everyone on this roster is already marked. Ending the class will not add any leaves.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                These {endPreview.unmarkedCount} student
                {endPreview.unmarkedCount === 1 ? "" : "s"} will be marked absent, which counts as a leave:
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border bg-muted/40 p-3 text-sm">
                {endPreview.unmarked.map((s) => {
                  const next = (s.currentLeaveCycle ?? 0) + 1
                  return (
                    <li key={s._id} className="flex items-center justify-between gap-2 py-0.5">
                      <span>{s.name}</span>
                      {(next === 2 || next === 3) && (
                        <Badge variant="destructive" className="shrink-0">
                          <AlertTriangleIcon />
                          reaches {next}
                        </Badge>
                      )}
                    </li>
                  )
                })}
              </ul>
              <p className="text-xs text-muted-foreground">
                2 leaves raises a parent warning, 3 an admin-critical alert. You can still correct
                anyone afterwards by toggling them back to present.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndClass} disabled={ending || !endPreview}>
              {ending ? (
                <Spinner />
              ) : endPreview && endPreview.unmarkedCount > 0 ? (
                `Mark ${endPreview.unmarkedCount} absent`
              ) : (
                "End class"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertModal
        open={endResult !== null}
        onClose={() => setEndResult(null)}
        title="Register closed"
        description={endResult ?? undefined}
      />
    </div>
  )
}

function EditClassDialog({
  classSession,
  onClose,
  onSaved,
}: {
  classSession: ClassSession
  onClose: () => void
  onSaved: () => void
}) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [form, setForm] = useState({
    batchId: typeof classSession.batchId === "object" ? classSession.batchId._id : classSession.batchId,
    grade: String(classSession.grade),
    date: classSession.date.slice(0, 10),
    time: classSession.time ?? "",
    subject: classSession.subject ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.batches().then((d) => setBatches(d.batches))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateClass(classSession._id, { ...form, grade: Number(form.grade) })
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
          <DialogTitle>Edit Class Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editClassBatch">Batch</Label>
              <Select id="editClassBatch" required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editClassGrade">Grade</Label>
              <Select id="editClassGrade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editClassDate">Date</Label>
              <Input id="editClassDate" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editClassTime">Time</Label>
              <Input id="editClassTime" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editClassSubject">Subject</Label>
            <Input id="editClassSubject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
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
