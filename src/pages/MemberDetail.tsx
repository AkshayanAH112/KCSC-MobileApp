import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileTextIcon,
  MailIcon,
  RefreshCwIcon,
  ShareIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react"

import { api, type Member, type MemberStatus } from "@/lib/api"
import { captureCardDataUrl, downloadCardImage, downloadCardImages } from "@/lib/card-capture"
import { MembershipCardBack, MembershipCardFront } from "@/components/membership-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
  const [sharingFace, setSharingFace] = useState<"front" | "back" | "both" | null>(null)
  const frontCardRef = useRef<HTMLDivElement>(null)
  const backCardRef = useRef<HTMLDivElement>(null)

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

  const cardFilename = (face: string) =>
    `${member?.fullName.replace(/\s+/g, "_")}_Membership_Card_${face}.png`

  const shareCard = async (face: "front" | "back") => {
    if (!member) return
    const node = face === "front" ? frontCardRef.current : backCardRef.current
    if (!node) return
    setSharingFace(face)
    try {
      await downloadCardImage(node, cardFilename(face))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to share card")
    } finally {
      setSharingFace(null)
    }
  }

  // Both faces in one share sheet, so an approved member's card can be sent in
  // a single message rather than as two separate sends.
  const shareBothCards = async () => {
    if (!member) return
    const front = frontCardRef.current
    const back = backCardRef.current
    if (!front || !back) return
    setSharingFace("both")
    try {
      await downloadCardImages(
        [
          { node: front, filename: cardFilename("front") },
          { node: back, filename: cardFilename("back") },
        ],
        `${member.fullName} — Membership Card`
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to share card")
    } finally {
      setSharingFace(null)
    }
  }

  const [emailState, setEmailState] = useState<{
    sending: boolean
    error: string | null
    sentAt: number | null
  }>({ sending: false, error: null, sentAt: null })

  // Sends the card to the address on the member's record, server-side, rather
  // than going through the share sheet — no address to type and no chance of
  // it reaching the wrong person. Mirrors the web console's "Email card".
  const emailCard = async () => {
    if (!id || !member) return
    if (!member.email) {
      setEmailState({ sending: false, error: "This member has no email address on file.", sentAt: null })
      return
    }
    const front = frontCardRef.current
    const back = backCardRef.current
    if (!front || !back) return

    setEmailState({ sending: true, error: null, sentAt: null })
    try {
      // Sequential, not Promise.all: two scale-4 rasterisations at once is a
      // lot to ask of a mid-range phone.
      const frontImage = await captureCardDataUrl(front)
      const backImage = await captureCardDataUrl(back)
      await api.sendCardEmail(id, { front: frontImage, back: backImage })
      setEmailState({ sending: false, error: null, sentAt: Date.now() })
    } catch (e) {
      setEmailState({
        sending: false,
        error: e instanceof Error ? e.message : "Failed to send email",
        sentAt: null,
      })
    }
  }

  const [renewalSaving, setRenewalSaving] = useState(false)
  const [renewalError, setRenewalError] = useState<string | null>(null)

  const decideRenewal = async (action: "approve" | "reject") => {
    if (!id) return
    setRenewalSaving(true)
    setRenewalError(null)
    try {
      const d = await api.decideRenewal(id, action)
      setMember(d.member)
    } catch (e) {
      setRenewalError(e instanceof Error ? e.message : "Failed to update renewal")
    } finally {
      setRenewalSaving(false)
    }
  }

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const remove = async () => {
    if (!id || !member) return
    setConfirmDeleteOpen(false)
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
    ["WhatsApp", member.whatsapp],
    ["Email", member.email],
    ["NIC", member.nic],
    ["Age", member.age?.toString()],
    ["Gender", member.gender],
    ["Member type", member.memberType],
    [
      "Date of birth",
      member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : undefined,
    ],
    [
      "Requested joining date",
      member.dateOfJoining ? new Date(member.dateOfJoining).toLocaleDateString() : undefined,
    ],
    ["Previous club", member.previousClub],
    ["Address", member.address],
    ["Guardian", member.guardianName],
    ["Guardian phone", member.guardianPhone],
    ["Interest", member.interest],
    ["Member ID", member.memberCode],
    ["Occupation", member.job],
    ["Annual fee", member.annualFee != null ? `LKR ${member.annualFee}` : undefined],
    ["Valid from", member.validFrom ? new Date(member.validFrom).toLocaleDateString() : undefined],
    ["Valid until", member.validUntil ? new Date(member.validUntil).toLocaleDateString() : undefined],
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

      {member.renewalStatus === "pending" && (
        <Card className="border-warning/30 bg-warning/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCwIcon className="text-warning" size={18} />
              <CardTitle className="text-base">Pending renewal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {renewalError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{renewalError}</div>
            )}
            <p>
              <span className="text-muted-foreground">Occupation:</span> {member.renewalJob ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Fee:</span>{" "}
              {member.renewalAnnualFee != null ? `LKR ${member.renewalAnnualFee}` : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Submitted:</span>{" "}
              {member.renewalSubmittedAt ? new Date(member.renewalSubmittedAt).toLocaleDateString() : "—"}
            </p>
            {member.renewalPaymentSlipUrl && (
              <a
                href={member.renewalPaymentSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline"
              >
                <FileTextIcon size={14} /> View renewal payment slip
              </a>
            )}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" disabled={renewalSaving} onClick={() => decideRenewal("approve")}>
                <CheckCircle2Icon data-icon="inline-start" />
                Approve renewal
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10"
                disabled={renewalSaving}
                onClick={() => decideRenewal("reject")}
              >
                <XCircleIcon data-icon="inline-start" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
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
          {member.paymentSlipUrl && (
            <p className="pt-1">
              <a
                href={member.paymentSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline"
              >
                <FileTextIcon size={14} /> View uploaded payment slip
              </a>
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
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2Icon data-icon="inline-start" />
            Delete application
          </Button>
        </CardContent>
      </Card>

      {member.status === "approved" && (
        <Card>
          <CardHeader>
            <CardTitle>Membership Card</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 px-4 pb-4">
            <div className="max-w-full overflow-x-auto">
              <MembershipCardFront member={member} cardRef={frontCardRef} />
            </div>
            <Button className="w-full" variant="outline" disabled={sharingFace !== null} onClick={() => shareCard("front")}>
              {sharingFace === "front" ? <Spinner /> : <><ShareIcon data-icon="inline-start" />Save / Share Front</>}
            </Button>

            <div className="max-w-full overflow-x-auto">
              <MembershipCardBack cardRef={backCardRef} />
            </div>
            <Button className="w-full" variant="outline" disabled={sharingFace !== null} onClick={() => shareCard("back")}>
              {sharingFace === "back" ? <Spinner /> : <><ShareIcon data-icon="inline-start" />Save / Share Back</>}
            </Button>

            {/* Sending both faces is the usual case once a member is approved,
                so it is the primary action; the single-face buttons above stay
                for when only one is wanted. */}
            <Button className="w-full" disabled={sharingFace !== null} onClick={shareBothCards}>
              {sharingFace === "both" ? <Spinner /> : <><ShareIcon data-icon="inline-start" />Save / Share Both Sides</>}
            </Button>

            {/* Straight to the address on file, unlike the share sheet above,
                which needs the address typed in by hand. Disabled outright when
                there is no address — the server would reject it anyway. */}
            <Button
              className="w-full"
              variant="outline"
              disabled={emailState.sending || sharingFace !== null || !member.email}
              onClick={emailCard}
            >
              {emailState.sending ? <Spinner /> : <><MailIcon data-icon="inline-start" />Email card to member</>}
            </Button>

            {!member.email && (
              <p className="text-center text-xs text-muted-foreground">
                No email address on file for this member.
              </p>
            )}
            {emailState.error && (
              <p className="w-full rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{emailState.error}</p>
            )}
            {emailState.sentAt && (
              <p className="flex w-full items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                <CheckCircle2Icon className="size-4 shrink-0" />
                Card emailed to {member.email} at {new Date(emailState.sentAt).toLocaleTimeString()}.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={remove}
        title="Delete this application?"
        description={member ? `Delete ${member.fullName}'s application? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  )
}
