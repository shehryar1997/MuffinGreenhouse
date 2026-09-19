"use server"

import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Clock, Package, AlertTriangle, ShoppingCart, TrendingUp, ArrowRight, CreditCard } from "lucide-react"
import { supabaseAdmin } from "@/supabase/admin-client"
import { isValidSessionCookie, COOKIE_NAME } from "@/lib/admin-session"

const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000
function getKarachiNow(): Date { return new Date(new Date().getTime() + KARACHI_OFFSET_MS) }
function startOfDayKarachi(d: Date): Date { const k = new Date(d.getTime()); k.setUTCHours(0,0,0,0); return new Date(k.getTime() - KARACHI_OFFSET_MS) }
function startOfMonthKarachi(d: Date): Date { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); return new Date(m.getTime() - KARACHI_OFFSET_MS) }
function rs(n: number): string { return `Rs ${n.toLocaleString("en-PK")}` }

const colorClasses: Record<string, { bg: string; iconBg: string; text: string }> = {
  amber: { bg: "bg-amber-50/80", iconBg: "bg-amber-500", text: "text-amber-700" },
  emerald: { bg: "bg-emerald-50/80", iconBg: "bg-emerald-500", text: "text-emerald-700" },
  rose: { bg: "bg-rose-50/80", iconBg: "bg-rose-500", text: "text-rose-700" },
  blue: { bg: "bg-blue-50/80", iconBg: "bg-blue-500", text: "text-blue-700" },
  violet: { bg: "bg-violet-50/80", iconBg: "bg-violet-500", text: "text-violet-700" },
}

export async function AdminDashboardPage() {
  const ck = await cookies()
  if (!isValidSessionCookie(ck.get(COOKIE_NAME)?.value)) redirect("/admin/login")

  const kn = getKarachiNow(), td = startOfDayKarachi(kn).toISOString(), sm = startOfMonthKarachi(kn).toISOString(), to = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()

  const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).or("status.eq.pending,payment_status.eq.pending"),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).or("status.eq.pending,payment_status.eq.pending").lt("created_at", to),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid").or("status.eq.confirmed,status.eq.processing"),
    supabaseAdmin.from("products").select("stock_count,low_stock_threshold").gt("stock_count", 0),
    supabaseAdmin.from("product_variants").select("stock_count,low_stock_threshold").gt("stock_count", 0),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", td),
    supabaseAdmin.from("orders").select("total").eq("payment_status", "paid").neq("status", "cancelled").gte("created_at", sm),
  ])

  const ap = r1.count ?? 0, op = r2.count ?? 0, ps = r3.count ?? 0
  const lsp = (r4.data ?? []).filter((x: any) => x.stock_count <= (x.low_stock_threshold ?? 5)).length
  const lsv = (r5.data ?? []).filter((x: any) => x.stock_count <= (x.low_stock_threshold ?? 5)).length
  const ot = r6.count ?? 0
  const rm = (r7.data ?? []).reduce((s: number, o: any) => s + Number(o.total ?? 0), 0)

  const Card = ({ label, value, icon: Icon, color, href, subtitle }: { label: string; value: string | number; icon: any; color: string; href: string; subtitle?: string }) => {
    const c = colorClasses[color]
    return <Link href={href} className="group"><div className={`rounded-2xl p-5 border hover:shadow-md transition-all ${c.bg} border-white/50`}><div className="flex items-start justify-between"><div className="min-w-0"><p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</p><p className="text-3xl font-bold text-neutral-900 mt-2">{value}</p>{subtitle && <p className={`text-xs mt-1 ${c.text}`}>{subtitle}</p>}</div><div className={`p-2.5 rounded-xl ${c.iconBg} shadow-sm shrink-0`}><Icon className="h-5 w-5 text-white" /></div></div><div className="mt-3 flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors"><span>View details</span><ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></div></div></Link>
  }

  return <div className="space-y-6"><div><h1 className="text-2xl font-serif font-bold text-neutral-900">Dashboard</h1><p className="text-sm text-neutral-500 mt-1">Overview of your store today</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"><Card label="Awaiting Payment" value={ap} icon={Clock} color="amber" href="/admin/orders?payment=pending" subtitle={op > 0 ? `${op} older than 12 hours` : undefined} /><Card label="Paid, Not Shipped" value={ps} icon={Package} color="emerald" href="/admin/orders?status=confirmed" /><Card label="Low Stock" value={lsp + lsv} icon={AlertTriangle} color="rose" href="/admin/products" subtitle={`${lsp} products, ${lsv} variants`} /><Card label="Orders Today" value={ot} icon={ShoppingCart} color="blue" href="/admin/orders" /><Card label="Revenue This Month" value={rs(rm)} icon={TrendingUp} color="violet" href="/admin/orders?payment=paid" /></div><div className="bg-white rounded-2xl border p-6"><h2 className="text-lg font-medium text-neutral-900 mb-4">Quick Actions</h2><div className="flex flex-wrap gap-3"><Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 text-sm font-medium"><Package className="h-4 w-4" /> Add Product</Link><Link href="/admin/orders" className="inline-flex items-center gap-2 px-4 py-2 bg-white border text-neutral-700 rounded-lg hover:bg-neutral-50 text-sm font-medium"><ShoppingCart className="h-4 w-4" /> View Orders</Link><Link href="/admin/email" className="inline-flex items-center gap-2 px-4 py-2 bg-white border text-neutral-700 rounded-lg hover:bg-neutral-50 text-sm font-medium"><CreditCard className="h-4 w-4" /> Send Email</Link></div></div></div>
}
