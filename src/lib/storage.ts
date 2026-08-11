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

const WELCOME_KEY = "welcome_seen"

export async function getWelcomeSeen(): Promise<boolean> {
  const { value } = await Preferences.get({ key: WELCOME_KEY })
  return value === "true"
}

export async function setWelcomeSeen(): Promise<void> {
  await Preferences.set({ key: WELCOME_KEY, value: "true" })
}
