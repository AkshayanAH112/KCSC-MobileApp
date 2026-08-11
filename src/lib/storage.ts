import { Preferences } from "@capacitor/preferences"

const TOKEN_KEY = "auth_token"

export async function getToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: TOKEN_KEY })
  return value
}

export async function setToken(token: string): Promise<void> {
  await Preferences.set({ key: TOKEN_KEY, value: token })
}

export async function clearToken(): Promise<void> {
  await Preferences.remove({ key: TOKEN_KEY })
}

export type Role = "admin" | "lms_manager"
const ROLE_KEY = "auth_role"

// Stored locally purely for nav gating (hiding Club Members from an lms_manager).
// The real authorization boundary is the API's own role check on every request
// (see Web app/lib/auth-guard.ts) — this value is never trusted for anything else.
export async function getRole(): Promise<Role | null> {
  const { value } = await Preferences.get({ key: ROLE_KEY })
  return value === "admin" || value === "lms_manager" ? value : null
}

export async function setRole(role: Role): Promise<void> {
  await Preferences.set({ key: ROLE_KEY, value: role })
}

export async function clearRole(): Promise<void> {
  await Preferences.remove({ key: ROLE_KEY })
}

const WELCOME_KEY = "welcome_seen"

export async function getWelcomeSeen(): Promise<boolean> {
  const { value } = await Preferences.get({ key: WELCOME_KEY })
  return value === "true"
}

export async function setWelcomeSeen(): Promise<void> {
  await Preferences.set({ key: WELCOME_KEY, value: "true" })
}
