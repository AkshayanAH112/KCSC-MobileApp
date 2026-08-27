import type { CSSProperties, Ref } from "react"

/**
 * Mirrors Web app/components/membership-card.tsx field-for-field, including
 * the underlying artwork (public/membership-card/front.webp, back.webp,
 * copied from the Web app's copy of the club's supplied card design). Every
 * field below is an absolutely-positioned overlay whose percentages were
 * measured against that artwork on the Web side — kept identical here so the
 * two apps produce the same card. The container's aspect ratio is locked to
 * the template image's own ratio, not a standard ID-1 card.
 */

export type MembershipCardMember = {
  fullName: string
  memberCode?: string
  nic?: string
  dateOfBirth?: string
  reviewedAt?: string
  validFrom?: string
  validUntil?: string
  photoUrl?: string
}

function formatDate(value?: string) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })
}

const CARD_WIDTH_MM = 90

// The card's width is physical (mm) but its type used to be fixed px, so the
// two did not scale together: anything that changed the effective px size —
// mobile text-inflation, page zoom, a device with a different mm mapping —
// changed how much text fitted its box, and `truncate` then quietly ate the
// end of a member's NIC. Type is now sized in em off this base, which is
// itself in mm, so the type-to-card ratio is fixed under any mapping.
// 2.249mm is the old 8.5px at 96dpi, so the card looks exactly as before.
const CARD_BASE_FONT_MM = (8.5 * 25.4) / 96

// Chrome and the Android WebView inflate small text unless told not to. The
// card is a fixed-size document, so that inflation only ever breaks its
// layout — and this app renders entirely inside that WebView.
const CARD_TEXT = {
  fontSize: `${CARD_BASE_FONT_MM}mm`,
  WebkitTextSizeAdjust: "100%",
  textSizeAdjust: "100%",
} as CSSProperties

/**
 * Shrinks a value that would overrun its box instead of ellipsising it.
 *
 * These boxes hold identity data — a NIC with its last digits replaced by "…"
 * is worse than useless on a membership card, so nothing here is allowed to
 * silently drop characters. `maxChars` is what each box holds at its own size
 * with the widest realistic glyphs; past that the type scales down in
 * proportion, with a floor so it never shrinks into illegibility.
 */
function fitFont(value: string, em: number, maxChars: number): string {
  const scale = value.length > maxChars ? Math.max(0.62, maxChars / value.length) : 1
  return `${(em * scale).toFixed(4)}em`
}
const FRONT_RATIO = 2953 / 2195
const BACK_RATIO = 2955 / 2183

export function MembershipCardFront({
  member,
  cardRef,
}: {
  member: MembershipCardMember
  cardRef?: Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={cardRef}
      className="relative shrink-0 overflow-hidden rounded-xl"
      style={{ width: `${CARD_WIDTH_MM}mm`, aspectRatio: FRONT_RATIO, ...CARD_TEXT }}
    >
      <img src="/membership-card/front.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />

      {/* Photo — inside the gold-bordered box baked into the template */}
      <div
        className="absolute overflow-hidden rounded-[8%] bg-[#f6f1ee]"
        style={{ left: "8.6%", top: "37.6%", width: "26.7%", height: "44.6%" }}
      >
        {member.photoUrl && (
          <img src={member.photoUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Value boxes — Membership ID / Name / NIC / DOB */}
      <div
        className="absolute flex items-center overflow-hidden px-[2%] font-bold text-gray-900"
        style={{ left: "42.6%", top: "41.0%", width: "33.7%", height: "6.15%", fontSize: fitFont(member.memberCode ?? "—", 9 / 8.5, 15) }}
      >
        <span className="whitespace-nowrap">{member.memberCode ?? "—"}</span>
      </div>
      <div
        className="absolute flex items-center overflow-hidden px-[2%] font-bold uppercase text-gray-900"
        style={{ left: "42.6%", top: "54.7%", width: "33.7%", height: "5.47%", fontSize: fitFont(member.fullName, 7 / 8.5, 24) }}
      >
        <span className="whitespace-nowrap">{member.fullName}</span>
      </div>
      <div
        className="absolute flex items-center overflow-hidden px-[2%] font-bold text-gray-900"
        style={{ left: "42.6%", top: "67.0%", width: "33.7%", height: "5.47%", fontSize: fitFont(member.nic ?? "—", 1, 17) }}
      >
        <span className="whitespace-nowrap">{member.nic ?? "—"}</span>
      </div>
      <div
        className="absolute flex items-center overflow-hidden px-[2%] font-bold text-gray-900"
        style={{ left: "42.6%", top: "79.3%", width: "33.7%", height: "5.47%", fontSize: fitFont(formatDate(member.dateOfBirth), 1, 17) }}
      >
        <span className="whitespace-nowrap">{formatDate(member.dateOfBirth)}</span>
      </div>

      {/* Valid From / Valid Thru — small value line under each baked-in label */}
      <div className="absolute font-bold text-primary" style={{ left: "13.5%", bottom: "1.8%", fontSize: `${6.5 / 8.5}em` }}>
        {formatDate(member.validFrom ?? member.reviewedAt)}
      </div>
      <div className="absolute font-bold text-primary" style={{ left: "37%", bottom: "1.8%", fontSize: `${6.5 / 8.5}em` }}>
        {formatDate(member.validUntil)}
      </div>
    </div>
  )
}

function SignatureOverlay({ file, style }: { file: string; style: CSSProperties }) {
  return (
    <div className="absolute flex items-end justify-center overflow-hidden" style={style}>
      <img
        src={file}
        alt=""
        className="max-h-full max-w-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />
    </div>
  )
}

export function MembershipCardBack({ cardRef }: { cardRef?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      className="relative shrink-0 overflow-hidden rounded-xl"
      style={{ width: `${CARD_WIDTH_MM}mm`, aspectRatio: BACK_RATIO, ...CARD_TEXT }}
    >
      <img src="/membership-card/back.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />

      <SignatureOverlay file="/signature-president.png" style={{ left: "5.2%", top: "59%", width: "24.0%", height: "9.5%" }} />
      <SignatureOverlay file="/signature-secretary.png" style={{ left: "57.8%", top: "59%", width: "21.8%", height: "9.5%" }} />
    </div>
  )
}
