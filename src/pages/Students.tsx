import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import QRCode from "qrcode"
import { PlusIcon, QrCodeIcon, SearchIcon } from "lucide-react"

import { api, type Batch, type Student } from "@/lib/api"
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

const emptyForm = {
  name: "",
  guardianName: "",
  guardianPhone: "",
  batchId: "",
  grade: "3",
  dateOfBirth: "",
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterBatch, setFilterBatch] = useState("")

  const [registerOpen, setRegisterOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [qrStudent, setQrStudent] = useState<Student | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState("")

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
    setSaving(true)
    try {
      await api.createStudent({ ...form, grade: Number(form.grade) })
      setRegisterOpen(false)
      setForm({ ...emptyForm, batchId: batches[0]?._id ?? "" })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const showQr = async (student: Student) => {
    const url = await QRCode.toDataURL(student.qrCode, { margin: 1, scale: 10 })
    setQrDataUrl(url)
    setQrStudent(student)
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterBatch === "" ||
        (typeof s.batchId === "object" && s.batchId?._id === filterBatch))
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
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.guardianName} · {s.guardianPhone}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant="secondary">Grade {s.grade}</Badge>
                    <Badge variant="outline">
                      {typeof s.batchId === "object" && s.batchId
                        ? s.batchId.name
                        : "No Batch"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Show QR ID"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    showQr(s)
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
              <Label htmlFor="guardianPhone">Guardian Phone (SMS)</Label>
              <Input
                id="guardianPhone"
                required
                placeholder="e.g. +94771234567"
                value={form.guardianPhone}
                onChange={(e) =>
                  setForm({ ...form, guardianPhone: e.target.value })
                }
              />
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
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                required
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegisterOpen(false)}
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

      {/* QR ID dialog */}
      <Dialog
        open={qrStudent !== null}
        onOpenChange={(open) => !open && setQrStudent(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Student ID</DialogTitle>
            <DialogDescription>{qrStudent?.name}</DialogDescription>
          </DialogHeader>
          {qrStudent && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={qrDataUrl}
                alt={`QR code for ${qrStudent.name}`}
                className="size-48 rounded-lg border bg-white p-2"
              />
              <p className="font-mono text-xs text-muted-foreground">
                {qrStudent.qrCode}
              </p>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary">Grade {qrStudent.grade}</Badge>
                <Badge variant="outline">
                  {typeof qrStudent.batchId === "object" && qrStudent.batchId
                    ? qrStudent.batchId.name
                    : "No Batch"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
