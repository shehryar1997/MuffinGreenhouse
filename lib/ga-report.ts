import { createSign } from "node:crypto"
import { unstable_cache } from "next/cache"

// Reads website numbers out of Google Analytics 4 for the admin dashboard (Data API, read-only).
// Needs a service account that has been added to the GA property as a Viewer. See .env.local.example.

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

export interface GaDay { date: string; users: number }
export interface GaPage { path: string; views: number }
export interface GaReport {
  users: number
  sessions: number
  views: number
  /** Percent change against the 7 days before, or null when there is nothing to compare with. */
  usersChange: number | null
  viewsChange: number | null
  days: GaDay[]
  pages: GaPage[]
}

export function isGaReportConfigured() {
  return Boolean(process.env.GA_PROPERTY_ID && process.env.GA_SERVICE_ACCOUNT_EMAIL && process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY)
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url")

async function getAccessToken(): Promise<string> {
  const email = process.env.GA_SERVICE_ACCOUNT_EMAIL!
  // Env files and Vercel keep the key on one line with literal "\n" in it.
  const key = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n")
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  )}`
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key)
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(signature)}` }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status})`)
  return (await res.json()).access_token as string
}

interface GaRow { dimensionValues?: Array<{ value: string }>; metricValues?: Array<{ value: string }> }
const rowsOf = (report: { rows?: GaRow[] } | undefined) => report?.rows ?? []
const num = (v: string | undefined) => Number(v ?? 0)
const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null)

async function fetchReport(): Promise<GaReport> {
  const token = await getAccessToken()
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA_PROPERTY_ID}:batchRunReports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      requests: [
        {
          dateRanges: [{ startDate: "6daysAgo", endDate: "today" }, { startDate: "13daysAgo", endDate: "7daysAgo" }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
        },
        {
          dateRanges: [{ startDate: "6daysAgo", endDate: "today" }],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "activeUsers" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        },
        {
          dateRanges: [{ startDate: "6daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 5,
        },
      ],
    }),
  })
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.error?.message
    throw new Error(`Analytics request failed (${res.status})${detail ? `: ${detail}` : ""}`)
  }
  const [totals, daily, pages] = (await res.json()).reports as Array<{ rows?: GaRow[] }>

  // With two date ranges GA adds a "date_range_N" dimension to each row.
  const range = (n: number) => rowsOf(totals).find((r) => r.dimensionValues?.[0]?.value === `date_range_${n}`)?.metricValues
  const cur = range(0), prev = range(1)

  return {
    users: num(cur?.[0]?.value),
    sessions: num(cur?.[1]?.value),
    views: num(cur?.[2]?.value),
    usersChange: change(num(cur?.[0]?.value), num(prev?.[0]?.value)),
    viewsChange: change(num(cur?.[2]?.value), num(prev?.[2]?.value)),
    days: rowsOf(daily).map((r) => ({ date: r.dimensionValues![0].value, users: num(r.metricValues![0].value) })),
    pages: rowsOf(pages).map((r) => ({ path: r.dimensionValues![0].value, views: num(r.metricValues![0].value) })),
  }
}

// Cached for 15 minutes so opening the dashboard doesn't hit Google every time. A thrown error is not cached.
export const getGaReport = unstable_cache(fetchReport, ["ga-report-7d"], { revalidate: 900 })
