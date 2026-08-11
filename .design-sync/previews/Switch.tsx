import { Label, Switch } from "lakshan-mobile"

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-2">
        <Switch id="off" />
        <Label htmlFor="off">Off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="on" defaultChecked />
        <Label htmlFor="on">On</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off">Disabled</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on">Disabled on</Label>
      </div>
    </div>
  )
}

export function SettingRows() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center justify-between rounded-xl border p-4">
        <span className="text-sm font-medium">Mark Present?</span>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between rounded-xl border p-4">
        <div>
          <span className="text-sm font-medium">Pay Session Fee</span>
          <p className="text-xs text-muted-foreground">
            Toggle if they paid today, or to undo a mistake.
          </p>
        </div>
        <Switch />
      </div>
    </div>
  )
}
