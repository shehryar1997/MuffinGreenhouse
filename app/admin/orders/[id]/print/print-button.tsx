"use client"

import { Printer } from "lucide-react"

// Split out from the (server) print page: `window.print()` needs a client component,
// and the page itself must stay server-only because it queries `supabaseAdmin`
// (service role) -- that must never ship in a client bundle.
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#E85D2C] text-white rounded-lg hover:bg-[#E85D2C]/90"
    >
      <Printer className="h-4 w-4" />
      Print Packing Slip
    </button>
  )
}
