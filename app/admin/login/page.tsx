import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyPassword, getSessionCookieValue, COOKIE_NAME } from "@/lib/admin-session"

async function login(formData: FormData) {
  "use server"
  const password = formData.get("password") as string
  const ok = await verifyPassword(password)

  if (!ok) {
    redirect("/admin/login?error=1")
  }

  const token = await getSessionCookieValue()
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours, matches session token expiry
    path: "/",
  })
  redirect("/admin/products")
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3EA] px-4">
      <form action={login} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border">
        <h1 className="text-xl font-serif mb-6">Muffin Admin</h1>
        {searchParams.error && (
          <p className="text-sm text-red-600 mb-4">Wrong password. Try again.</p>
        )}
        <label className="block text-sm font-medium mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full border rounded px-3 py-2 mb-4 text-sm"
        />
        <button
          type="submit"
          className="w-full bg-[#E85D2C] text-white rounded px-3 py-2 font-medium text-sm"
        >
          Log in
        </button>
      </form>
    </div>
  )
}
