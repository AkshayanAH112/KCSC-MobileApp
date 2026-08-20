import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangleIcon, CheckCircle2Icon, ShieldAlertIcon } from "lucide-react"

import { api, type AttendanceNotification, type NotificationStatus } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const TABS: { key: NotificationStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "acknowledged", label: "Acked" },
  { key: "resolved", label: "Resolved" },
]

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationStatus>("pending")
  const [notifications, setNotifications] = useState<AttendanceNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = (status: NotificationStatus) => {
    setLoading(true)
    api
      .notifications(status)
      .then((d) => setNotifications(d.notifications))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const updateStatus = async (id: string, status: NotificationStatus) => {
    await api.updateNotification(id, status)
    fetchData(tab)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" description="Parent-warning and admin-critical leave alerts." />

      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <CheckCircle2Icon className="size-8 opacity-50" />
            No {tab} notifications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n._id} className="py-4">
              <CardContent className="px-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 rounded-lg p-2 ${
                      n.type === "admin_critical" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"
                    }`}
                  >
                    {n.type === "admin_critical" ? <ShieldAlertIcon className="size-4" /> : <AlertTriangleIcon className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {n.type === "admin_critical" ? "Administrative action required" : "Parent notification required"}
                    </p>
                    <Link to={`/students/${n.studentId}`} className="text-sm text-primary">
                      {n.registrationNumber} — {n.studentName}
                    </Link>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="secondary">{n.leaveCount} leaves</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {n.status === "pending" && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => updateStatus(n._id, "acknowledged")}>
                      Acknowledge
                    </Button>
                  )}
                  {n.status !== "resolved" && (
                    <Button size="sm" className="flex-1" onClick={() => updateStatus(n._id, "resolved")}>
                      Resolve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
