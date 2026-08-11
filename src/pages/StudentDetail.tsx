import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  ListChecksIcon,
} from "lucide-react"

import { api, type StudentDetail } from "@/lib/api"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      setData(await api.studentDetail(id))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
          <CardTitle className="text-lg">{student.name}</CardTitle>
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
              <Badge
                variant={
                  m.marks / m.maxMarks >= 0.5 ? "secondary" : "destructive"
                }
              >
                {m.marks}/{m.maxMarks}
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
    </div>
  )
}
