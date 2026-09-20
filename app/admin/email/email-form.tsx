"use client"

import { FormEvent, useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Alert, Field, buttonClass, inputClass, textareaClass } from "../_components/ui"
import { PasswordInput } from "../_components/password-input"

export function EmailForm() {
  const [password, setPassword] = useState("")
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [inReplyTo, setInReplyTo] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<{ type: "ok" | "err" | null; text: string }>({ type: null, text: "" })
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setStatus({ type: null, text: "" })

    const payload = {
      password,
      to,
      subject,
      inReplyTo,
      message,
    }

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus({ type: "ok", text: `Sent! Email ID: ${data.id}` })
        setTo("")
        setSubject("")
        setInReplyTo("")
        setMessage("")
      } else {
        setStatus({ type: "err", text: `Error: ${data.error || "Unknown error"}` })
      }
    } catch (err) {
      setStatus({ type: "err", text: `Network error: ${err}` })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="To" required>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
          placeholder="customer@example.com"
          className={inputClass}
        />
      </Field>

      <Field label="Subject" required>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required className={inputClass} />
      </Field>

      <Field label="Message" required>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={9} className={`${textareaClass} resize-y`} />
      </Field>

      <Field
        label={
          <>
            In-Reply-To Message-ID <span className="font-normal text-muted-foreground">(optional)</span>
          </>
        }
        hint={
          <>
            Keeps the reply threaded in the customer&apos;s inbox. Find it in Gmail: open their email → ⋮ menu → &quot;Show original&quot; → copy the Message-ID value.
          </>
        }
      >
        <input
          type="text"
          value={inReplyTo}
          onChange={(e) => setInReplyTo(e.target.value)}
          placeholder="e.g. CAB1234abc@mail.gmail.com"
          className={`${inputClass} font-mono`}
        />
      </Field>

      <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end">
        <Field label="Access password" required htmlFor="email-access-password" className="sm:max-w-xs sm:flex-1">
          <PasswordInput id="email-access-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="off" />
        </Field>
        <button type="submit" disabled={isLoading} className={buttonClass({ variant: "primary", size: "md", className: "sm:ml-auto" })}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {isLoading ? "Sending…" : "Send email"}
        </button>
      </div>

      {status.type && <Alert tone={status.type === "ok" ? "success" : "danger"}>{status.text}</Alert>}
    </form>
  )
}
