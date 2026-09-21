"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { BookOpen, CalendarDays, ExternalLink, LayoutDashboard, LogOut, Mail, Menu, Package, ShoppingBag, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandLogo } from "./brand-logo"

type NavEntry = { href: string; label: string; icon: React.ElementType }

const NAV: Array<{ heading?: string; items: NavEntry[] }> = [
  { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    heading: "Store",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/journal", label: "Journal", icon: BookOpen },
    ],
  },
  { heading: "Tools", items: [{ href: "/admin/email", label: "Email", icon: Mail }] },
]

async function logout() {
  try {
    const response = await fetch("/api/admin/logout", { method: "POST" })
    if (response.ok) {
      window.location.href = "/admin/login"
      return
    }
  } catch {
    // fall through to the message below
  }
  // Used to fail silently, which is why "Log out" looked broken.
  toast.error("Couldn't log out. Check your connection and try again.")
}

// "/admin" (Dashboard) must match exactly: every admin URL starts with it.
function isNavActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/")
}

const itemBase =
  "relative flex h-9 w-full items-center gap-3 rounded-md px-3 text-[13.5px] transition-colors focus-visible:ring-offset-ink"

function NavItem({ entry, active, onNavigate }: { entry: NavEntry; active: boolean; onNavigate?: () => void }) {
  const Icon = entry.icon
  return (
    <Link
      href={entry.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(itemBase, active ? "bg-white/10 font-medium text-paper" : "text-paper/75 hover:bg-white/[0.06] hover:text-paper")}
    >
      {active && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sprout-300" />}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {entry.label}
    </Link>
  )
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="mx-1 mb-6 mt-1 flex items-center gap-3 rounded px-2 focus-visible:ring-offset-ink">
        <BrandLogo chip className="h-11 w-11" />
        <span className="min-w-0">
          <span className="block font-serif text-[22px] leading-none tracking-tight text-paper">Muffin</span>
          <span className="mt-1.5 block text-xs text-paper/60">Greenhouse admin</span>
        </span>
      </Link>

      <nav aria-label="Admin sections" className="flex-1 space-y-5 overflow-y-auto">
        {NAV.map((group, i) => (
          <div key={group.heading ?? i}>
            {group.heading && <p className="mb-1.5 px-3 text-[11px] font-medium text-paper/55">{group.heading}</p>}
            <div className="space-y-0.5">
              {group.items.map((entry) => (
                <NavItem key={entry.href} entry={entry} active={isNavActive(pathname, entry.href)} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-0.5 border-t border-white/10 pt-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(itemBase, "text-paper/75 hover:bg-white/[0.06] hover:text-paper")}
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          View storefront
        </a>
        <button type="button" onClick={logout} className={cn(itemBase, "text-paper/75 hover:bg-white/[0.06] hover:text-paper")}>
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          Log out
        </button>
      </div>
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // The phone menu remembers which page it was opened on, so any navigation (links, back/forward) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const menuOpen = openOn === pathname
  const setMenuOpen = (open: boolean) => setOpenOn(open ? pathname : null)

  return (
    <div className="admin-scope min-h-screen bg-background text-sm text-foreground antialiased">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-ink px-3 py-5 print:hidden lg:block">
        <SidebarBody pathname={pathname} />
      </aside>

      {/* Phone top bar + slide-out menu */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 print:hidden lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5 font-serif text-xl tracking-tight text-paper focus-visible:ring-offset-ink">
          <BrandLogo chip className="h-9 w-9" />
          <span>
            Muffin <span className="font-sans text-xs text-paper/60">admin</span>
          </span>
        </Link>
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-paper transition-colors hover:bg-white/10 focus-visible:ring-offset-ink"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/60 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content
              aria-describedby={undefined}
              className="admin-scope fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-ink px-3 py-5 text-paper duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
            >
              <Dialog.Title className="sr-only">Menu</Dialog.Title>
              <Dialog.Close
                aria-label="Close menu"
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-paper/75 transition-colors hover:bg-white/10 hover:text-paper focus-visible:ring-offset-ink"
              >
                <X className="h-4 w-4" aria-hidden />
              </Dialog.Close>
              <SidebarBody pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <main id="main-content" tabIndex={-1} className="focus:outline-none lg:pl-60 print:pl-0">
        <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-10 print:max-w-none print:p-0">{children}</div>
      </main>
    </div>
  )
}
