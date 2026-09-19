// Pieces every customer e-mail shares: sender, sign-off and the "need help?" line.
import { siteConfig } from "@/config/nav.config"

export const FROM_EMAIL = "Muffin Plants <support@muffinplants.com>"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com").replace(/\/$/, "")

export const SHOP_URL = `${SITE_URL}/shop/all`
export const MUFFIN_AI_URL = `${SITE_URL}/muffin`
export const WHATSAPP_NUMBER = siteConfig.whatsappNumber

export function formatEmailPrice(price: number): string {
  return "PKR " + Number(price).toLocaleString("en-PK")
}

/** Closing lines used by every e-mail: where to get help, then the team sign-off. */
export function emailSignOff(): string {
  return [
    `Have a question? Ask Muffin AI on our website (${MUFFIN_AI_URL}) or reach our team on WhatsApp at ${WHATSAPP_NUMBER}.`,
    "",
    "— The Muffin Plants Team",
  ].join("\n")
}
