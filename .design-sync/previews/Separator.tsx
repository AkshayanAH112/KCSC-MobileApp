import { Separator } from "lakshan-mobile"

export function Horizontal() {
  return (
    <div className="w-full max-w-xs">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Attendance History</h4>
        <p className="text-xs text-muted-foreground">
          Sessions this student attended.
        </p>
      </div>
      <Separator className="my-3" />
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Payment Records</h4>
        <p className="text-xs text-muted-foreground">
          Session fees collected at the scanner.
        </p>
      </div>
    </div>
  )
}

export function Vertical() {
  return (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Students</span>
      <Separator orientation="vertical" />
      <span>Batches</span>
      <Separator orientation="vertical" />
      <span>Marks</span>
    </div>
  )
}
