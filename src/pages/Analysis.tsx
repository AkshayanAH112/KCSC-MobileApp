import { useEffect, useState } from "react"
import { TrendingUpIcon, TrophyIcon } from "lucide-react"

import { api, type AnalysisResult, type Batch } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

const today = new Date()
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

export default function AnalysisPage() {
  const [start, setStart] = useState(isoDate(thirtyDaysAgo))
  const [end, setEnd] = useState(isoDate(today))
  const [grade, setGrade] = useState("")
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchId, setBatchId] = useState("")
  const [results, setResults] = useState<AnalysisResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    api.batches().then((d) => setBatches(d.batches))
  }, [])

  const runReport = async () => {
    setLoading(true)
    setError("")
    try {
      const d = await api.analysis({
        start,
        end,
        grade: grade || undefined,
        batchId: batchId || undefined,
      })
      setResults(d.students)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analysis")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gradeBatches = grade
    ? batches.filter((b) => b.grades.includes(Number(grade) as 3 | 4 | 5))
    : batches

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analysis"
        description="Rank students by results and attendance over any date range."
      />

      <Card>
        <CardContent className="space-y-4 px-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">From</Label>
              <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">To</Label>
              <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="grade">Grade</Label>
              <Select
                id="grade"
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value)
                  setBatchId("")
                }}
              >
                <option value="">All grades</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch">Batch</Label>
              <Select id="batch" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                <option value="">All batches</option>
                {gradeBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={runReport} disabled={loading}>
            {loading ? <Spinner /> : <><TrendingUpIcon data-icon="inline-start" />Run Report</>}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {!loading && results && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {results.length} {results.length === 1 ? "student" : "students"} · combined score is
            the average of results % and attendance % (whichever are available)
          </p>
          {results.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center text-sm text-muted-foreground">
                No marks or attendance recorded in this range.
              </CardContent>
            </Card>
          ) : (
            results.map((r, i) => (
              <Card key={r.studentId} className="py-3">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {i === 0 ? <TrophyIcon className="size-4 text-warning" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Grade {r.grade}
                      {r.partial ? " · partial data" : ""}
                      {r.examCount > 0 ? ` · ${r.examCount} exam${r.examCount === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-lg font-bold text-primary">
                      {r.combinedScore ?? "—"}
                      {r.combinedScore !== null ? "%" : ""}
                    </p>
                    <p className="tabular text-xs text-muted-foreground">
                      {r.avgMarksPercent ?? "—"}% marks · {r.attendancePercent ?? "—"}% present
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
