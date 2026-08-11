import { Button } from "lakshan-mobile"
import { PlusIcon, QrCodeIcon, SaveIcon, TrashIcon } from "lucide-react"

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Save Student</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">
        <TrashIcon data-icon="inline-start" />
        Remove
      </Button>
      <Button variant="link">View profile</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
}

export function WithIcons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>
        <PlusIcon data-icon="inline-start" />
        Register Student
      </Button>
      <Button variant="outline">
        <SaveIcon data-icon="inline-start" />
        Confirm &amp; Save
      </Button>
      <Button size="icon" aria-label="Scan QR code">
        <QrCodeIcon />
      </Button>
      <Button variant="outline" size="icon-sm" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  )
}

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled>Saving…</Button>
      <Button variant="outline" disabled>
        Unavailable
      </Button>
    </div>
  )
}
