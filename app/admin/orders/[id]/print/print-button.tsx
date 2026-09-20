"use client"

import { Printer } from "lucide-react"
import { buttonClass } from "../../../_components/ui"

// Split out from the (server) print page: `window.print()` needs a client component,
// and the page itself must stay server-only because it queries `supabaseAdmin`
// (service role) -- that must never ship in a client bundle.
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass({ variant: "primary" })}>
      <Printer className="h-4 w-4" aria-hidden />
      Print packing slip
    </button>
  )
}
