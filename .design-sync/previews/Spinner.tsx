import { Button, Spinner } from "lakshan-mobile"

export function Sizes() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  )
}

export function InButton() {
  return (
    <div className="flex items-center gap-2">
      <Button disabled>
        <Spinner />
        Saving…
      </Button>
      <Button variant="outline" disabled>
        <Spinner />
        Loading students
      </Button>
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-xl border p-6">
      <Spinner className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading dashboard…</p>
    </div>
  )
}
