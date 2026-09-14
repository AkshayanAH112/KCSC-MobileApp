import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CalendarXIcon,
  GlobeIcon,
  LockIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  TrophyIcon,
} from "lucide-react"

import { api, type Exam, type ExamAttendanceContext, type ExamRosterEntry } from "@/lib/api"
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
  const [attendance, setAttendance] = useState<ExamAttendanceContext | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  // Hints the user has waved off. A hint is not a Marks row, so there is nothing
  // to delete when one is dismissed — it just stops being offered until reload.
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set())
  const [applyingHints, setApplyingHints] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const d = await api.examDetail(id)
      setExam(d.exam)
      setRoster(d.roster)
      setAttendance(d.attendance ?? null)
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

  const toggleAbsent = async (studentId: string, isAbsent: boolean, isHint = false) => {
    if (!id) return
    // Un-ticking a pre-ticked hint is not an edit — there is no Marks row behind
    // it yet. Just stop offering it, rather than writing a "present" record for
    // a student nobody has entered a mark for.
    if (isHint && !isAbsent) {
      setDismissedHints((prev) => new Set(prev).add(studentId))
      return
    }
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

  /**
   * Writes the outstanding absence hints as real Marks rows, in one request.
   * The only thing that turns a hint into a record — opening the exam never
   * does, because only staff can confirm that a student missed the paper and
   * not merely the class.
   */
  const applyAbsenceHints = async (studentIds: string[]) => {
    if (!id || studentIds.length === 0) return
    setApplyingHints(true)
    try {
      await api.saveExamMarksBulk(
        id,
        studentIds.map((studentId) => ({ studentId, isAbsent: true }))
      )
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record absences")
    } finally {
      setApplyingHints(false)
    }
  }

  // Flips Exam.isPublished, the gate on the public /results lookup. Nothing else
  // about the exam changes — the roster stays editable after publishing, and a
  // correction made later is live the moment it is saved.
  const togglePublish = async () => {
    if (!id || !exam) return
    setPublishing(true)
    try {
      await api.updateExam(id, { isPublished: !exam.isPublished })
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setPublishing(false)
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

  const recordedCount = roster.filter((r) => r.isRecorded).length

  // Hints still on offer: suggested by the register, not yet waved off, and not
  // already overridden by a mark (the API stops suggesting once one exists).
  const pendingHints = roster.filter(
    (r) => r.suggestedAbsent && !dismissedHints.has(r.student._id)
  )

  const { rankByStudentId, rankedRoster } = buildRanking(roster)

  const query = search.trim().toLowerCase()
  const filtered = rankedRoster.filter(
    (r) =>
      r.student.name.toLowerCase().includes(query) ||
      (r.student.registrationNumber ?? "").toLowerCase().includes(query)
  )

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

      {/* The gate on the public /results page. Unpublished is the default and the
          safe state: marks are typed and corrected over several days, and this is
          what keeps a half-entered exam off the public site meanwhile. */}
      <Card className={exam.isPublished ? "border-primary/30 bg-primary/5 py-4" : "py-4"}>
        <CardContent className="space-y-3 px-4">
          <div className="flex items-start gap-2.5">
            {exam.isPublished ? (
              <GlobeIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {exam.isPublished ? "Results are public" : "Results are not public"}
              </p>
              <p className="text-xs text-muted-foreground">
                {exam.isPublished
                  ? "Anyone with a student's registration number can see these marks on the public Results page."
                  : "Nothing here is visible on the public site yet. Publish once every mark is entered and checked."}
              </p>
            </div>
          </div>
          <Button
            variant={exam.isPublished ? "outline" : "default"}
            className="w-full"
            disabled={publishing}
            onClick={togglePublish}
          >
            {publishing ? (
              <Spinner />
            ) : exam.isPublished ? (
              <>
                <LockIcon data-icon="inline-start" /> Unpublish
              </>
            ) : (
              <>
                <GlobeIcon data-icon="inline-start" /> Publish Results
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Carried over from the class register for this exam's date. Only an
          explicitly marked absence produces a hint — a student with no
          attendance row at all is "not marked", not absent, so a register that
          was never closed leaves this off entirely. */}
      {pendingHints.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 py-4">
          <CardContent className="space-y-3 px-4">
            <div className="flex items-start gap-2.5">
              <CalendarXIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {pendingHints.length} student{pendingHints.length === 1 ? " was" : "s were"} marked
                  absent in class on {new Date(exam.examDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Their Absent switches are pre-set below. Nothing is saved until you apply them —
                  turn off anyone who sat the paper anyway.
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={applyingHints}
              onClick={() => applyAbsenceHints(pendingHints.map((r) => r.student._id))}
            >
              {applyingHints ? <Spinner /> : `Mark ${pendingHints.length} absent`}
            </Button>
          </CardContent>
        </Card>
      )}

      {attendance?.sessionCount === 0 && recordedCount === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          No class register was taken on {new Date(exam.examDate).toLocaleDateString()}, so no
          absences were carried over.
        </p>
      )}

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or index number…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          const isHinted = Boolean(r.suggestedAbsent) && !dismissedHints.has(r.student._id)
          // A hint shows as set but is not a record — see applyAbsenceHints.
          const isAbsent = Boolean(r.mark?.isAbsent) || isHinted
          const rank = rankByStudentId.get(r.student._id)
          return (
          <Card key={r.student._id} className={isHinted ? "border-warning/30 bg-warning/5 py-4" : "py-4"}>
            {/* Two rows, as on the class register: who, then the controls.
                Rank + name + index number + switch + input will not fit on one
                line at phone width without truncating the name to nothing. */}
            <CardContent className="px-4">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted tabular text-xs font-bold text-muted-foreground">
                  {rank === 1 ? <TrophyIcon className="size-3.5 text-warning" /> : (rank ?? "—")}
                </span>
                <p className="min-w-0 flex-1 truncate font-semibold">{r.student.name}</p>
                <p className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {r.student.registrationNumber ?? "—"}
                </p>
              </div>
              {isHinted && (
                <p className="mb-2 text-[10px] font-bold uppercase text-warning">Absent in class</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`absent-${r.student._id}`} className="text-xs text-muted-foreground">
                    Absent
                  </Label>
                  <Switch
                    id={`absent-${r.student._id}`}
                    checked={isAbsent}
                    onCheckedChange={(checked) => toggleAbsent(r.student._id, checked, isHinted)}
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
              </div>
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

/**
 * Standard competition ranking (1, 2, 2, 4) over the marks actually entered,
 * absentees excluded — the same rule the web console and /api/public/results
 * apply, so staff on either app and a parent never see three different ranks
 * for one exam.
 *
 * rankedRoster keys off the *saved* mark, not the value being typed: a row only
 * moves once its mark is committed on blur, so nothing jumps under the thumb
 * mid-entry. Students with no mark yet hold at the bottom, in the index-number
 * order the API returned them in, which is where entry happens.
 */
function buildRanking(roster: ExamRosterEntry[]) {
  const scored = roster
    .filter((r) => r.isRecorded && !r.mark!.isAbsent)
    .sort((a, b) => b.mark!.marks - a.mark!.marks)

  const rankByStudentId = new Map<string, number>()
  scored.forEach((r, i) => {
    const tiedWithPrevious = i > 0 && scored[i - 1].mark!.marks === r.mark!.marks
    rankByStudentId.set(
      r.student._id,
      tiedWithPrevious ? rankByStudentId.get(scored[i - 1].student._id)! : i + 1
    )
  })

  const rankedRoster = [...roster].sort((a, b) => {
    const group = (r: ExamRosterEntry) =>
      r.isRecorded && !r.mark!.isAbsent ? 0 : r.isRecorded ? 1 : 2
    if (group(a) !== group(b)) return group(a) - group(b)
    if (group(a) === 0) return b.mark!.marks - a.mark!.marks
    return 0 // already in index-number order from the API
  })

  return { scored, rankByStudentId, rankedRoster }
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
