import { useCallback, useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { PlusIcon, QrCodeIcon, SearchIcon } from "lucide-react"

import { api, type Batch, type Student } from "@/lib/api"
import { isValidPhoneLocal, PHONE_HINT } from "@/lib/phone"
import { PageHeader } from "@/components/page-header"
import { StudentIdDialog } from "@/components/student-id-dialog"
import { AlertModal } from "@/components/confirm-dialog"
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

const emptyForm = {
  name: "",
  school: "",
  address: "",
  guardianName: "",
  guardianPhone: "",
  batchId: "",
  grade: "3",
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterBatch, setFilterBatch] = useState("")
  const [filterGrade, setFilterGrade] = useState(searchParams.get("grade") ?? "")

  const [registerOpen, setRegisterOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [qrStudent, setQrStudent] = useState<Student | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([api.students(), api.batches()])
      setStudents(s.students)
      setBatches(b.batches)
      if (b.batches.length > 0) {
        setForm((prev) =>
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPhoneLocal(form.guardianPhone)) {
      setPhoneError(PHONE_HINT)
      return
    }
    setPhoneError(null)
    setSaving(true)
    try {
      await api.createStudent({ ...form, grade: Number(form.grade) })
      setRegisterOpen(false)
      setForm({ ...emptyForm, batchId: batches[0]?._id ?? "" })
      fetchData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to register student")
    } finally {
      setSaving(false)
    }
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterBatch === "" ||
        (typeof s.batchId === "object" && s.batchId?._id === filterBatch)) &&
      (filterGrade === "" || String(s.grade) === filterGrade)
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        description="Register students and view QR ID cards."
        action={
          <Button onClick={() => setRegisterOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Register
          </Button>
        }
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          className="w-28"
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
        >
          <option value="">All Grades</option>
          <option value="3">Grade 3</option>
          <option value="4">Grade 4</option>
          <option value="5">Grade 5</option>
        </Select>
        <Select
          className="w-36"
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name} ({b.year})
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-sm text-muted-foreground">
            {students.length === 0
              ? "No students registered yet."
              : "No students match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card
              key={s._id}
              className="cursor-pointer py-4 transition-colors active:bg-muted/50"
              onClick={() => navigate(`/students/${s._id}`)}
            >
              <CardContent className="flex items-center gap-3 px-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-semibold">{s.name}</p>
                    {s.isActive === false && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                  <p className="truncate text-xs font-mono text-muted-foreground">
                    {s.registrationNumber ?? "—"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant="secondary">Grade {s.grade}</Badge>
                    <Badge variant="outline">
                      {typeof s.batchId === "object" && s.batchId
                        ? s.batchId.name
                        : "No Batch"}
                    </Badge>
                    {(s.currentLeaveCycle ?? 0) >= 2 && (
                      <Badge variant={s.currentLeaveCycle! >= 3 ? "destructive" : "secondary"}>
                        Cycle {s.currentLeaveCycle}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Show QR ID"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    setQrStudent(s)
                  }}
                >
                  <QrCodeIcon />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Register dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Student</DialogTitle>
            <DialogDescription>
              A unique QR code is generated automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                required
                value={form.guardianName}
                onChange={(e) =>
                  setForm({ ...form, guardianName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guardianPhone">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                type="tel"
                required
                aria-invalid={!!phoneError}
                placeholder="e.g. 0701212234"
                value={form.guardianPhone}
                onChange={(e) => {
                  setForm({ ...form, guardianPhone: e.target.value })
                  if (phoneError) setPhoneError(null)
                }}
                onBlur={(e) =>
                  setPhoneError(e.target.value && !isValidPhoneLocal(e.target.value) ? PHONE_HINT : null)
                }
              />
              {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="batch">Batch</Label>
                <Select
                  id="batch"
                  required
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.year})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  id="grade"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                >
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setRegisterOpen(false); setPhoneError(null) }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner /> : "Create & Generate QR"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StudentIdDialog student={qrStudent} onClose={() => setQrStudent(null)} />
      <AlertModal open={formError !== null} onClose={() => setFormError(null)} title="Failed to register student" description={formError ?? undefined} tone="danger" />
    </div>
  )
}
