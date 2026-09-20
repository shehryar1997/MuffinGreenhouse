// E-mails for event bookings (workshops, plant walks, markets):
//   sendEventBookingReceivedEmail  right after a booking. A paid event: "your spot is held for 24 hours, here is how to
//                                  pay". A free event: "you're booked".
//   sendEventPaymentConfirmedEmail when the booking is marked paid in the admin panel: "payment received, you're in".
//
// Same plain-text style as the order e-mails (lib/email/send-booking-received.ts). Both are best-effort: the callers
// send them after the booking is saved and never let a failed e-mail undo it.
import { paymentAccountsAsText } from "@/config/payment-accounts"
import { formatEventDate, formatEventTime, googleCalendarLink } from "@/lib/event-format"
import { SITE_URL, WHATSAPP_NUMBER, emailSignOff, formatEmailPrice } from "./common"
import { sendEmail } from "./mailer"

export interface EventEmailData {
  toEmail: string
  guestName: string
  reference: string
  spots: number
  amountDue: number
  event: { title: string; slug: string; datetime: string; endDatetime: string | null; location: string }
}

const greeting = (name: string) => (name.trim() ? `Hi ${name.trim().split(/\s+/)[0]},` : "Hi there,")

function detailsBlock(data: EventEmailData): string {
  const { event } = data
  return [
    "---",
    "BOOKING DETAILS",
    "---",
    `Event: ${event.title}`,
    `When: ${formatEventDate(event.datetime)}, ${formatEventTime(event.datetime, event.endDatetime)} (Karachi time)`,
    `Where: ${event.location}`,
    `Spots: ${data.spots}`,
    `Booking reference: ${data.reference}`,
  ].join("\n")
}

const calendarLine = (data: EventEmailData) =>
  `Add it to your calendar: ${googleCalendarLink({
    title: data.event.title,
    startIso: data.event.datetime,
    endIso: data.event.endDatetime,
    location: data.event.location,
  })}`

const eventPage = (data: EventEmailData) => `Event page: ${SITE_URL}/events/${data.event.slug}`

const spotsWord = (n: number) => (n === 1 ? "spot" : "spots")

/** Sent right after a booking. `holdUntil` is when an unpaid booking's spots are released (24 hours later). */
export async function sendEventBookingReceivedEmail(data: EventEmailData & { holdUntil: Date }): Promise<void> {
  const free = data.amountDue === 0

  if (free) {
    await sendEmail({
      to: data.toEmail,
      subject: `You're booked - ${data.event.title} - ${data.reference}`,
      text: `${greeting(data.guestName)}

You're booked for ${data.event.title}! We've reserved ${data.spots} ${spotsWord(data.spots)} for you, and there is nothing to pay.

${detailsBlock(data)}

${calendarLine(data)}

We'll message you on WhatsApp with the final details before the day. If your plans change, message us at ${WHATSAPP_NUMBER}, quoting booking reference ${data.reference}, so we can free the spot for someone else.

${eventPage(data)}

${emailSignOff()}`,
    })
    return
  }

  // Deadlines are shown in Pakistan time regardless of where the server runs.
  const deadline = data.holdUntil.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" })
  await sendEmail({
    to: data.toEmail,
    subject: `Your spot is held for 24 hours - ${data.event.title} - ${data.reference}`,
    text: `${greeting(data.guestName)}

Thanks for booking ${data.event.title}! We're holding ${data.spots} ${spotsWord(data.spots)} for you for the next 24 hours.

${detailsBlock(data)}
Amount to pay: ${formatEmailPrice(data.amountDue)}

---
HOW TO CONFIRM YOUR SPOT
---
Please send ${formatEmailPrice(data.amountDue)} within 24 hours (by ${deadline}) to any one of these accounts:

${paymentAccountsAsText()}

Then share your payment receipt with us on WhatsApp at ${WHATSAPP_NUMBER}, quoting booking reference ${data.reference}. Once we confirm your payment, we will send you another e-mail.

If we don't receive payment within 24 hours, your ${spotsWord(data.spots)} will be released automatically. You are always welcome to book again, subject to availability.

${eventPage(data)}

${emailSignOff()}`,
  })
}

/** Sent when a booking is marked paid. */
export async function sendEventPaymentConfirmedEmail(data: EventEmailData): Promise<void> {
  await sendEmail({
    to: data.toEmail,
    subject: `Payment received - you're in for ${data.event.title} - ${data.reference}`,
    text: `${greeting(data.guestName)}

Great news! We have received your payment of ${formatEmailPrice(data.amountDue)}, and your ${spotsWord(data.spots)} for ${data.event.title} ${data.spots === 1 ? "is" : "are"} now confirmed.

${detailsBlock(data)}

${calendarLine(data)}

We'll message you on WhatsApp with the final details before the day. If your plans change, message us at ${WHATSAPP_NUMBER}, quoting booking reference ${data.reference}.

${eventPage(data)}

${emailSignOff()}`,
  })
}
