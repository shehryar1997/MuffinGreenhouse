import { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.muffinplants.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /admin is deliberately not listed: it's kept out of the index by an X-Robots-Tag header (next.config.mjs),
        // which crawlers can only read if robots.txt lets them fetch the page.
        disallow: ["/checkout/pay", "/preview/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
