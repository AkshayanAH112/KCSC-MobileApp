import { Skeleton } from "lakshan-mobile"

export function ListLoading() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  )
}

export function CardLoading() {
  return (
    <div className="w-full max-w-xs rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function StatLoading() {
  return (
    <div className="w-full max-w-xs rounded-xl border p-4">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-8 w-14" />
    </div>
  )
}
