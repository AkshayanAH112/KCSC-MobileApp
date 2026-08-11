import {
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "lakshan-mobile"
import {
  CreditCardIcon,
  GraduationCapIcon,
  LogOutIcon,
} from "lucide-react"

export function MenuSheet() {
  return (
    <Sheet open>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Lakshan Primary Education Center</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2">
          <span className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium">
            <GraduationCapIcon className="size-4" />
            Marks &amp; Reports
          </span>
          <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium">
            <CreditCardIcon className="size-4" />
            Payments
          </span>
          <Separator className="my-2" />
          <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive">
            <LogOutIcon className="size-4" />
            Sign out
          </span>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
