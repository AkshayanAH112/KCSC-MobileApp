import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react"

import { api, type TodaySession } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function AttendanceTodayPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<TodaySession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api
      .attendanceToday()
      .then((d) => setSessions(d.sessions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Button>

      {loading && (
        <div className="flex justify-center p-12">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load: {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <Card className="py-10">
          <CardContent className="text-center text-sm text-muted-foreground">
            No classes scheduled today.
          </CardContent>
        </Card>
      )}

      {sessions.map(({ classSession, roster }) => {
        const presentCount = roster.filter((r) => r.isPresent).length
        return (
          <Card key={classSession._id} className="py-4">
            <CardContent className="px-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <Badge variant="secondary">Grade {classSession.grade}</Badge>
                  <h2 className="mt-2 font-heading text-lg font-bold">
                    {classSession.subject || "General Session"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {classSession.time ? `${classSession.time} · ` : ""}Grade{" "}
                    {classSession.grade}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-muted p-3 text-center">
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
              </div>

              <div className="space-y-2">
                {roster.length === 0 && (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    No students on this roster.
                  </p>
                )}
                {roster.map((entry) => (
                  <div
                    key={entry.student._id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <p className="min-w-0 truncate text-sm font-medium">
                      {entry.student.name}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!entry.isRecorded && (
                        <Badge variant="secondary" className="text-[10px]">
                          Not marked
                        </Badge>
                      )}
                      {entry.isPresent ? (
                        <CheckCircle2Icon className="size-4 text-success" />
                      ) : (
                        <XCircleIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
