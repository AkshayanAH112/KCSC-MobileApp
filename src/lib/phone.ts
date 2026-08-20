/**
 * Client-side mirror of the server check in the Web app's lib/validation.ts —
 * local Sri Lankan format for Student.guardianPhone, 10 digits starting with
 * 0 (e.g. 0701212234). Spaces/hyphens are tolerated while typing, then
 * stripped before checking.
 */
export function isValidPhoneLocal(value: string): boolean {
  return /^0\d{9}$/.test(value.replace(/[\s-]/g, ""))
}

export const PHONE_HINT = "Enter a valid 10-digit phone number starting with 0 (e.g. 0701212234)"
