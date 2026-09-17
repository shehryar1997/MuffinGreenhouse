import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE_NAME } from "@/lib/admin-session"

async function logout() {
  "use server"
  cookies().delete(COOKIE_NAME)
  redirect("/admin/login")
}

// Shared nav chrome for every authenticated /admin/* section. Each section
// folder (products, customers, orders, email) gets a thin layout.tsx that
// just renders <AdminShell>{children}</AdminShell> — keeps the nav links in
// one place instead of duplicated per section.
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F3EA]">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/products" className="font-serif text-lg">
            Muffin Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/products"
              className="text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100"
            >
              Products
            </Link>
            <Link
              href="/admin/customers"
              className="text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100"
            >
              Customers
            </Link>
            <Link
              href="/admin/orders"
              className="text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100"
            >
              Orders
            </Link>
            <Link
              href="/admin/email"
              className="text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100"
            >
              Email
            </Link>
          </nav>
        </div>
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
