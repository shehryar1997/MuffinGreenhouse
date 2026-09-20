// The one place the shop sends e-mail from. Every sender (order e-mails, sign-in codes, event e-mails, the admin
// reply form) calls sendEmail(), which tries one provider and, when that provider can't take the message, moves on
// to the next:
//
//   Resend    100 a day, 3,000 a month   (first choice: the domain has been verified there the longest)
//   Mailtrap  150 a day, 4,000 a month   (takes over when Resend's daily or monthly limit is used up)
//
// That is 250 a day in total. The providers themselves enforce their limits and report them in the error, so there
// is no counter to keep in step: when Resend says "daily quota exceeded" the mailer skips it for a while and uses
// Mailtrap, then tries Resend again later, which also picks up the daily reset without knowing when it happens.
//
// A message a provider rejects as invalid (a bad address, a missing field) is NOT retried elsewhere: the other
// provider would reject it too, and would only spend some of its quota.
//
// Set RESEND_API_KEY and/or MAILTRAP_API_TOKEN. With only one of them set, that one is used on its own.

import { Resend } from "resend"
import { FROM_EMAIL } from "./common"

export type ProviderName = "resend" | "mailtrap"

export interface OutgoingEmail {
  to: string
  subject: string
  text: string
  replyTo?: string
  headers?: Record<string, string>
}

export interface SendResult {
  provider: ProviderName
  id?: string
}

/** What went wrong with one attempt, in terms the mailer can act on. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly opts: {
      /** The message itself was refused (bad address etc.): don't try another provider. */
      final?: boolean
      /** The provider's sending limit is used up. */
      quota?: "daily" | "monthly"
    } = {}
  ) {
    super(message)
    this.name = "ProviderError"
  }
}

export interface Provider {
  name: ProviderName
  isConfigured(): boolean
  send(mail: OutgoingEmail): Promise<SendResult>
}

// A provider that reports its limit is used up is skipped for this long, then tried again. Short enough to notice a
// daily reset promptly (whenever the provider does it), long enough not to hit a closed door on every e-mail.
const DAILY_BACKOFF_MS = 30 * 60 * 1000
const MONTHLY_BACKOFF_MS = 6 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 12_000

// ---------- Resend ----------

type ResendErrorLike = { name?: string; message?: string; statusCode?: number | null }

/** Turns Resend's error into something the mailer can act on. Exported for tests. */
export function classifyResendError(error: ResendErrorLike): ProviderError {
  const message = `Resend: ${error.message ?? "unknown error"}`
  if (error.name === "daily_quota_exceeded") return new ProviderError(message, { quota: "daily" })
  if (error.name === "monthly_quota_exceeded") return new ProviderError(message, { quota: "monthly" })
  // 400/422: the message itself is wrong (missing field, bad parameter). Other providers would refuse it too.
  if (error.statusCode === 400 || error.statusCode === 422) return new ProviderError(message, { final: true })
  // Anything else (rate limit, key or domain problem, Resend down, network) is the provider's problem, not the message's.
  return new ProviderError(message)
}

const resendProvider: Provider = {
  name: "resend",
  isConfigured: () => Boolean(process.env.RESEND_API_KEY),
  async send(mail) {
    // Created per send: it is cheap, and this keeps the key from being read at build time.
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
      ...(mail.headers && Object.keys(mail.headers).length > 0 ? { headers: mail.headers } : {}),
    })
    if (error) throw classifyResendError(error)
    return { provider: "resend", id: data?.id }
  },
}

// ---------- Mailtrap ----------

/** "Muffin Plants <support@muffinplants.com>" -> { name, email } */
function parseAddress(value: string): { email: string; name?: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value)
  return match ? { email: match[2].trim(), ...(match[1] ? { name: match[1].replace(/^"|"$/g, "") } : {}) } : { email: value.trim() }
}

/** Turns a Mailtrap HTTP response into something the mailer can act on. Exported for tests. */
export function classifyMailtrapFailure(status: number, errors: string[]): ProviderError {
  const detail = errors.join("; ") || `HTTP ${status}`
  const message = `Mailtrap: ${detail}`
  if (/quota|limit/i.test(detail) && (status === 429 || status === 403)) {
    return new ProviderError(message, { quota: /month/i.test(detail) ? "monthly" : "daily" })
  }
  // 400/422: the message itself is wrong. Everything else (401/403 key or domain, 429 rate limit, 5xx) is Mailtrap's problem.
  if (status === 400 || status === 422) return new ProviderError(message, { final: true })
  return new ProviderError(message)
}

const mailtrapProvider: Provider = {
  name: "mailtrap",
  isConfigured: () => Boolean(process.env.MAILTRAP_API_TOKEN),
  async send(mail) {
    let response: Response
    try {
      response = await fetch("https://send.api.mailtrap.io/api/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.MAILTRAP_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: parseAddress(FROM_EMAIL),
          to: [{ email: mail.to }],
          subject: mail.subject,
          text: mail.text,
          ...(mail.replyTo ? { reply_to: parseAddress(mail.replyTo) } : {}),
          ...(mail.headers && Object.keys(mail.headers).length > 0 ? { headers: mail.headers } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (err) {
      throw new ProviderError(`Mailtrap: ${err instanceof Error ? err.message : "request failed"}`)
    }

    const body = (await response.json().catch(() => null)) as { success?: boolean; errors?: unknown; message_ids?: string[] } | null
    if (!response.ok || body?.success === false) {
      const errors = Array.isArray(body?.errors) ? body.errors.map(String) : []
      throw classifyMailtrapFailure(response.status, errors)
    }
    return { provider: "mailtrap", id: body?.message_ids?.[0] }
  },
}

// ---------- the mailer ----------

export class EmailSendError extends Error {
  constructor(readonly failures: Array<{ provider: ProviderName; message: string }>) {
    super(`E-mail could not be sent. ${failures.map((f) => f.message).join(" | ")}`)
    this.name = "EmailSendError"
  }
}

/** Builds a mailer over the given providers, in order of preference. `now` is injectable for tests. */
export function createMailer(providers: Provider[], now: () => number = Date.now) {
  const blockedUntil = new Map<ProviderName, number>()

  return async function send(mail: OutgoingEmail): Promise<SendResult> {
    const configured = providers.filter((p) => p.isConfigured())
    if (configured.length === 0) throw new Error("No e-mail provider is configured. Set RESEND_API_KEY and/or MAILTRAP_API_TOKEN.")

    // Providers that recently said their limit is used up go to the back of the queue rather than off it: if
    // every provider is out, trying them anyway beats silently dropping the e-mail.
    const isFree = (p: Provider) => (blockedUntil.get(p.name) ?? 0) <= now()
    const queue = [...configured.filter(isFree), ...configured.filter((p) => !isFree(p))]

    const failures: Array<{ provider: ProviderName; message: string }> = []
    for (const provider of queue) {
      try {
        const result = await provider.send(mail)
        blockedUntil.delete(provider.name)
        if (failures.length > 0) console.warn(`[email] sent through ${provider.name} after: ${failures.map((f) => f.message).join(" | ")}`)
        return result
      } catch (err) {
        const failure = err instanceof ProviderError ? err : new ProviderError(`${provider.name}: ${err instanceof Error ? err.message : "unknown error"}`)
        failures.push({ provider: provider.name, message: failure.message })
        if (failure.opts.quota) blockedUntil.set(provider.name, now() + (failure.opts.quota === "monthly" ? MONTHLY_BACKOFF_MS : DAILY_BACKOFF_MS))
        if (failure.opts.final) break
      }
    }

    const error = new EmailSendError(failures)
    console.error(`[email] "${mail.subject}" not sent:`, error.message)
    throw error
  }
}

const PROVIDERS: Record<ProviderName, Provider> = { resend: resendProvider, mailtrap: mailtrapProvider }

/** Order from EMAIL_PROVIDER_ORDER (e.g. "mailtrap,resend"); Resend first by default. Unknown names are ignored. */
function configuredOrder(): Provider[] {
  const wanted = (process.env.EMAIL_PROVIDER_ORDER ?? "resend,mailtrap")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderName => s === "resend" || s === "mailtrap")
  const unique = Array.from(new Set(wanted))
  // Anything not listed still comes after, so a typo in the setting can't leave a working provider unused.
  const rest = (Object.keys(PROVIDERS) as ProviderName[]).filter((n) => !unique.includes(n))
  return [...unique, ...rest].map((n) => PROVIDERS[n])
}

// One mailer per server instance, so the "this provider is out for now" memory is shared by every e-mail it sends.
let shared: ReturnType<typeof createMailer> | null = null

/** Sends one e-mail through whichever provider can take it. Throws EmailSendError if none could. */
export function sendEmail(mail: OutgoingEmail): Promise<SendResult> {
  shared ??= createMailer(configuredOrder())
  return shared(mail)
}

/** For the admin page: which providers are set up right now. */
export function providerStatus(): Array<{ name: ProviderName; configured: boolean }> {
  return configuredOrder().map((p) => ({ name: p.name, configured: p.isConfigured() }))
}
