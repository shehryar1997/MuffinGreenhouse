import { AdminShell } from "@/app/admin/_components/admin-shell"

export default function AdminOrdersLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
