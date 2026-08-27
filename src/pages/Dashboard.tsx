import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangleIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  Layers2Icon,
  QrCodeIcon,
  ScanLineIcon,
  ShieldAlertIcon,
  UserCogIcon,
  UserPlusIcon,
  UsersIcon,
  UserXIcon,
} from "lucide-react"

import { api, type DashboardStats } from "@/lib/api"
import { useSession } from "@/lib/session"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { QrScannerPanel } from "@/components/qr-scanner-panel"

export default function DashboardPage() {
  const { role } = useSession()
  const [scanOpen, setScanOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api
      .dashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club Dashboard"
        description="Kallar Central Sports Club — today at a glance."
      />

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load stats: {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Active Students"
          value={stats?.totalStudents}
          icon={UsersIcon}
          iconClassName="bg-primary/10 text-primary"
          loading={loading}
          to="/students"
        />
        <StatCard
          title="Today's Attendance"
          value={stats && !stats.hasClassesToday ? "No classes" : stats?.todayAttendance}
          icon={CalendarCheckIcon}
          iconClassName="bg-success/10 text-success"
          loading={loading}
          to="/attendance/today"
        />
        <StatCard
          title="Needs Follow-up"
          value={stats?.lowAttendanceCount}
          icon={AlertTriangleIcon}
          iconClassName="bg-warning/15 text-warning"
          loading={loading}
          to="/students"
        />
        <StatCard
          title="Marks Today"
          value={stats?.recentMarks}
          icon={GraduationCapIcon}
          iconClassName="bg-gold/20 text-gold-foreground"
          loading={loading}
          to="/marks"
        />
        <StatCard
          title="On Leave Today"
          value={stats?.studentsOnLeaveToday}
          icon={CalendarCheckIcon}
          iconClassName="bg-warning/15 text-warning"
          loading={loading}
          to="/attendance/today"
        />
        <StatCard
          title="At 2 Leaves"
          value={stats?.studentsAtCycle2}
          icon={AlertTriangleIcon}
          iconClassName="bg-warning/15 text-warning"
          loading={loading}
          to="/notifications"
        />
        <StatCard
          title="At 3 Leaves"
          value={stats?.studentsAtCycle3}
          icon={ShieldAlertIcon}
          iconClassName="bg-destructive/10 text-destructive"
          loading={loading}
          to="/notifications"
        />
        <StatCard
          title="Deactivated"
          value={stats?.deactivatedStudents}
          icon={UserXIcon}
          iconClassName="bg-muted text-muted-foreground"
          loading={loading}
          to="/students"
        />
        {role === "admin" && (
          <StatCard
            title="Pending Members"
            value={stats?.pendingMembers ?? undefined}
            icon={UserCogIcon}
            iconClassName="bg-primary/10 text-primary"
            loading={loading}
            to="/members"
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-auto flex-col gap-2 py-4"
            render={<Link to="/scanner" />}
          >
            <QrCodeIcon className="size-6" />
            Scan Attendance
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            render={<Link to="/students" />}
          >
            <UserPlusIcon className="size-6" />
            Students
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            render={<Link to="/batches" />}
          >
            <Layers2Icon className="size-6" />
            Batches & Classes
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            render={<Link to="/marks" />}
          >
            <GraduationCapIcon className="size-6" />
            Enter Marks
          </Button>
          {role === "admin" && (
            <Button
              size="lg"
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              render={<Link to="/members" />}
            >
              <UserCogIcon className="size-6" />
              Club Members
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick scan. Sits above the 4rem tab bar plus the gesture-bar inset, so
          it never covers a tab. Admins have no Scan tab at all (app-shell swaps
          it for Club Members), which is who this saves the most taps for. */}
      <button
        type="button"
        aria-label="Scan student QR code"
        onClick={() => setScanOpen(true)}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        <ScanLineIcon className="size-6" />
      </button>

      {/* Base UI unmounts the sheet's contents on close, which is what stops
          the camera — QrScannerPanel releases it in its effect cleanup. */}
      <Sheet open={scanOpen} onOpenChange={setScanOpen}>
        <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto pb-safe-offset-4">
          <SheetHeader>
            <SheetTitle>Scan student QR</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <QrScannerPanel onScanComplete={() => setScanOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
