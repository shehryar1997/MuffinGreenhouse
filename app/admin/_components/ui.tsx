import Link from "next/link"
import { ArrowLeft, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

// Building blocks for the admin panel. Nothing here holds state, so it works from server and client components alike.
// Look: warm paper canvas, white panels with hairline borders, square-ish corners, no shadows or gradients.
// Forest green for the primary action, clay (the `primary` token) only for links and things that need attention.

/* ------------------------------------------------------------------ buttons */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-solid"
export type ButtonSize = "sm" | "md" | "lg"

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-forest-700 text-white hover:bg-forest-800",
  secondary: "border border-input bg-surface text-foreground hover:bg-muted",
  ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
  danger: "border border-red-300 bg-surface text-red-700 hover:bg-red-50",
  "danger-solid": "bg-red-700 text-white hover:bg-red-800",
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
}

export function buttonClass({
  variant = "secondary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />
}

/* ------------------------------------------------------------------ page + panels */

export function PageHeader({
  title,
  description,
  back,
  actions,
  badges,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  back?: { href: string; label: string }
  actions?: React.ReactNode
  badges?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1.5 rounded text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-serif text-[28px] font-medium leading-tight text-foreground [overflow-wrap:anywhere]">{title}</h1>
          {badges}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  /** No padding around the body: for tables and lists that run edge to edge. */
  flush?: boolean
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="font-sans text-[15px] font-semibold leading-6 tracking-normal text-foreground">{title}</h2>}
            {description && <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && "p-5", bodyClassName)}>{children}</div>
    </section>
  )
}

export interface Stat {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  href?: string
  /** Highlights the cell, for stats that double as filters. */
  active?: boolean
  /** Warms the hint colour for a stat that needs someone to act. */
  warn?: boolean
}

const statGrid: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1",
}

/** One bordered strip divided into cells. Reads as a row of figures rather than a grid of cards. */
export function StatStrip({ items, className }: { items: Stat[]; className?: string }) {
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-lg border border-border bg-border", statGrid[items.length] ?? statGrid[4], className)}>
      {items.map((s) => {
        const body = (
          <>
            <p className="text-[13px] text-muted-foreground">{s.label}</p>
            <p className="mt-1.5 text-[26px] font-semibold leading-8 tracking-tight tabular-nums text-foreground">{s.value}</p>
            {s.hint && <p className={cn("mt-1 text-xs", s.warn ? "text-amber-800" : "text-muted-foreground")}>{s.hint}</p>}
          </>
        )
        const cell = cn(
          "block bg-surface px-5 py-4",
          s.active && "shadow-[inset_0_2px_0_0_hsl(var(--primary))]",
          s.href && "transition-colors hover:bg-cream-50"
        )
        return s.href ? (
          <Link key={s.label} href={s.href} className={cell} aria-current={s.active ? "true" : undefined}>
            {body}
          </Link>
        ) : (
          <div key={s.label} className={cell}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

export function FilterTabs({
  label,
  items,
}: {
  label: string
  items: Array<{ href: string; label: string; count?: number; active: boolean }>
}) {
  return (
    <nav aria-label={label} className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {items.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
            t.active
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">{t.count}</span>}
        </Link>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ badges + alerts */

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent"

const toneStyles: Record<Tone, { chip: string; dot: string }> = {
  neutral: { chip: "bg-muted text-foreground/75", dot: "bg-neutral-400" },
  success: { chip: "bg-forest-100 text-forest-800", dot: "bg-forest-500" },
  warning: { chip: "bg-amber-100 text-amber-900", dot: "bg-amber-500" },
  danger: { chip: "bg-red-100 text-red-800", dot: "bg-red-500" },
  info: { chip: "bg-sky-100 text-sky-900", dot: "bg-sky-500" },
  accent: { chip: "bg-clay-100 text-clay-800", dot: "bg-clay-500" },
}

export function Badge({ tone = "neutral", dot = true, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  const t = toneStyles[tone]
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium leading-5", t.chip, className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} aria-hidden />}
      {children}
    </span>
  )
}

export const orderTone = (status: string): Tone =>
  status === "pending" ? "warning" : status === "delivered" ? "success" : status === "cancelled" ? "danger" : "info"

export const paymentTone = (status: string): Tone =>
  status === "paid" ? "success" : status === "failed" ? "danger" : status === "refunded" ? "neutral" : "warning"

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge tone={orderTone(status)} className="capitalize">{status}</Badge>
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge tone={paymentTone(status)} className="capitalize">{status}</Badge>
}

const alertStyles = {
  danger: { box: "border-red-200 bg-red-50 text-red-900", icon: CircleAlert, iconClass: "text-red-600" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: TriangleAlert, iconClass: "text-amber-600" },
  success: { box: "border-forest-200 bg-forest-50 text-forest-900", icon: CircleCheck, iconClass: "text-forest-600" },
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: Info, iconClass: "text-sky-600" },
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof alertStyles
  title?: string
  children?: React.ReactNode
  className?: string
}) {
  const s = alertStyles[tone]
  const Icon = s.icon
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", s.box, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.iconClass)} aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "opacity-90")}>{children}</div>}
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-input bg-surface/60 px-6 py-14 text-center", className)}>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ tables */

export function TableShell({ children, minWidth, className }: { children: React.ReactNode; minWidth?: string; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border bg-surface", className)}>
      <table className={cn("w-full text-sm", minWidth)}>{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border bg-muted/50">{children}</thead>
}

export function Th({ children, align = "left", className }: { children?: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <th scope="col" className={cn("whitespace-nowrap px-4 py-2.5 text-xs font-medium text-muted-foreground", align === "right" ? "text-right" : "text-left", className)}>
      {children}
    </th>
  )
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-b border-border last:border-0 hover:bg-muted/40", className)}>{children}</tr>
}

export function Td({ children, align = "left", className, colSpan }: { children?: React.ReactNode; align?: "left" | "right"; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle", align === "right" && "text-right", className)}>
      {children}
    </td>
  )
}

/** A quiet in-table link: dark, underlined on hover. Use `linkClass` for a run-in text link. */
export const rowLinkClass = "font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
export const linkClass = "text-primary underline-offset-2 hover:underline"

/* ------------------------------------------------------------------ form pieces */

export const inputClass =
  "h-9 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground/80 transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"

export const textareaClass = cn(inputClass, "h-auto min-h-[5rem] py-2 leading-relaxed")

export function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  required?: boolean
  /** Pass the control's id to associate the label explicitly. Needed when the control holds a button (password toggle). */
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  const text = (
    <span className="mb-1.5 block text-[13px] font-medium text-foreground">
      {label}
      {required && (
        <span aria-hidden className="ml-0.5 text-primary">
          *
        </span>
      )}
    </span>
  )
  return (
    <div className={className}>
      {htmlFor ? (
        <>
          <label htmlFor={htmlFor}>{text}</label>
          {children}
        </>
      ) : (
        <label className="block">
          {text}
          {children}
        </label>
      )}
      {hint && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function CheckField({
  label,
  description,
  className,
  ...input
}: { label: React.ReactNode; description?: React.ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-forest-700" {...input} />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>}
      </span>
    </label>
  )
}

/**
 * A titled group of fields. Heading and blurb sit in a left rail on wide screens, the fields in a panel beside it.
 * Pass `className="hidden"` to hide a whole section without unmounting it (the product form relies on that).
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("grid gap-x-10 gap-y-4 border-b border-border py-8 first:pt-0 last:border-b-0 lg:grid-cols-[13rem_minmax(0,1fr)]", className)}>
      <div>
        <h2 className="font-sans text-[15px] font-semibold tracking-normal text-foreground">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">{children}</div>
    </section>
  )
}

/** Sticks to the bottom of the viewport so Save stays in reach on long forms. */
export function FormActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 flex flex-wrap items-center gap-3 border-t border-border bg-background py-3",
        className
      )}
    >
      {children}
    </div>
  )
}

export const waButtonClass = buttonClass({ variant: "secondary", size: "md", className: "text-[#0B6B4F]" })

/** A thin progress bar. Turns amber at 80% and red at 100% unless `tone` says otherwise. */
export function Meter({ value, max, label, tone = "bg-forest-600", className }: { value: number; max: number; label: string; tone?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", pct >= 100 ? "bg-red-600" : pct >= 80 ? "bg-amber-500" : tone)} style={{ width: `${pct}%` }} />
    </div>
  )
}
