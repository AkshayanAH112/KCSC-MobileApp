import { StatCard } from "lakshan-mobile"
import {
  CalendarCheckIcon,
  CreditCardIcon,
  UsersIcon,
} from "lucide-react"

export function DashboardGrid() {
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-3">
      <StatCard
        title="Total Students"
        value={42}
        icon={UsersIcon}
        iconClassName="bg-blue-50 text-blue-600"
      />
      <StatCard
        title="Today's Attendance"
        value="86%"
        icon={CalendarCheckIcon}
        iconClassName="bg-green-50 text-green-600"
      />
    </div>
  )
}

export function Loading() {
  return (
    <div className="w-44">
      <StatCard
        title="Pending Payments"
        value={undefined}
        icon={CreditCardIcon}
        iconClassName="bg-orange-50 text-orange-600"
        loading
      />
    </div>
  )
}
