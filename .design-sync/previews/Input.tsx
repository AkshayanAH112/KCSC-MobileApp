import { Input, Label } from "lakshan-mobile"

export function Basic() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <Input placeholder="Search students…" />
      <Input defaultValue="Kavindi Silva" />
    </div>
  )
}

export function WithLabel() {
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <Label htmlFor="guardianPhone">Guardian Phone (SMS)</Label>
      <Input id="guardianPhone" placeholder="e.g. +94 77 123 4567" />
    </div>
  )
}

export function Types() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <Input type="date" defaultValue="2026-07-04" />
      <Input type="number" placeholder="Marks out of 100" />
      <Input type="password" defaultValue="secret123" />
    </div>
  )
}

export function States() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <Input disabled placeholder="Disabled" />
      <Input aria-invalid defaultValue="Invalid phone number" />
    </div>
  )
}
