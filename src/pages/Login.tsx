import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LockIcon } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.login(email, password)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-linear-to-b from-sky-50 via-background to-background pt-safe pb-safe dark:from-sky-950/30">
      <div className="flex flex-col items-center px-6 pt-16 pb-8">
        <div className="rounded-3xl bg-white p-4 shadow-lg shadow-sky-100 ring-1 ring-sky-100 dark:shadow-none dark:ring-sky-900/40">
          <img
            src="/logo.png"
            alt="Kallar Central Sports Club crest"
            className="size-20 object-contain"
          />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-extrabold tracking-tight text-blue-950 dark:text-sky-100">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to manage the center
        </p>
      </div>

      <div className="flex-1 px-6">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@kcsc.lk"
                className="h-11 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl bg-blue-700 text-base font-semibold text-white hover:bg-blue-800"
              disabled={loading}
            >
              {loading ? <Spinner /> : "Sign in to Dashboard"}
            </Button>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LockIcon className="size-3.5" />
          Admin access only · Kallar Central Sports Club
        </p>
      </div>
    </div>
  )
}
