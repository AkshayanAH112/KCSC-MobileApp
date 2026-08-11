import { useEffect, useState } from "react"
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom"
import { SplashScreen } from "@capacitor/splash-screen"

import { getToken, getWelcomeSeen } from "@/lib/storage"
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
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    getToken().then((token) => setAuthed(Boolean(token)))
  }, [])

  if (authed === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }
  if (!authed) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
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
        <Route path="/attendance/today" element={<AttendanceTodayPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
