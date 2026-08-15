import { useEffect, useState } from "react"
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom"
import { SplashScreen } from "@capacitor/splash-screen"

import { getToken, getWelcomeSeen, getRole, type Role } from "@/lib/storage"
import { SessionProvider, useSession } from "@/lib/session"
import { AppShell } from "@/components/app-shell"
import { Spinner } from "@/components/ui/spinner"
import WelcomePage from "@/pages/Welcome"
import LoginPage from "@/pages/Login"
import DashboardPage from "@/pages/Dashboard"
import StudentsPage from "@/pages/Students"
import StudentDetailPage from "@/pages/StudentDetail"
import BatchesPage from "@/pages/Batches"
import BatchDetailPage from "@/pages/BatchDetail"
import ClassDetailPage from "@/pages/ClassDetail"
import ScannerPage from "@/pages/Scanner"
import MarksPage from "@/pages/Marks"
import AttendanceTodayPage from "@/pages/AttendanceToday"
import MembersPage from "@/pages/Members"
import MemberDetailPage from "@/pages/MemberDetail"
import AnalysisPage from "@/pages/Analysis"

/** Decides the landing screen: dashboard (authed) → welcome (first run) → login. */
function Launch() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [token, welcomeSeen] = await Promise.all([
        getToken(),
        getWelcomeSeen(),
      ])
      if (cancelled) return
      const target = token ? "/dashboard" : welcomeSeen ? "/login" : "/welcome"
      navigate(target, { replace: true })
      SplashScreen.hide().catch(() => {})
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return <div className="min-h-svh bg-background" />
}

function RequireAuth() {
  const [state, setState] = useState<{ authed: boolean; role: Role | null } | null>(null)

  useEffect(() => {
    Promise.all([getToken(), getRole()]).then(([token, role]) =>
      setState({ authed: Boolean(token), role })
    )
  }, [])

  if (state === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }
  if (!state.authed) return <Navigate to="/login" replace />
  return (
    <SessionProvider value={{ role: state.role }}>
      <AppShell>
        <Outlet />
      </AppShell>
    </SessionProvider>
  )
}

/**
 * Club membership is admin-only (see CLAUDE.md) — an lms_manager session never
 * reaches these screens even by direct navigation. The API enforces this too
 * (auth-guard.ts on the web app), so this is UX polish, not the real boundary.
 */
function RequireAdmin() {
  const { role } = useSession()
  if (role !== "admin") return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Launch />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/batches" element={<BatchesPage />} />
        <Route path="/batches/:id" element={<BatchDetailPage />} />
        <Route path="/classes/:id" element={<ClassDetailPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/marks" element={<MarksPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/attendance/today" element={<AttendanceTodayPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
