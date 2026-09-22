import type { Metadata } from "next"
import "./admin.css"

export const metadata: Metadata = {
  title: { absolute: "Admin - Muffin Plants" },
  description: "Muffin Plants Admin Dashboard",
}

// Auth is enforced in proxy.ts (page navigations) and lib/admin-auth.ts (server
// actions). Do not redirect here: this layout also wraps /admin/login, so an
// unauthenticated redirect to /admin/login would loop forever.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
