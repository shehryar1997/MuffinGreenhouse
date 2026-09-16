import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE_NAME } from "@/lib/admin-session"

async function logout() {
  "use server"
  cookies().delete(COOKIE_NAME)
  redirect("/admin/login")
}

export default function AdminProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F3EA]">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/admin/products" className="font-serif text-lg">
          Muffin Admin
        </Link>
        <form action={logout}>
          <button type="submit" className="text-sm text-neutral-600 hover:text-neutral-900">
            Log out
          </button>
        </form>
      </div>
      <div className="p-6 max-w-5xl mx-auto">{children}</div>
    </div>
  )
}
