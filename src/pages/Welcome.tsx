import { useNavigate } from "react-router-dom"
import {
  ChevronRightIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  QrCodeIcon,
} from "lucide-react"

import { setWelcomeSeen } from "@/lib/storage"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: QrCodeIcon,
    title: "Scan-in attendance",
    text: "Mark students present in seconds with QR ID cards.",
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: CalendarCheckIcon,
    title: "Every session tracked",
    text: "See who turned up today and who needs a follow-up.",
    tint: "bg-success/10 text-success",
  },
  {
    icon: GraduationCapIcon,
    title: "Marks analysis",
    text: "Enter exam scores and see each student's progress by subject.",
    tint: "bg-gold/20 text-gold-foreground",
  },
]

export default function WelcomePage() {
  const navigate = useNavigate()

  const getStarted = async () => {
    await setWelcomeSeen()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-linear-to-b from-secondary via-background to-background pt-safe pb-safe">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-primary/10 ring-1 ring-border">
          <img
            src="/logo.png"
            alt="Kallar Central Sports Club crest"
            className="size-28 object-contain"
          />
        </div>
        <h1 className="mt-8 font-heading text-3xl font-extrabold tracking-tight text-primary">
          Kallar Central
          <br />
          Sports Club
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          The free tuition programme — students, attendance and marks, in your
          pocket.
        </p>
      </div>

      <div className="space-y-3 px-6">
        {features.map(({ icon: Icon, title, text, tint }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm"
          >
            <span className={`rounded-xl p-2.5 ${tint}`}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-8">
        <Button
          size="lg"
          className="h-12 w-full rounded-xl text-base font-semibold"
          onClick={getStarted}
        >
          Get Started
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
        <p className="mt-4 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Periyakallar
        </p>
      </div>
    </div>
  )
}
