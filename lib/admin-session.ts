// Web Crypto based, so it works in the proxy, Server Actions and route handlers
// alike (no dependency on Node's crypto.createHmac).
export const COOKIE_NAME = "admin_session"

import { safeEqual } from "@/lib/safe-compare"

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET && process.env.NODE_ENV !== "test") {
  console.warn(
    "SESSION_SECRET is not set. Admin login is disabled until it is set (any long random string)."
  )
}

const SESSION_EXPIRY_HOURS = 24 // Cookie expiry matches session expiry

// ----------------------------------------------------------------------
// HMAC helpers (Edge‑compatible Web Crypto)
// ----------------------------------------------------------------------

// A predictable fallback key is only ever used by `next dev`. Anywhere else a
// missing SESSION_SECRET must fail closed -- a known signing key would let
// anyone forge an admin session cookie.
const DEV_FALLBACK_SECRET = "dev-fallback-session-secret-do-not-use-in-production"

async function importKey(): Promise<CryptoKey> {
  const secret = SESSION_SECRET || (process.env.NODE_ENV === "development" ? DEV_FALLBACK_SECRET : undefined)
  if (!secret) {
    throw new Error("SESSION_SECRET is not set")
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
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

export async function verifyPassword(candidate: string | null | undefined): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false // never let an unset password match anything
  return safeEqual(candidate, expected)
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
  try {
    const decoded = await decodeSessionToken(value)
    if (!decoded) return false
    // Check expiry (allow 1 minute grace for clock skew)
    return decoded.expiresAt > Date.now() - 60_000
  } catch {
    // Malformed cookie (bad base64, missing SESSION_SECRET, ...) is simply "not logged in".
    return false
  }
}
