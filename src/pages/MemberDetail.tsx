import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react"

import { api, type Member, type MemberStatus } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

const STATUS_VARIANT: Record<MemberStatus, "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  approved: "secondary",
  rejected: "destructive",
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [member, setMember] = useState<Member | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const d = await api.memberDetail(id)
      setMember(d.member)
      setNotes(d.member.reviewNotes ?? "")
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const review = async (status: MemberStatus) => {
    if (!id) return
    setSaving(true)
    setError("")
    try {
      const d = await api.reviewMember(id, { status, reviewNotes: notes })
      setMember(d.member)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!id || !member) return
    if (!confirm(`Delete ${member.fullName}'s application?`)) return
    setSaving(true)
    try {
      await api.deleteMember(id)
      navigate("/members", { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }
  if (!member) {
    return (
      <p className="p-12 text-center text-sm text-muted-foreground">Member not found</p>
    )
  }

  const rows: [string, string | undefined][] = [
    ["Phone", member.phone],
    ["Email", member.email],
    ["NIC", member.nic],
    ["Member type", member.memberType],
    [
      "Date of birth",
      member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : undefined,
    ],
    ["Address", member.address],
    ["Guardian", member.guardianName],
    ["Guardian phone", member.guardianPhone],
    ["Interest", member.interest],
    ["Member ID", member.memberCode],
  ]

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Button>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              <AvatarImage src={member.photoUrl} alt="" />
              <AvatarFallback>{member.fullName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{member.fullName}</CardTitle>
                <Badge variant={STATUS_VARIANT[member.status]} className="capitalize">
                  {member.status}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Applied {new Date(member.createdAt).toLocaleDateString()}
            {member.reviewedBy
              ? ` · Reviewed by ${member.reviewedBy.email}`
              : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {rows
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <p key={label}>
                <span className="text-muted-foreground">{label}:</span> {value}
              </p>
            ))}
          {member.message && (
            <p className="pt-1">
              <span className="text-muted-foreground">Message:</span> {member.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 px-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="notes">Review notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional — visible to admins only"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={saving || member.status === "approved"}
            onClick={() => review("approved")}
          >
            <CheckCircle2Icon data-icon="inline-start" />
            Approve
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive hover:bg-destructive/10"
            disabled={saving || member.status === "rejected"}
            onClick={() => review("rejected")}
          >
            <XCircleIcon data-icon="inline-start" />
            Reject
          </Button>
          <Button
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10"
            disabled={saving}
            onClick={remove}
          >
            <Trash2Icon data-icon="inline-start" />
            Delete application
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
