import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isAdminRequest } from "@/lib/admin-auth"
import { slugify } from "@/lib/event-format"

export const dynamic = "force-dynamic"

// Spreadsheet apps run text starting with = + - @ as a formula, so defuse those before quoting.
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const [{ data: event }, { data: regs, error }] = await Promise.all([
    supabaseAdmin.from("events").select("title").eq("id", id).maybeSingle(),
    supabaseAdmin
      .from("event_registrations")
      .select("reference, guest_name, guest_phone, guest_email, spots_reserved, amount_due, amount_paid, payment_status, payment_method, payment_reference, attended, cancelled_at, cancel_reason, admin_notes, created_at")
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
  ])
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = ["Reference", "Name", "Phone", "E-mail", "People", "Amount due", "Amount paid", "Payment", "Method", "Payment ref", "Checked in", "Status", "Notes", "Booked at (UTC)"]
  const lines = [header.map(csvCell).join(",")]
  for (const r of regs ?? []) {
    lines.push(
      [
        r.reference,
        r.guest_name,
        r.guest_phone,
        r.guest_email,
        r.spots_reserved,
        r.amount_due,
        r.amount_paid,
        r.payment_status,
        r.payment_method,
        r.payment_reference,
        r.attended ? "yes" : "no",
        r.cancelled_at ? `cancelled (${r.cancel_reason ?? "admin"})` : "active",
        r.admin_notes,
        r.created_at,
      ]
        .map(csvCell)
        .join(",")
    )
  }

  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendees-${slugify(event.title) || "event"}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
