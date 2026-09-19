import { redirect } from "next/navigation"

// Admin root redirects to products (dashboard)
export default function AdminPage() {
  redirect("/admin/products")
}
