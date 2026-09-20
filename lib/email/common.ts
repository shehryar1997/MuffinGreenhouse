// Pieces every customer e-mail shares: sender, sign-off and the "need help?" line.
import { siteConfig } from "@/config/nav.config"

export const FROM_EMAIL = "Muffin Plants <support@muffinplants.com>"

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com").replace(/\/$/, "")

export const SHOP_URL = `${SITE_URL}/shop/all`
export const ASK_MUFFIN_URL = `${SITE_URL}/muffin`
export const WHATSAPP_NUMBER = siteConfig.whatsappNumber

export function formatEmailPrice(price: number): string {
  return "PKR " + Number(price).toLocaleString("en-PK")
}

/** Closing lines used by every e-mail: where to get help, then the team sign-off. */
export function emailSignOff(): string {
  return [
    `Have a question? Ask Muffin on our website (${ASK_MUFFIN_URL}) or reach our team on WhatsApp at ${WHATSAPP_NUMBER}.`,
    "",
    "— The Muffin Plants Team",
  ].join("\n")
}
