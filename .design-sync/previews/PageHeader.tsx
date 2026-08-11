import { Button, PageHeader } from "lakshan-mobile"
import { PlusIcon } from "lucide-react"

export function Basic() {
  return (
    <div className="w-full max-w-sm">
      <PageHeader
        title="Students"
        description="Register students and view QR ID cards."
      />
    </div>
  )
}

export function WithAction() {
  return (
    <div className="w-full max-w-sm">
      <PageHeader
        title="Batches & Classes"
        description="Manage student batches and class sessions."
        action={
          <Button>
            <PlusIcon data-icon="inline-start" />
            Batch
          </Button>
        }
      />
    </div>
  )
}
