"use client"

import * as Sentry from "@sentry/nextjs"
import NextError from "next/error"
import { useEffect } from "react"

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        {/* App Router has no status code to pass here; 0 renders Next's generic error page. */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
