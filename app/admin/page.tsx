import { AdminShell } from "./_components/admin-shell"
import { AdminDashboardPage } from "./dashboard-page"

export const dynamic = "force-dynamic"

export default function AdminPage() {
  return (
    <AdminShell>
      <AdminDashboardPage />
    </AdminShell>
  )
}
