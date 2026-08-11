import { Input, Label, Switch } from "lakshan-mobile"

export function WithInput() {
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <Label htmlFor="studentName">Full Name</Label>
      <Input id="studentName" placeholder="Student's full name" />
    </div>
  )
}

export function WithControl() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="present" defaultChecked />
      <Label htmlFor="present">Mark Present?</Label>
    </div>
  )
}
