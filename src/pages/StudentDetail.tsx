import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  ListChecksIcon,
  PencilIcon,
  QrCodeIcon,
  Trash2Icon,
} from "lucide-react"

import { api, type Batch, ApiError, type LeaveRecord, type StudentDetail } from "@/lib/api"
import { useSession } from "@/lib/session"
import { isValidPhoneLocal, PHONE_HINT } from "@/lib/phone"
import { StatCard } from "@/components/stat-card"
import { StudentIdDialog } from "@/components/student-id-dialog"
import { ConfirmDialog, AlertModal } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useSession()
  const [data, setData] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIdCard, setShowIdCard] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([])

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [blockedDeleteMessage, setBlockedDeleteMessage] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      setData(await api.studentDetail(id))
      const lh = await api.leaveHistory(id)
      setLeaveHistory(lh.leaves)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const performDelete = async (force = false) => {
    if (!id) return
    try {
      await api.deleteStudent(id, force)
      navigate("/students", { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setBlockedDeleteMessage(e.message)
      } else {
        setAlertMessage(e instanceof Error ? e.message : "Failed to delete")
      }
    }
  }

  const deactivateInstead = async () => {
    if (!id) return
    setBlockedDeleteMessage(null)
    await api.updateStudent(id, { isActive: false })
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }
  if (!data) {
    return (
      <p className="p-12 text-center text-sm text-muted-foreground">
        Student not found
      </p>
    )
  }

  const { student, attendance, marks, analytics } = data

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{student.name}</CardTitle>
            {student.isActive === false ? (
              <Badge variant="destructive">Inactive</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
          </div>
          <p className="font-mono text-xs text-muted-foreground">{student.registrationNumber ?? "No registration number"}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <Badge variant="secondary">Grade {student.grade}</Badge>
            <Badge variant="outline">
              {typeof student.batchId === "object" && student.batchId
                ? student.batchId.name
                : "No Batch"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {student.school && (
            <p>
              <span className="text-muted-foreground">School:</span>{" "}
              {student.school}
            </p>
          )}
          {student.address && (
            <p>
              <span className="text-muted-foreground">Address:</span>{" "}
              {student.address}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Guardian:</span>{" "}
            {student.guardianName}
          </p>
          <p>
            <span className="text-muted-foreground">Phone:</span>{" "}
            {student.guardianPhone}
          </p>
          <p>
            <span className="text-muted-foreground">ID:</span>{" "}
            <span className="font-mono text-xs">{student.qrCode}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Registered:</span>{" "}
            {student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Total Leaves:</span>{" "}
            <span className="tabular">{student.totalLeaves ?? 0}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Current Leave Cycle:</span>{" "}
            <span className={`tabular font-bold ${(student.currentLeaveCycle ?? 0) >= 3 ? "text-destructive" : (student.currentLeaveCycle ?? 0) >= 2 ? "text-warning" : ""}`}>
              {student.currentLeaveCycle ?? 0}
            </span>
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowIdCard(true)}>
              <QrCodeIcon data-icon="inline-start" />
              ID Card
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditOpen(true)}>
              <PencilIcon data-icon="inline-start" />
              Edit
            </Button>
            <Button variant="outline" size="icon" aria-label="Delete student" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2Icon className="text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Attendance"
          value={`${analytics.attendancePercentage}%`}
          icon={CalendarCheckIcon}
          iconClassName={
            analytics.attendancePercentage >= 75
              ? "bg-success/10 text-success"
              : "bg-warning/15 text-warning"
          }
        />
        <StatCard
          title="Sessions"
          value={`${analytics.classesPresent}/${analytics.totalClasses}`}
          icon={ListChecksIcon}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Avg Marks"
          value={`${analytics.averageMarks}%`}
          icon={GraduationCapIcon}
          iconClassName="bg-gold/20 text-gold-foreground"
        />
      </div>

      {analytics.subjectAverages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Marks by Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.subjectAverages.map((s) => (
              <div key={s.subject} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.subject}</span>
                  <span className="tabular text-muted-foreground">
                    {s.average}% · {s.count}{" "}
                    {s.count === 1 ? "exam" : "exams"}
                  </span>
                </div>
                {/* Width encodes the average; the number above it carries the
                    same value so the bar is never the only signal. */}
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(s.average, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Marks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {marks.length === 0 && (
            <p className="text-sm text-muted-foreground">No marks recorded.</p>
          )}
          {marks.slice(0, 10).map((m) => (
            <div
              key={m._id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{m.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.examDate).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={m.isAbsent ? "outline" : m.marks / m.maxMarks >= 0.5 ? "secondary" : "destructive"}>
                {m.isAbsent ? "Absent" : `${m.marks}/${m.maxMarks}`}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {attendance.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No attendance records.
            </p>
          )}
          {attendance.slice(0, 15).map((a) => (
            <div
              key={a._id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {typeof a.classId === "object" && a.classId
                    ? (a.classId.subject ?? "Session")
                    : "Session"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.date).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={a.present ? "secondary" : "destructive"}>
                {a.present ? "Present" : "Absent"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {leaveHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaveHistory.map((l) => (
              <div key={l._id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {typeof l.classId === "object" && l.classId ? (l.classId.subject ?? "Session") : "Session"}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleDateString()}</p>
                </div>
                <Badge variant="secondary">Cycle {l.leaveCycleAtRecord ?? "—"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <StudentIdDialog student={showIdCard ? student : null} onClose={() => setShowIdCard(false)} />

      {editOpen && (
        <EditStudentDialog
          student={student}
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
        onConfirm={() => {
          setConfirmDeleteOpen(false)
          performDelete(false)
        }}
        title="Delete this student?"
        description="This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
      />

      <Dialog open={blockedDeleteMessage !== null} onOpenChange={(o) => !o && setBlockedDeleteMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot delete this student</DialogTitle>
            <DialogDescription>{blockedDeleteMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={deactivateInstead}>
              Deactivate Instead
            </Button>
            {role === "admin" && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setBlockedDeleteMessage(null)
                  performDelete(true)
                }}
              >
                Force Delete Everything (Admin Only)
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => setBlockedDeleteMessage(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertModal open={alertMessage !== null} onClose={() => setAlertMessage(null)} title="Something went wrong" description={alertMessage ?? undefined} tone="danger" />
    </div>
  )
}

function EditStudentDialog({
  student,
  onClose,
  onSaved,
}: {
  student: StudentDetail["student"]
  onClose: () => void
  onSaved: () => void
}) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [form, setForm] = useState({
    name: student.name,
    school: student.school ?? "",
    address: student.address ?? "",
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    grade: String(student.grade),
    batchId: typeof student.batchId === "object" && student.batchId ? student.batchId._id : "",
    isActive: student.isActive !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  useEffect(() => {
    api.batches().then((d) => setBatches(d.batches))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPhoneLocal(form.guardianPhone)) {
      setPhoneError(PHONE_HINT)
      return
    }
    setPhoneError(null)
    setSaving(true)
    try {
      await api.updateStudent(student._id, { ...form, grade: Number(form.grade) })
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
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="editName">Full Name</Label>
            <Input id="editName" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editSchool">School</Label>
            <Input id="editSchool" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editAddress">Address</Label>
            <Input id="editAddress" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editGuardianName">Guardian Name</Label>
            <Input
              id="editGuardianName"
              required
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editGuardianPhone">Guardian Phone</Label>
            <Input
              id="editGuardianPhone"
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
              <Label htmlFor="editBatch">Batch</Label>
              <Select id="editBatch" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
                <option value="">No Batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editGrade">Grade</Label>
              <Select id="editGrade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <Label htmlFor="editActive" className="cursor-pointer">
              Active in the programme
            </Label>
            <Switch
              id="editActive"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
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
