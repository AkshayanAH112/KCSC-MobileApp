import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, ChevronRightIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { api, ApiError, type Batch, type ClassSession } from "@/lib/api"
import { ConfirmDialog, AlertModal } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    if (!id) return
    api
      .batchDetail(id)
      .then((d) => {
        setBatch(d.batch)
        setClasses(d.classes)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async () => {
    if (!id || !batch) return
    setConfirmDeleteOpen(false)
    try {
      await api.deleteBatch(id)
      navigate("/batches", { replace: true })
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
  if (!batch) {
    return (
      <p className="p-12 text-center text-sm text-muted-foreground">
        Batch not found
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg">{batch.name}</CardTitle>
              <CardDescription>Year {batch.year}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" aria-label="Edit batch" onClick={() => setEditOpen(true)}>
                <PencilIcon />
              </Button>
              <Button variant="outline" size="icon" aria-label="Delete batch" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {batch.grades?.map((g) => (
              <Badge key={g} variant="secondary">
                Grade {g}
              </Badge>
            ))}
            {batch.autoPromote && <Badge variant="secondary">Auto-promotes</Badge>}
          </div>
        </CardHeader>
      </Card>

      <h2 className="font-heading font-semibold">
        Class Sessions ({classes.length})
      </h2>

      <div className="space-y-3">
        {classes.length === 0 && (
          <Card className="py-10">
            <CardContent className="text-center text-sm text-muted-foreground">
              No classes scheduled for this batch yet.
            </CardContent>
          </Card>
        )}
        {classes.map((c) => (
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

      {editOpen && (
        <EditBatchDialog
          batch={batch}
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
        title="Delete this batch?"
        description={batch ? `Delete "${batch.name}"? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        tone="danger"
      />
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Failed to delete" description={error ?? undefined} tone="danger" />
    </div>
  )
}

function EditBatchDialog({
  batch,
  onClose,
  onSaved,
}: {
  batch: Batch
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({ name: batch.name, year: batch.year, grades: [...batch.grades] as number[], autoPromote: Boolean(batch.autoPromote) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleGrade = (g: number) => {
    setForm((prev) => ({
      ...prev,
      grades: prev.grades.includes(g) ? prev.grades.filter((x) => x !== g) : [...prev.grades, g].sort(),
    }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateBatch(batch._id, form)
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
          <DialogTitle>Edit Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="editBatchName">Batch Name</Label>
            <Input id="editBatchName" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editBatchYear">Year</Label>
            <Input
              id="editBatchYear"
              type="number"
              required
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Grades Covered</Label>
            <div className="flex items-center gap-1.5">
              {[3, 4, 5].map((g) => (
                <Badge
                  key={g}
                  variant={form.grades.includes(g) ? "default" : "outline"}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer px-3 py-1 text-sm"
                  onClick={() => toggleGrade(g)}
                >
                  Grade {g}
                </Badge>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.autoPromote}
              onChange={(e) => setForm({ ...form, autoPromote: e.target.checked })}
            />
            Automatically promote students to the next grade each January
            (same students continue into next year&apos;s grade in this
            batch).
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || form.grades.length === 0}>
              {saving ? <Spinner /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Failed to save" description={error ?? undefined} tone="danger" />
    </Dialog>
  )
}
