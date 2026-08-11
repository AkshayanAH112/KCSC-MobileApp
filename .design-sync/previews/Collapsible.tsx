import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "lakshan-mobile"
import { ChevronsUpDownIcon } from "lucide-react"

export function Open() {
  return (
    <Collapsible defaultOpen className="w-full max-w-xs space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Attendance — March 2026</p>
        <CollapsibleTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Toggle" />}
        >
          <ChevronsUpDownIcon />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-lg border px-3 py-2 text-sm">
          Mar 07 · Present · Paid
        </div>
        <div className="rounded-lg border px-3 py-2 text-sm">
          Mar 14 · Present · Unpaid
        </div>
        <div className="rounded-lg border px-3 py-2 text-sm">
          Mar 21 · Absent
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function Closed() {
  return (
    <Collapsible className="w-full max-w-xs">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Attendance — February 2026</p>
        <CollapsibleTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Toggle" />}
        >
          <ChevronsUpDownIcon />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="rounded-lg border px-3 py-2 text-sm">Hidden rows</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
