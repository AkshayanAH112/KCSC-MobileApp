import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarPlusIcon, ChevronRightIcon, PlusIcon } from "lucide-react"

import { api, type Batch, type ClassSession } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export default function BatchesPage() {
  const navigate = useNavigate()
  const [batches, setBatches] = useState<Batch[]>([])
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)

  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchForm, setBatchForm] = useState({
    name: "",
    year: new Date().getFullYear(),
  })

  const [classOpen, setClassOpen] = useState(false)
  const [classSaving, setClassSaving] = useState(false)
  const [classForm, setClassForm] = useState({
    batchId: "",
    grade: "3",
    date: "",
    time: "",
    subject: "",
  })

  const fetchData = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([api.batches(), api.classes()])
      setBatches(b.batches)
      setClasses(c.classes)
      if (b.batches.length > 0) {
        setClassForm((prev) =>
          prev.batchId ? prev : { ...prev, batchId: b.batches[0]._id }
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setBatchSaving(true)
    try {
      await api.createBatch({ ...batchForm, grades: [3, 4, 5] })
      setBatchOpen(false)
      setBatchForm({ name: "", year: new Date().getFullYear() })
      fetchData()
    } finally {
      setBatchSaving(false)
    }
  }

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setClassSaving(true)
    try {
      await api.createClass({
        ...classForm,
        grade: Number(classForm.grade),
      })
      setClassOpen(false)
      fetchData()
    } finally {
      setClassSaving(false)
    }
  }

  const recentClasses = classes.slice(0, 8)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Batches & Classes"
        description="Manage student batches and class sessions."
        action={
          <Button onClick={() => setBatchOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Batch
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {batches.length === 0 && (
              <Card className="py-10">
                <CardContent className="text-center text-sm text-muted-foreground">
                  No batches yet. Create your first batch to get started.
                </CardContent>
              </Card>
            )}
            {batches.map((b) => (
              <Card
                key={b._id}
                className="cursor-pointer py-4 transition-colors active:bg-muted/50"
                onClick={() => navigate(`/batches/${b._id}`)}
              >
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.year}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {b.grades?.map((g) => (
                      <Badge key={g} variant="secondary">
                        G{g}
                      </Badge>
                    ))}
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <h2 className="font-heading font-semibold">Recent Classes</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClassOpen(true)}
              disabled={batches.length === 0}
            >
              <CalendarPlusIcon data-icon="inline-start" />
              New Class
            </Button>
          </div>

          <div className="space-y-3">
            {recentClasses.length === 0 && (
              <Card className="py-10">
                <CardContent className="text-center text-sm text-muted-foreground">
                  No class sessions scheduled yet.
                </CardContent>
              </Card>
            )}
            {recentClasses.map((c) => (
              <Card
                key={c._id}
                className="cursor-pointer py-4 transition-colors active:bg-muted/50"
                onClick={() => navigate(`/classes/${c._id}`)}
              >
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {c.subject || "General Session"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.date).toLocaleDateString()}
                      {c.time ? ` · ${c.time}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">Grade {c.grade}</Badge>
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* New batch dialog */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Batch</DialogTitle>
            <DialogDescription>
              A batch groups students for a school year.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createBatch} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="batchName">Batch Name</Label>
              <Input
                id="batchName"
                required
                placeholder="e.g. Morning Batch"
                value={batchForm.name}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batchYear">Year</Label>
              <Input
                id="batchYear"
                type="number"
                required
                value={batchForm.year}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, year: Number(e.target.value) })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBatchOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={batchSaving}>
                {batchSaving ? <Spinner /> : "Create Batch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New class dialog */}
      <Dialog open={classOpen} onOpenChange={setClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Class Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={createClass} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="classBatch">Batch</Label>
                <Select
                  id="classBatch"
                  required
                  value={classForm.batchId}
                  onChange={(e) =>
                    setClassForm({ ...classForm, batchId: e.target.value })
                  }
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="classGrade">Grade</Label>
                <Select
                  id="classGrade"
                  value={classForm.grade}
                  onChange={(e) =>
                    setClassForm({ ...classForm, grade: e.target.value })
                  }
                >
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="classDate">Date</Label>
                <Input
                  id="classDate"
                  type="date"
                  required
                  value={classForm.date}
                  onChange={(e) =>
                    setClassForm({ ...classForm, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="classTime">Time</Label>
                <Input
                  id="classTime"
                  type="time"
                  value={classForm.time}
                  onChange={(e) =>
                    setClassForm({ ...classForm, time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="classSubject">Subject</Label>
              <Input
                id="classSubject"
                placeholder="e.g. Mathematics"
                value={classForm.subject}
                onChange={(e) =>
                  setClassForm({ ...classForm, subject: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setClassOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={classSaving}>
                {classSaving ? <Spinner /> : "Schedule Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
