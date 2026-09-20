"use client"

import { FormEvent, useState } from "react"

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
    <div>
      <div className="bg-white rounded-lg border border-neutral-200 p-6 max-w-xl">
        <p className="text-neutral-600 text-sm mb-6">Sends from support@muffinplants.com.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Access password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-md border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              placeholder="customer@example.com"
              className="w-full h-10 px-3 rounded-md border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-md border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              In-Reply-To Message-ID <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              type="text"
              value={inReplyTo}
              onChange={(e) => setInReplyTo(e.target.value)}
              placeholder="e.g. CAB1234abc@mail.gmail.com"
              className="w-full h-10 px-3 rounded-md border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Keeps the reply threaded in the customer&apos;s inbox. Find it in Gmail: open their email → ⋮ menu → &quot;Show original&quot; → copy the Message-ID value.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 rounded-md border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D2C] focus:ring-offset-1 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#3f6b3f] text-white rounded-md font-medium text-sm hover:bg-[#355a35] disabled:opacity-60 disabled:cursor-default transition-colors"
          >
            {isLoading ? "Sending..." : "Send Email"}
          </button>

          {status.type && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                status.type === "ok"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {status.text}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
