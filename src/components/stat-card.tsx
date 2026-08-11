import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  loading,
  to,
}: {
  title: string
  value: string | number | undefined
  icon: LucideIcon
  iconClassName?: string
  loading?: boolean
  to?: string
}) {
  const card = (
    <Card className={cn("py-4", to && "transition-transform active:scale-[0.97]")}>
      <CardContent className="px-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <span className={cn("rounded-lg p-1.5", iconClassName)}>
            <Icon className="size-4" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <p className="text-2xl font-bold">{value ?? "—"}</p>
        )}
      </CardContent>
    </Card>
  )

  if (!to) return card
  return (
    <Link to={to} className="block">
      {card}
    </Link>
  )
}
