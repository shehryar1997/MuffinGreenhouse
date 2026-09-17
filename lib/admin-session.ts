// Edge-compatible (Web Crypto works in both middleware and Server Actions,
// unlike Node's crypto.createHmac which isn't available in Edge middleware).
export const COOKIE_NAME = "admin_session"

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET && process.env.NODE_ENV !== "test") {
  console.warn(
    "SESSION_SECRET is not set. Admin sessions will be invalid. Add SESSION_SECRET to .env.local (any random string)."
  )
}

const SESSION_EXPIRY_HOURS = 24 // Cookie expiry matches session expiry

// ----------------------------------------------------------------------
// HMAC helpers (Edge‑compatible Web Crypto)
// ----------------------------------------------------------------------

async function importKey(): Promise<CryptoKey> {
  if (!SESSION_SECRET) {
    // Fallback for development without SESSION_SECRET: use a predictable key.
    // In production, SESSION_SECRET must be set.
    const fallback = "dev-fallback-session-secret-do-not-use-in-production"
    const encoder = new TextEncoder()
    return crypto.subtle.importKey(
      "raw",
      encoder.encode(fallback),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )
  }
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

async function sign(payload: string): Promise<string> {
  const key = await importKey()
  const data = new TextEncoder().encode(payload)
  const signature = await crypto.subtle.sign("HMAC", key, data)
  // Convert signature to base64url
  const bytes = new Uint8Array(signature)
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("")
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

async function verify(payload: string, signatureB64: string): Promise<boolean> {
  const key = await importKey()
  // Convert base64url to binary
  const binSignature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  )
  const data = new TextEncoder().encode(payload)
  return crypto.subtle.verify("HMAC", key, binSignature, data)
}

// ----------------------------------------------------------------------
// Session token encoding / decoding
// ----------------------------------------------------------------------

function encodeSessionToken(sessionId: string, expiresAt: number): Promise<string> {
  const payload = `${sessionId}|${expiresAt}`
  return sign(payload).then((sig) => `${payload}.${sig}`)
}

async function decodeSessionToken(token: string): Promise<{ sessionId: string; expiresAt: number } | null> {
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [payload, signature] = parts
  if (!(await verify(payload, signature))) return null
  const [sessionId, expiresAtStr] = payload.split("|")
  const expiresAt = Number(expiresAtStr)
  if (!sessionId || !expiresAtStr || Number.isNaN(expiresAt)) return null
  return { sessionId, expiresAt }
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

export async function verifyPassword(candidate: string): Promise<boolean> {
  return candidate === process.env.ADMIN_PASSWORD
}

/**
 * Generates a new random session ID and returns a signed session token.
 * The token contains the session ID and an expiry timestamp (now + SESSION_EXPIRY_HOURS).
 */
export async function getSessionCookieValue(): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  return encodeSessionToken(sessionId, expiresAt)
}

/**
 * Validates a session token: checks HMAC signature and ensures it hasn't expired.
 */
export async function isValidSessionCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false
  const decoded = await decodeSessionToken(value)
  if (!decoded) return false
  // Check expiry (allow 1 minute grace for clock skew)
  return decoded.expiresAt > Date.now() - 60_000
}
