import { createContext, useContext } from "react"
import type { Role } from "@/lib/storage"

/**
 * Role for the current session, provided by RequireAuth in App.tsx (it already reads
 * storage once to gate the route). Exists so AppShell and page components can decide
 * what to show without each doing their own Preferences read.
 */
const SessionContext = createContext<{ role: Role | null }>({ role: null })

export const SessionProvider = SessionContext.Provider

export function useSession() {
  return useContext(SessionContext)
}
