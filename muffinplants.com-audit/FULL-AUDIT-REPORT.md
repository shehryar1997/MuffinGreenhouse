# Full SEO Audit: muffinplants.com (Muffin Greenhouse)

Audit date: 2026-09-21 · Target market: Pakistan (Karachi HQ) · Business type: **E-commerce (plants/garden) + local service business (Karachi nursery, landscaping, workshops)**

## Method and data limits (read first)

| Source | Status |
|---|---|
| Live crawl (homepage + 18 key pages, robots, sitemap, headers, redirects) | Done |
| Source code review (`app/sitemap.ts`, `app/layout.tsx`, `lib/structured-data.ts`) | Done |
| Google Search Console (`sc-domain:muffinplants.com`) | Connected. **Zero rows** for queries, pages and countries over 21 Jun – 20 Sep 2026 |
| PageSpeed / Lighthouse / CrUX | **Unavailable**: API key invalid and shared quota exhausted. Performance section uses measured proxies (TTFB, JS/image bytes), not lab scores |
| Keyword volumes, backlinks, GBP data | Not available (no DataForSEO / Moz / GBP access). No volumes are invented below |
| Crawl scope | Site has ~41 sitemap URLs, so every template was sampled; not 500 pages |

## SEO Health Score: **47 / 100**

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 62 | 13.6 |
| Content Quality | 23% | 25 | 5.8 |
| On-Page SEO | 20% | 55 | 11.0 |
| Schema / Structured Data | 10% | 45 | 4.5 |
| Performance (CWV, estimated) | 10% | 65 | 6.5 |
| AI Search Readiness | 10% | 40 | 4.0 |
| Images | 5% | 30 | 1.5 |
| **Total** | | | **46.9** |

**Bottom line:** The technical foundation (Next.js on Vercel, HTTPS/HSTS, clean robots, self-canonicals on most templates) is decent. The site does not rank in Pakistan yet because (1) Google has almost nothing to rank, (2) the live pages contain **test/placeholder data**, and (3) there is no local (Karachi/Pakistan) entity or content footprint. Fixing content and local signals will move the needle far more than any technical tweak.

---

## Top 5 critical issues

1. **Test/junk content is live and in the sitemap.** Product `pink-princess` has description "adsfhdsavfasf" and `image: ""` in schema, using `placeholder-plant.png`. Product slug `sdgsaf` is titled "Gravel" with description "scasasf". Journal post *How to repot a monstera* has a keyboard-mash body, `<title>` "monstera repotting", and meta description "Repotting a monstera" (20 chars). These are indexable and would poison quality signals.
2. **Almost no indexable inventory.** Sitemap has 41 URLs: only **5 products** (one is the test item), **1 journal post** (junk), **1 event**. `/shop/all` links only 3 products. There is nothing to rank for the hundreds of plant queries Pakistani buyers search.
3. **Zero search visibility.** GSC returns no impressions, clicks, countries or submitted sitemaps in 90 days. Homepage is indexed ("Submitted and indexed"), but `/shop/product/pink-princess` is "URL is unknown to Google".
4. **No local-business entity.** Only a generic `Organization` schema with city-level address (no street, geo, hours, `LocalBusiness`/`Store` type). Phone is `923095360009` (not E.164 `+92…`). No street address or phone visible on `/visit-us`. `sameAs` lists Instagram only. Nothing ties the site to Google Business Profile.
5. **Homepage and templates aren't targeting search language.** The only H1 is the slogan "Good plants. Good energy." (no keyword). Category/product/FAQ/review pages are 100–170 words (thin). Product pages have no reviews, care info, or unique copy.

## Top 5 quick wins

1. Delete or unpublish the test products, fix/unpublish the junk journal post (30 min).
2. Submit `sitemap.xml` in GSC and request indexing for key URLs (15 min).
3. Create/verify **Google Business Profile** for the Karachi nursery, and put the same NAP on the site (1 hr).
4. Rewrite homepage H1/intro to include "indoor plants in Karachi / Pakistan" (30 min).
5. Add real product images and alt text; fix Product schema so `image` is never empty (1–2 hrs).

---

## 1. Technical SEO

**Works:**
- HTTPS with HSTS (2 years, preload). TLS 1.3, cert valid to 15 Dec 2026 (auto-renews on Vercel).
- `robots.txt` valid: allows all, blocks `/admin` and `/checkout/pay`, points to sitemap.
- 404s return real 404. Trailing-slash URLs 308 to the clean version. No broken links on the homepage (44/44 OK).
- Homepage self-canonical, `lang="en"`, `og:locale=en_PK`, mobile viewport, theme-color.
- Indexed homepage confirmed by GSC URL Inspection (crawled 2026-09-21, Google canonical = user canonical).

**Issues:**

| # | Severity | Finding | Fix |
|---|---|---|---|
| T1 | High | Sitemap not submitted in GSC ("No sitemaps found"); product URL unknown to Google | Submit `https://www.muffinplants.com/sitemap.xml`; request indexing of home, category and top product URLs |
| T2 | High | No self-referencing canonical on `/contact`, `/faq`, `/delivery-and-pickup`, `/visit-us`, `/our-story`, `/reviews`, `/muffin`, `/plant-finder` (verified missing) | Add `alternates: { canonical }` in each page's `metadata` |
| T3 | Medium | Sitemap `lastmod` for all static routes = "now" on every request (`new Date()`, `force-dynamic`). Google learns to ignore lastmod; `changefreq`/`priority` are ignored by Google | Use real dates (git commit / content updated_at) or omit lastmod for static pages; drop changefreq/priority |
| T4 | Medium | `/shop/tools-equipment` in sitemap as a static route; verify it has products, else thin/empty page | Include only if stocked (categories already filter this way) |
| T5 | Medium | Redirect chain `http://muffinplants.com` → `https://muffinplants.com` → `https://www.muffinplants.com` (2 hops) | Add apex-to-www redirect at the domain level in Vercel; keep one hop |
| T6 | Medium | Server response inconsistent: TTFB 1.35s (cold) vs 0.36s (warm); several pages took 5–16s in the crawl (`/journal` 15.8s, `/delivery-and-pickup` 6.8s, product 6.3s). Homepage shows `X-Vercel-Cache: STALE` | Use ISR/static generation (`revalidate`) for content pages instead of dynamic rendering; check Supabase cold starts (project pause risk noted in memory) |
| T7 | Low | Missing `X-Content-Type-Options: nosniff` and `Permissions-Policy`; CSP allows `'unsafe-inline'` scripts | Add both headers in `next.config.mjs` (security score 91/100) |
| T8 | Low | No `manifest.webmanifest` (404), no `llms.txt` (404, optional) | Add web manifest for PWA/Android; llms.txt is optional |
| T9 | Info | Sitemap has 41 URLs, no `<image:image>` extensions | Add product images to sitemap once real photos exist |

## 2. Content Quality

Word counts (rendered, includes nav/footer boilerplate ~60 words): home ~1,000, our-story 774, landscaping 514, services 362, delivery 281, visit-us 193, shop/all 172, aroids 166, events 155, faq 147, contact 136, journal post 133, journal 124, product pages 109–129, pet-safe 112, reviews 106, plant-finder 100.

| # | Severity | Finding |
|---|---|---|
| C1 | Critical | Test/junk content live (see top issues 1). Google's Helpful Content systems evaluate site-wide quality; gibberish drags every page down |
| C2 | Critical | Only 1 journal post (junk) and 1 event. Zero informational content for how-to / care queries, which is where plant sites earn traffic and links |
| C3 | High | Product pages ~120 words with no care info (light, watering, pet safety, size, pot, origin), no reviews, single image. Competitors list detailed specs |
| C4 | High | Category pages 110–170 words: no intro copy, buying guide, or FAQs |
| C5 | High | `/faq` 147 words and `/reviews` 106 words: thin; no FAQ schema; reviews are not marked up |
| C6 | Medium | E-E-A-T: strong story on `/our-story` (774 words, "started with a laptop and a bare room") but no named author/founder, credentials, photos of the nursery, or press. Journal author is just "Muffin Greenhouse" |
| C7 | Medium | No Urdu / Roman Urdu terms (e.g. "پودے", "indoor plants Karachi", "nursery near me") and no Pakistan-specific care content (Karachi humidity, summer heat, load-shedding light, water hardness) |
| C8 | Info | Homepage copy is brand-voice heavy ("Roots love nice things", "We killed a lot of plants…"). Keep the voice but add keyword-bearing subheadings/intro |

## 3. On-Page SEO

| Page | Title (chars) | Description (chars) | Verdict |
|---|---|---|---|
| Home | "Buy Plants Online in Karachi - Muffin Greenhouse" (46) | 156 | Good. Add "Pakistan"; H1 is slogan only |
| /shop/all | "All Plants - Muffin Greenhouse" (30) | 144 | Weak: generic. Try "Buy Indoor Plants Online in Pakistan" |
| /shop/aroids | 62 | 135 | Good |
| Product pink-princess | "Pink Princess - Muffin Greenhouse" (33) | "adsfhdsavfasf Buy Pink Princess…" | **Junk prefix**. Title lacks price/keyword ("Philodendron Pink Princess Price in Pakistan") |
| Journal post | "monstera repotting - …" (38) | "Repotting a monstera" (20) | Too short/thin |
| /our-story | 29 | 129 | Fine (not a ranking page) |
| Others | 39–64 | 112–155 | Adequate, consistent `Keyword - Muffin Greenhouse` pattern |

Other on-page findings:
- **H1s:** one per page (good). Homepage H1 = "Good plants. Good energy." with SVG inside (text has no target keyword). Ask Muffin, plant-finder etc. are functional pages, fine.
- **Homepage title vs OG title mismatch** ("Muffin Greenhouse - Good Plants. Good Energy.") is fine but make OG include the keyword.
- **`<meta name="keywords">`** is present. Ignored by Google; harmless but remove to reduce noise.
- **Internal linking:** nav/footer link to the main sections (good). But products aren't cross-linked (no "related plants / care guide" links), and the journal doesn't link to products.
- **URL structure:** clean and readable (`/shop/product/pink-princess`). Product slug `sdgsaf` is meaningless.

## 4. Schema / Structured Data

**Present:** Organization (site-wide), BreadcrumbList (shop, categories, service), Product + Offer (product pages, PKR), BlogPosting (journal), Service (landscaping).

| # | Severity | Finding | Fix |
|---|---|---|---|
| S1 | High | Product `image: ""`, `description` is junk. No `image` means no Merchant/product rich results | Never output empty image; fall back to the first real image and skip unpublished products |
| S2 | High | Organization only. For local rank use `LocalBusiness` + `Store` (or `GardenStore`) with `streetAddress`, `geo`, `openingHoursSpecification`, `areaServed` (Pakistan), `priceRange`, `sameAs` (Instagram, Facebook, GBP, WhatsApp) | Extend `generateOrganizationSchema` |
| S3 | Medium | `telephone: "923095360009"` isn't valid format | Use `+92 309 5360009` (E.164: `+923095360009`) |
| S4 | Medium | Missing on Product: `aggregateRating`/`review` (when real reviews exist), `sku` is a UUID (use readable SKU), `shippingDetails`, `hasMerchantReturnPolicy` (2-hour claim window per policy) | Add offer-level shipping and return policy |
| S5 | Medium | No `WebSite` + SearchAction; no `FAQPage` on `/faq`; no `Event` on workshops; BlogPosting has no `image`, author is Organization-named Person | Add them |
| S6 | Low | Organization block is duplicated on each page (fine), but the Service page has a nested `Organization` and `City` (OK) | Consider `@id` references to avoid duplicates |

## 5. Performance (estimated; lab/field data unavailable)

- Homepage HTML 178 KB; JS ≈ **415 KB** compressed (21 script tags incl. GTM/GA and Sentry). Hero image AVIF at 1080w = **443 KB** (large for Pakistani mobile networks, and it is the LCP element and preloaded with 8 srcset widths up to 3840).
- Fonts: 3 Google fonts (Playfair, Inter, JetBrains Mono) self-hosted via `next/font` with preload (good), but the mono font is likely rarely used: check and drop.
- Sentry with 100% sample rate on the client (`sentry-sample_rate=1`, trace headers on every page). Lower it for production to cut JS and overhead.
- Analytics: GA4 (`G-VSQJKLNRQL`) loads via `@next/third-parties`. OK.
- TTFB varies 0.36s–1.35s on the homepage; some inner pages 5–16s (see T6). This is the biggest CWV risk (LCP/TTFB), not front-end weight.
- **Action:** re-run PageSpeed after fixing the API key; target LCP < 2.5s on 4G mobile.

## 6. Images

- Homepage: 13 `<img>`, 8 with empty `alt=""`. Decorative is fine, but the **brand logo in the header/footer has empty alt**; use `alt="Muffin Greenhouse"`.
- Product image is a placeholder (`/placeholder-plant.png`); the hero is 443 KB AVIF at 1080w.
- Remote image sources allowed in CSP include Unsplash/Pexels: stock imagery hurts uniqueness. Use your own photos of your plants (unique images rank in Google Images and build trust).
- Use descriptive file names and alt text (`philodendron-pink-princess-karachi.jpg` / "Philodendron Pink Princess in a 5-inch pot").

## 7. AI Search Readiness (GEO)

- AI crawlers are not blocked (robots allows `*`). Good.
- `llms.txt` missing (optional; ignored by Google).
- Little citable content: no definitive care guides, no data tables, no FAQ, no named author. AI engines cite pages with clear question-headed sections and facts.
- Brand signals: Instagram only. Add Facebook, YouTube, GBP, LinkedIn, Pakistani directory listings, and get mentions on local blogs/forums (Reddit r/pakistan, plant Facebook groups).

## 8. Local & Pakistan-specific findings

- No GBP link or `/visit-us` street address / map embed / hours (arrangement is "on WhatsApp"). Google needs a consistent NAP. If you don't want to publish the home address, register as a **service-area business** in GBP (Karachi) and hide the address.
- Site is English only. Pakistani buyers search in English, Roman Urdu and Urdu (e.g. "plants near me", "nursery in Karachi", "indoor plants price in Pakistan", "money plant", "aloe vera plant"). Include these terms naturally; consider an Urdu FAQ.
- `og:locale=en_PK` is set correctly. Add `hreflang="en-PK"` only if you create an Urdu version.
- **Competitors for the same queries** (from live SERP for "buy indoor plants online Karachi Pakistan nursery"): eTree.pk, Gulab.pk, MoneyPlant.pk, Plants.com.pk, TinyFolia, Gardener.pk, Poday Online, The Roots Nursery. They have hundreds/thousands of SKUs, city landing pages ("Buy Plants Online in Karachi"), and years of backlinks. Muffin's differentiator is **rare/acclimatised plants (aroids, hoya, mangave, sansevieria)** and honest care: compete in that niche rather than generic "money plant".

## 9. What could not be assessed

Backlink profile, keyword rankings/volumes, CrUX field data, GBP status/reviews, Lighthouse scores. Re-run after (a) fixing the PSI API key, (b) 4-6 weeks of GSC data.
