import type { Ref } from "react"

/**
 * Mirrors Web app/components/membership-card.tsx field-for-field. CSS-drawn
 * (brand colors/logo, not a template image) — kept template-free deliberately,
 * same reasoning as the Web version: no coordinate-hunting against a source
 * image, and flexbox/grid layout is what html2canvas-pro renders most reliably.
 */

export type MembershipCardMember = {
  fullName: string
  memberCode?: string
  nic?: string
  reviewedAt?: string
  photoUrl?: string
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="truncate text-[8px] text-gray-700">
      <span className="font-bold text-primary">{label}:</span> {value}
    </p>
  )
}

export function MembershipCardFront({
  member,
  cardRef,
}: {
  member: MembershipCardMember
  cardRef?: Ref<HTMLDivElement>
}) {
  const joiningDate = member.reviewedAt
    ? new Date(member.reviewedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—"

  return (
    <div
      ref={cardRef}
      className="relative flex h-[53.98mm] w-[85.6mm] shrink-0 flex-col gap-2 overflow-hidden rounded-xl border-[3px] border-primary bg-white p-3"
    >
      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/5" />
      <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-4 translate-y-8 rounded-full bg-primary/5" />

      <div className="z-10 flex items-center gap-2">
        <img src="/logo.png" alt="" className="h-[30px] w-[30px] shrink-0 object-contain" />
        <div className="min-w-0">
          <div className="text-[11px] leading-tight font-bold text-primary">Kallar Central Sports Club</div>
          <div className="text-[7px] font-bold tracking-wide text-gold-foreground uppercase">Membership Card</div>
        </div>
      </div>
      <div className="z-10 h-px w-full bg-border" />

      <div className="z-10 flex flex-1 gap-3">
        <div className="h-full w-[22mm] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[#f6f1ee]" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="truncate text-[12px] leading-tight font-bold text-gray-900 uppercase">{member.fullName}</p>
          <Row label="Member ID" value={member.memberCode ?? "—"} />
          <Row label="NIC" value={member.nic ?? "—"} />
          <Row label="Joined" value={joiningDate} />
        </div>
      </div>
    </div>
  )
}

function SignatureBlock({ label, file }: { label: string; file: string }) {
  return (
    <div className="flex w-[26mm] flex-col items-center">
      <div className="flex h-[9mm] w-full items-end justify-center overflow-hidden">
        <img
          src={file}
          alt={`${label}'s signature`}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      </div>
      <div className="mt-1 w-full border-t border-gray-400" />
      <span className="mt-1 text-[8px] font-bold text-primary">{label}</span>
    </div>
  )
}

export function MembershipCardBack({ cardRef }: { cardRef?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      className="relative flex h-[53.98mm] w-[85.6mm] shrink-0 flex-col gap-2 overflow-hidden rounded-xl border-[3px] border-primary bg-white p-3"
    >
      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/5" />

      <div className="z-10 text-[9px] font-bold tracking-wide text-primary uppercase">Terms &amp; Conditions</div>
      <ul className="z-10 list-disc space-y-0.5 pl-3 text-[7px] leading-snug text-gray-700 marker:text-primary">
        <li>This card is non-transferable.</li>
        <li>Member must follow the rules and regulations of the club.</li>
        <li>This card is the property of Kallar Central Sports Club.</li>
        <li>Loss of card must be reported immediately.</li>
      </ul>

      <div className="z-10 mt-auto flex items-end justify-between gap-4">
        <SignatureBlock label="President" file="/signature-president.png" />
        <SignatureBlock label="Secretary" file="/signature-secretary.png" />
      </div>
    </div>
  )
}
