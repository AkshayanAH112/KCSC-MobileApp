import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "lakshan-mobile"

export function RegisterStudent() {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Student</DialogTitle>
          <DialogDescription>
            A unique QR code is generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Student's full name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Guardian Phone (SMS)</Label>
            <Input id="phone" placeholder="e.g. +94 77 123 4567" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Create &amp; Generate QR</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
