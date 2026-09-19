import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE_NAME, isValidSessionCookie } from "@/lib/admin-session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin | Muffin Plants",
  description: "Muffin Plants Admin Dashboard",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token || !(await isValidSessionCookie(token))) {
    redirect("/admin/login")
  }

  return children
}
