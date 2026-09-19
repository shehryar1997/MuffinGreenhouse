// How many e-mails this Resend account has sent in the current calendar month
// (1st 00:00 to the 1st of the next month, Pakistan time), read from Resend's API.
// Reading the list requires a Resend API key with "Full access" (a "Sending access"
// key can send but not list) -- the error case below says so.
import { Resend } from "resend"

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000 // Pakistan Standard Time, UTC+5, no DST
const PAGE_SIZE = 100
const MAX_PAGES = 60 // safety cap: 6,000 e-mails
const PAGE_DELAY_MS = 600 // Resend allows ~2 requests/second

export type MonthlyEmailCount =
  | { ok: true; count: number; monthLabel: string; capped: boolean }
  | { ok: false; error: string }

function monthStartUtc(now: Date): { start: Date; label: string } {
  const pkt = new Date(now.getTime() + PKT_OFFSET_MS)
  const year = pkt.getUTCFullYear()
  const month = pkt.getUTCMonth()
  const start = new Date(Date.UTC(year, month, 1) - PKT_OFFSET_MS)
  const label = new Date(Date.UTC(year, month, 1)).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
  return { start, label }
}

// Resend timestamps look like "2026-09-18 22:13:42.674981+00"; make them ISO-8601 for Date.parse.
function parseResendDate(value: string): number {
  const iso = value.trim().replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00")
  return Date.parse(iso)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function countEmailsSentThisMonth(now: Date = new Date()): Promise<MonthlyEmailCount> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set on the server." }

  const resend = new Resend(apiKey)
  const { start, label } = monthStartUtc(now)
  let count = 0
  let after: string | undefined

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await resend.emails.list(after ? { limit: PAGE_SIZE, after } : { limit: PAGE_SIZE })
    if (error || !data) {
      const message = error?.message ?? "Unknown error"
      return {
        ok: false,
        error: /restricted|sending access|permission|401|403/i.test(message)
          ? "Resend refused to list e-mails: the API key only has \"Sending access\". Create a key with \"Full access\" in the Resend dashboard and set it as RESEND_API_KEY."
          : `Couldn't read e-mails from Resend: ${message}`,
      }
    }

    // Newest first: count this month's, stop at the first one from before the month started.
    let reachedPreviousMonth = false
    for (const email of data.data) {
      const createdAt = parseResendDate(email.created_at)
      if (!Number.isNaN(createdAt) && createdAt < start.getTime()) {
        reachedPreviousMonth = true
        break
      }
      count++
    }

    if (reachedPreviousMonth || !data.has_more || data.data.length === 0) {
      return { ok: true, count, monthLabel: label, capped: false }
    }
    after = data.data[data.data.length - 1].id
    await sleep(PAGE_DELAY_MS)
  }

  return { ok: true, count, monthLabel: label, capped: true }
}
