import * as React from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  CalendarCheckIcon,
  GraduationCapIcon,
  HomeIcon,
  Layers2Icon,
  LogOutIcon,
  MenuIcon,
  QrCodeIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const tabs = [
  { to: "/dashboard", label: "Home", icon: HomeIcon },
  { to: "/students", label: "Students", icon: UsersIcon },
  { to: "/scanner", label: "Scan", icon: QrCodeIcon },
  { to: "/batches", label: "Batches", icon: Layers2Icon },
]

const moreLinks = [
  { to: "/marks", label: "Marks & Reports", icon: GraduationCapIcon },
  { to: "/attendance/today", label: "Today's Attendance", icon: CalendarCheckIcon },
]

// Admin-only — see RequireAdmin in App.tsx. Kept out of the primary 4-tab bar so
// the lms_manager and admin bottom nav stay visually identical; this only shows
// up in the "more" sheet, and only for admins.
const adminMoreLinks = [
  { to: "/members", label: "Club Members", icon: UserCogIcon },
]

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/scanner": "Scanner",
  "/batches": "Batches",
  "/marks": "Marks",
  "/attendance/today": "Today's Attendance",
  "/members": "Club Members",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { role } = useSession()
  const [moreOpen, setMoreOpen] = React.useState(false)
  const visibleMoreLinks = role === "admin" ? [...moreLinks, ...adminMoreLinks] : moreLinks

  const title =
    titles[location.pathname] ??
    (location.pathname.startsWith("/students")
      ? "Student Profile"
      : location.pathname.startsWith("/batches")
        ? "Batch"
        : location.pathname.startsWith("/classes")
          ? "Class Session"
          : location.pathname.startsWith("/members")
            ? "Member"
            : "KCSC")

  const handleLogout = async () => {
    await api.logout()
    setMoreOpen(false)
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 pt-safe backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <img src="/logo.png" alt="" className="size-8 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              Kallar Central Sports Club
            </p>
          </div>
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" aria-label="Menu" />}
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" className="pt-safe">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2">
                {visibleMoreLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
                        isActive && "bg-muted text-foreground"
                      )
                    }
                  >
                    <Icon className="size-4" />
                    {label}
                  </NavLink>
                ))}
                <Separator className="my-2" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOutIcon className="size-4" />
                  Sign out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 p-4 pb-safe-offset-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-safe backdrop-blur">
        <div className="grid h-16 grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors",
                  isActive && "text-primary"
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
