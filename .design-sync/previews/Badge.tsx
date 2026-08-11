import { Badge } from "lakshan-mobile"
import { AlertTriangleIcon, CheckIcon } from "lucide-react"

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  )
}

export function WithIcons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        <CheckIcon />
        Paid
      </Badge>
      <Badge variant="destructive">
        <AlertTriangleIcon />3 unpaid days
      </Badge>
    </div>
  )
}

export function AppUsage() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">Grade 3</Badge>
      <Badge variant="secondary">Grade 4</Badge>
      <Badge variant="secondary">Grade 5</Badge>
      <Badge variant="outline">Morning Batch</Badge>
      <Badge variant="outline">No Batch</Badge>
    </div>
  )
}
