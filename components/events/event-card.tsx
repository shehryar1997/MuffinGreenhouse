import Link from "next/link"
import Image from "next/image"
import { Clock, Leaf, MapPin, Users } from "lucide-react"
import type { Event } from "@/types"
import {
  EVENT_TYPE_LABEL,
  formatEventDay,
  formatEventMonth,
  formatEventPrice,
  formatEventTime,
} from "@/lib/event-format"
import { cn } from "@/lib/utils"

/** Small status pill: cancelled / sold out / few spots left. Null when there is nothing to flag. */
export function eventStatusLabel(event: Event): { text: string; tone: "muted" | "warn" } | null {
  if (event.status === "cancelled") return { text: "Cancelled", tone: "muted" }
  if (!event.isUpcoming) return null
  if (event.spotsRemaining === 0) return { text: "Sold out", tone: "muted" }
  if (event.spotsRemaining <= 3) return { text: `Only ${event.spotsRemaining} left`, tone: "warn" }
  return null
}

export function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  const status = eventStatusLabel(event)

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring",
        past && "opacity-75 hover:opacity-100"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {event.image ? (
          <Image
            src={event.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className={cn("object-cover transition-transform duration-500 group-hover:scale-105", past && "grayscale")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Leaf className="h-12 w-12 text-primary/30" aria-hidden />
          </div>
        )}

        <div className="absolute left-4 top-4 rounded-xl bg-background/95 px-3 py-2 text-center shadow-sm backdrop-blur">
          <div className="font-mono text-[10px] font-medium tracking-widest text-primary">{formatEventMonth(event.datetime)}</div>
          <div className="font-serif text-2xl leading-none text-foreground">{formatEventDay(event.datetime)}</div>
        </div>

        <div className="absolute right-4 top-4 rounded-full bg-background/95 px-3 py-1 font-mono text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {formatEventPrice(event.price)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-primary">
          <span>{EVENT_TYPE_LABEL[event.type]}</span>
          {status && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 normal-case tracking-normal",
                status.tone === "warn" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {status.text}
            </span>
          )}
        </div>
        <h3 className="mb-2 font-serif text-xl text-foreground transition-colors group-hover:text-primary">{event.title}</h3>
        <p className="mb-5 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>

        <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            <span>{formatEventTime(event.datetime, event.endDatetime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </div>
          {event.isUpcoming && event.status === "published" && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              <span>{event.spotsRemaining === 0 ? "No spots left" : `${event.spotsRemaining} of ${event.spotsTotal} spots open`}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
