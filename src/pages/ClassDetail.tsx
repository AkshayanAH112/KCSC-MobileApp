import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react"

import { api, type ClassSession, type RosterEntry } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [classSession, setClassSession] = useState<ClassSession | null>(null)
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

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
  const absentCount = roster.length - presentCount

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Button>

      <Card className="py-4">
        <CardContent className="px-4">
          <Badge variant="secondary">Grade {classSession.grade}</Badge>
          <h1 className="mt-2 font-heading text-lg font-bold">
            {classSession.subject || "General Session"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(classSession.date).toDateString()}
            {classSession.time ? ` at ${classSession.time}` : ""}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
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
          </div>
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
    </div>
  )
}
