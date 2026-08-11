import { Label, Select } from "lakshan-mobile"

export function Basic() {
  return (
    <div className="w-full max-w-xs">
      <Select defaultValue="4">
        <option value="3">Grade 3</option>
        <option value="4">Grade 4</option>
        <option value="5">Grade 5</option>
      </Select>
    </div>
  )
}

export function WithLabel() {
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <Label htmlFor="batch">Batch</Label>
      <Select id="batch" defaultValue="morning">
        <option value="morning">Morning Batch (2026)</option>
        <option value="evening">Evening Batch (2026)</option>
        <option value="weekend">Weekend Batch (2025)</option>
      </Select>
    </div>
  )
}

export function Disabled() {
  return (
    <div className="w-full max-w-xs">
      <Select disabled defaultValue="all">
        <option value="all">All Batches</option>
      </Select>
    </div>
  )
}
