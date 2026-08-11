import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangleIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  Layers2Icon,
  QrCodeIcon,
  UserCogIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import { api, type DashboardStats } from "@/lib/api"
import { useSession } from "@/lib/session"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const { role } = useSession()
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
    </div>
  )
}
