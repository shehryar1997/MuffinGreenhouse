// Edge-compatible (Web Crypto works in both middleware and Server Actions,
// unlike Node's crypto.createHmac which isn't available in Edge middleware).
export const COOKIE_NAME = "admin_session"

async function computeSessionToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set")
  }
  const data = new TextEncoder().encode(`muffin-admin:${password}`)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  return candidate === process.env.ADMIN_PASSWORD
}

export async function getSessionCookieValue(): Promise<string> {
  return computeSessionToken()
}

export async function isValidSessionCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false
  const expected = await computeSessionToken()
  return value === expected
}
