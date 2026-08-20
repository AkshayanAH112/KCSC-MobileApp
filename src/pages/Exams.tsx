import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { GraduationCapIcon, PlusIcon } from "lucide-react"

import { api, type Batch, type Exam } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { AlertModal } from "@/components/confirm-dialog"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export default function ExamsPage() {
  const navigate = useNavigate()
  const [exams, setExams] = useState<Exam[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [e, b] = await Promise.all([api.exams(), api.batches()])
      setExams(e.exams)
      setBatches(b.batches)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exams"
        description="Create an exam, then add or review marks anytime."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <GraduationCapIcon className="size-8 opacity-50" />
            No exams created yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Card
              key={exam._id}
              className="cursor-pointer py-4 transition-colors active:bg-muted/50"
              onClick={() => navigate(`/exams/${exam._id}`)}
            >
              <CardContent className="px-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-semibold">
                    {exam.name ? `${exam.subject} — ${exam.name}` : exam.subject}
                  </p>
                  <Badge variant="secondary">Grade {exam.grade}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {typeof exam.batchId === "object" ? exam.batchId.name : ""} ·{" "}
                  {new Date(exam.examDate).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{exam.resultsCount} recorded</span>
                  {exam.averagePercent !== null ? (
                    <Badge variant="outline">{exam.averagePercent}% avg</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No marks yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {createOpen && (
        <NewExamDialog
          batches={batches}
          onClose={() => setCreateOpen(false)}
          onCreated={(examId) => {
            setCreateOpen(false)
            navigate(`/exams/${examId}`)
          }}
        />
      )}
    </div>
  )
}

function NewExamDialog({
  batches,
  onClose,
  onCreated,
}: {
  batches: Batch[]
  onClose: () => void
  onCreated: (examId: string) => void
}) {
  const gradeBatches = (grade: string) => batches.filter((b) => b.grades.includes(Number(grade) as 3 | 4 | 5))

  const [grade, setGrade] = useState("3")
  const [batchId, setBatchId] = useState(gradeBatches("3")[0]?._id ?? "")
  const [subject, setSubject] = useState("")
  const [name, setName] = useState("")
  const [maxMarks, setMaxMarks] = useState(100)
  const [examDate, setExamDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGradeChange = (g: string) => {
    setGrade(g)
    setBatchId(gradeBatches(g)[0]?._id ?? "")
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.createExam({
        subject,
        grade: Number(grade),
        batchId,
        examDate,
        maxMarks,
        name: name || undefined,
      })
      onCreated(res.exam._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="examGrade">Grade</Label>
              <Select id="examGrade" value={grade} onChange={(e) => handleGradeChange(e.target.value)}>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="examBatch">Batch</Label>
              <Select id="examBatch" required value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                {gradeBatches(grade).length === 0 && <option value="">No batches for this grade</option>}
                {gradeBatches(grade).map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="examDate">Exam Date</Label>
            <Input id="examDate" type="date" required value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="examSubject">Subject</Label>
            <Input
              id="examSubject"
              required
              placeholder="e.g. Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="examMax">Max Marks</Label>
              <Input
                id="examMax"
                type="number"
                min={1}
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="examName">Label (optional)</Label>
              <Input id="examName" placeholder="e.g. Mid-term" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !batchId}>
              {saving ? <Spinner /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Failed to create exam" description={error ?? undefined} tone="danger" />
    </Dialog>
  )
}
