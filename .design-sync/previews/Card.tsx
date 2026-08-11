import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "lakshan-mobile"
import { QrCodeIcon } from "lucide-react"

export function Basic() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Morning Batch</CardTitle>
        <CardDescription>Grade 3–5 · Year 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          42 students enrolled. Next session on Saturday at 8:00 AM covers
          Mathematics revision for the term test.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Open Batch</Button>
        <Button size="sm" variant="outline">
          Schedule Class
        </Button>
      </CardFooter>
    </Card>
  )
}

export function StudentCard() {
  return (
    <Card className="max-w-sm py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">Kavindi Silva</p>
          <p className="truncate text-xs text-muted-foreground">
            R. Silva · +94 77 123 4567
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge variant="secondary">Grade 4</Badge>
            <Badge variant="outline">Morning Batch</Badge>
          </div>
        </div>
        <Button variant="outline" size="icon" aria-label="Show QR ID">
          <QrCodeIcon />
        </Button>
      </CardContent>
    </Card>
  )
}

export function WithAction() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Pending Payments</CardTitle>
        <CardDescription>Sessions attended but unpaid</CardDescription>
        <CardAction>
          <Badge variant="destructive">7 due</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">Rs. 3,500</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Automatic SMS reminders go out daily at 8:30 AM.
        </p>
      </CardContent>
    </Card>
  )
}
