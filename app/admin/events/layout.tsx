import { AdminShell } from "@/app/admin/_components/admin-shell"

export default function AdminEventsLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
