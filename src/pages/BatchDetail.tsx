import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react"

import { api, type Batch, type ClassSession } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
          <CardTitle className="text-lg">{batch.name}</CardTitle>
          <CardDescription>Year {batch.year}</CardDescription>
          <div className="flex gap-1.5 pt-1">
            {batch.grades?.map((g) => (
              <Badge key={g} variant="secondary">
                Grade {g}
              </Badge>
            ))}
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
    </div>
  )
}
