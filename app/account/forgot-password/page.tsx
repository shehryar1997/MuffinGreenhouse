import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { ForgotPasswordClient } from "./forgot-password-client"

export const metadata: Metadata = pageMetadata({ title: "Reset Password", description: "Reset your Muffin Plants account password.", noindex: true })

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
