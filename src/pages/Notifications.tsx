import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangleIcon, CheckCircle2Icon, ShieldAlertIcon, Trash2Icon, UserXIcon } from "lucide-react"

import { api, type AttendanceNotification, type NotificationStatus } from "@/lib/api"
import { useSession } from "@/lib/session"
import { ConfirmDialog, AlertModal } from "@/components/confirm-dialog"
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
  const { role } = useSession()
  const [deactivateTarget, setDeactivateTarget] = useState<AttendanceNotification | null>(null)
  const [removeTarget, setRemoveTarget] = useState<AttendanceNotification | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  // Deactivating is the answer to a 3-leave alert, so the alert is resolved
  // with it rather than left pending for a second tap.
  const deactivateStudent = async () => {
    const target = deactivateTarget
    if (!target) return
    setDeactivateTarget(null)
    try {
      await api.updateStudent(target.studentId, { isActive: false })
      await api.updateNotification(target._id, "resolved")
      fetchData(tab)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to deactivate")
    }
  }

  // A student at 3 leaves always has attendance rows, so a plain delete would
  // only ever be refused — this goes straight to the admin-only force delete,
  // which also erases the student's notifications (this card included).
  const removeStudent = async () => {
    const target = removeTarget
    if (!target) return
    setRemoveTarget(null)
    try {
      await api.deleteStudent(target.studentId, true)
      fetchData(tab)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to remove")
    }
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
                {/* Only the 3-leave alert asks for a decision about the student themselves. */}
                {n.type === "admin_critical" && n.status !== "resolved" && (
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeactivateTarget(n)}>
                      <UserXIcon /> Deactivate
                    </Button>
                    {role === "admin" && (
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => setRemoveTarget(n)}>
                        <Trash2Icon /> Remove
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={deactivateStudent}
        title={`Deactivate ${deactivateTarget?.studentName ?? "this student"}?`}
        description="They leave every class register but keep their attendance and marks history. This alert is marked resolved. You can reactivate them from the student page."
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={removeStudent}
        title={`Remove ${removeTarget?.studentName ?? "this student"} permanently?`}
        description="This erases the student together with all of their attendance records, marks and alerts. It cannot be undone. Deactivate instead if the history should be kept."
        confirmLabel="Remove permanently"
        tone="danger"
      />

      <AlertModal
        open={actionError !== null}
        onClose={() => setActionError(null)}
        title="That didn't work"
        description={actionError ?? undefined}
        tone="danger"
      />
    </div>
  )
}
