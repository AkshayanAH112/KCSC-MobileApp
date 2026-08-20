import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpenIcon, ChevronRightIcon, UsersIcon } from "lucide-react"

import { api, type Batch, type Student } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const GRADES = [3, 4, 5] as const

export default function GradesPage() {
  const navigate = useNavigate()
  const [batches, setBatches] = useState<Batch[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.batches(), api.students()])
      .then(([b, s]) => {
        setBatches(b.batches)
        setStudents(s.students)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Grades"
        description="Grades are fixed to 3, 4 and 5 — this is an overview, not a place to add more."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {GRADES.map((grade) => {
            const gradeBatches = batches.filter((b) => b.grades.includes(grade))
            const gradeStudents = students.filter((s) => s.grade === grade)
            const activeStudents = gradeStudents.filter((s) => s.isActive !== false).length

            return (
              <Card key={grade}>
                <CardContent className="space-y-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                      G{grade}
                    </span>
                    <h2 className="font-heading font-semibold">Grade {grade}</h2>
                  </div>

                  <button
                    onClick={() => navigate(`/batches?grade=${grade}`)}
                    className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors active:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpenIcon className="size-4 text-primary" />
                      <div>
                        <p className="font-bold">{gradeBatches.length}</p>
                        <p className="text-xs text-muted-foreground">{gradeBatches.length === 1 ? "Batch" : "Batches"}</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => navigate(`/students?grade=${grade}`)}
                    className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors active:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <UsersIcon className="size-4 text-primary" />
                      <div>
                        <p className="font-bold">{gradeStudents.length}</p>
                        <p className="text-xs text-muted-foreground">
                          {gradeStudents.length === 1 ? "Student" : "Students"}
                          {gradeStudents.length > 0 && ` (${activeStudents} active)`}
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
