"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Users,
  ShoppingCart,
  Mail,
  LogOut,
  Sprout,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin/products", label: "Products", icon: Package, color: "#E85D2C" },
  { href: "/admin/customers", label: "Customers", icon: Users, color: "#3f6b3f" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, color: "#7EC8E3" },
  { href: "/admin/email", label: "Email", icon: Mail, color: "#D4F542" },
]

async function logout() {
  const response = await fetch("/api/admin/logout", { method: "POST" })
  if (response.ok) {
    window.location.href = "/admin/login"
  }
}

function NavLink({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href) || (href === "/admin/products" && pathname === "/admin")

  return (
    <Link href={href} className="group relative">
      <motion.div
        className={cn(
          "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
          isActive
            ? "bg-white/90 text-neutral-900 shadow-sm"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isActive ? color : "transparent",
            color: isActive ? "white" : "currentColor",
          }}
          className={cn(
            "p-1.5 rounded-lg transition-all duration-300",
            !isActive && "group-hover:text-white"
          )}
          style={{ backgroundColor: isActive ? color : "transparent" }}
        >
          <Icon className="h-4 w-4" />
        </motion.div>
        <span className={cn(isActive && "text-neutral-900")}>{label}</span>
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
            style={{ backgroundColor: color }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </motion.div>
    </Link>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F3EA] via-[#FAF7F2] to-[#F0EBE3]">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/admin/products" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E85D2C] to-[#d45124] flex items-center justify-center shadow-lg shadow-orange-500/20"
            >
              <Sprout className="h-5 w-5 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-lg font-semibold text-neutral-900 leading-tight">Muffin Admin</h1>
              <p className="text-[10px] text-neutral-500 tracking-wider uppercase">Dashboard</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-neutral-200/50 overflow-hidden bg-white/95 backdrop-blur-xl"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        pathname.startsWith(item.href)
                          ? "bg-[#E85D2C]/10 text-[#E85D2C]"
                          : "text-neutral-600 hover:bg-neutral-100"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                    </Link>
                  </motion.div>
                ))}
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navItems.length * 0.1 }}
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </motion.button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
