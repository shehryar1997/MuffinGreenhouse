import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME } from "@/lib/admin-session"

// The admin shell's "Log out" button POSTs here. This route never existed, so the request returned 404 and the
// button silently did nothing. The admin session is a stateless signed cookie, so logging out means clearing it
// (same path/flags it was set with in app/admin/login/page.tsx, otherwise the browser keeps the old one).
// ponytail: a cookie that was copied elsewhere stays valid until it expires (24 h); server-side revocation
// would need a session table.
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return NextResponse.json({ ok: true })
}
