import { useEffect, useState } from "react"
import { DownloadIcon, TrendingUpIcon, TrophyIcon } from "lucide-react"

import { api, type AnalysisExam, type AnalysisResult, type Batch } from "@/lib/api"
import { downloadAnalysisPdf, examDateLabel, type AnalysisPdfFilters } from "@/lib/analysis-pdf"
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
  const [exams, setExams] = useState<AnalysisExam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // Filters the current results were produced with, so the PDF header matches
  // the list even if the inputs were edited afterwards without re-running.
  const [reportFilters, setReportFilters] = useState<AnalysisPdfFilters | null>(null)
  const [downloading, setDownloading] = useState(false)

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
      setExams(d.exams ?? [])
      setReportFilters({
        start,
        end,
        gradeLabel: grade ? `Grade ${grade}` : "All grades",
        batchLabel: batches.find((b) => b._id === batchId)?.name ?? "All batches",
      })
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

  const handleDownload = async () => {
    if (!results || !reportFilters) return
    setDownloading(true)
    try {
      await downloadAnalysisPdf(results, exams, reportFilters)
    } catch (e) {
      setError(`Could not create PDF: ${e instanceof Error ? e.message : "unknown error"}`)
    } finally {
      setDownloading(false)
    }
  }

  const examsByKey = new Map(exams.map((e) => [e.key, e]))

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
            {results.length} {results.length === 1 ? "student" : "students"} · students who sat
            every exam rank first, then those who missed 1, 2 and so on · combined score is the
            average of results % and attendance % (whichever are available)
          </p>
          {results.length > 0 && (
            <Button variant="outline" className="w-full" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Spinner /> : <><DownloadIcon data-icon="inline-start" />Download PDF</>}
            </Button>
          )}
          {results.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center text-sm text-muted-foreground">
                No marks or attendance recorded in this range.
              </CardContent>
            </Card>
          ) : (
            results.map((r, i) => (
              <Card key={r.studentId} className="py-3">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      {i === 0 ? <TrophyIcon className="size-4 text-warning" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.name}</p>
                      {r.school && <p className="truncate text-xs text-muted-foreground">{r.school}</p>}
                      <p className="text-xs text-muted-foreground">
                        Grade {r.grade}
                        {r.partial ? " · partial data" : ""}
                        {r.examsTotal > 0 ? ` · ${r.examsSat}/${r.examsTotal} exams` : ""}
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
                  </div>
                  {r.exams.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t pt-2">
                      {r.exams.map((e) => {
                        const info = examsByKey.get(e.examKey)
                        return (
                          <span
                            key={e.examKey}
                            className="tabular rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                          >
                            {info ? `${info.label} ${examDateLabel(info.examDate)}: ` : ""}
                            {e.status === "sat" ? (
                              <span className="font-semibold text-foreground">
                                {e.marks}/{e.maxMarks}
                              </span>
                            ) : e.status === "absent" ? (
                              <span className="font-semibold text-destructive">Absent</span>
                            ) : (
                              <span>No mark</span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
