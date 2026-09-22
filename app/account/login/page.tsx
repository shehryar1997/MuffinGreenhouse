import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { LoginPageClient } from "./login-client"

export const metadata: Metadata = pageMetadata({ title: "Sign In", description: "Sign in to your Muffin Plants account to view orders, saved addresses, and wishlist.", noindex: true })

export default function LoginPage() {
  return <LoginPageClient />
}
