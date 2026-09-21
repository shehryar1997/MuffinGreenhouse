# Action Plan v1 (superseded by v2/ROADMAP-TO-100.md): rank muffinplants.com higher in Pakistan

Order matters: Phase 1 removes things that actively hurt; Phase 2 gets Google to see the site; Phases 3–4 build the rankings. Nothing below invents traffic numbers: check progress in GSC.

Realistic expectation: a new store with few pages will not beat eTree/Gulab/MoneyPlant on "buy plants online Pakistan" quickly. Win **Karachi + rare plants + care queries** first, then widen.

---

## Phase 1: Critical fixes (Week 1)

### 1. Remove test data (30–60 min) — Critical
1. Admin → Products: unpublish/delete `sdgsaf` ("Gravel", junk description) and any product whose description is gibberish. `pink-princess` stays only if you write a real description and add real photos today.
2. Admin → Journal: unpublish `how-to-repot-a-monstera` until it has a real body (currently keyboard-mash). Fix its title/description when re-publishing.
3. Search the admin for other placeholder text ("asdf", "test", "sdg") in products, events, reviews.
4. Confirm the sitemap no longer lists them: open `https://www.muffinplants.com/sitemap.xml`.

### 2. Submit to Google (15 min) — Critical
1. Search Console → property `muffinplants.com` → **Sitemaps** → add `sitemap.xml`.
2. **URL Inspection** → Request indexing for: home, `/shop/all`, each category, `/services`, `/services/landscaping`, `/visit-us`, top 5 products.
3. Also add **Bing Webmaster Tools** (import from GSC); Bing feeds Copilot/ChatGPT search.

### 3. Google Business Profile (1–2 hr) — Critical for local
1. Create/claim "Muffin Greenhouse" GBP, category **Plant nursery** (add *Garden center*, *Florist* only if true).
2. Use a street address (or service-area business if you don't want customers at your address).
3. Phone `+92 309 5360009`, website `https://www.muffinplants.com`, hours, WhatsApp link, 10+ real photos.
4. Ask each past customer for a Google review with a direct review link (goal: 10 reviews in month 1).
5. Put the identical Name/Address/Phone on `/contact`, `/visit-us`, and the footer.

### 4. Homepage H1 + intro (30 min)
- Keep the slogan visually, but make the H1 (or the first paragraph directly under it) say: "Indoor plants in Karachi: delivered across Pakistan". File: `components/home/sections/hero.tsx`.
- Add a 100–150 word intro under the hero mentioning Karachi, Pakistan, delivery, rare aroids/hoyas/sansevierias.

### 5. Add missing canonicals (30 min)
Add `alternates: { canonical: "https://www.muffinplants.com/<path>" }` to metadata in: `/contact`, `/faq`, `/delivery-and-pickup`, `/visit-us`, `/our-story`, `/reviews`, `/muffin`, `/plant-finder`.

### 6. Fix Product schema safety (30 min)
In `lib/structured-data.ts` → `generateProductSchema`: skip `image` when empty (never `""`); do not render Product JSON-LD for products without a real image + description.

---

## Phase 2: High-impact improvements (Weeks 2–3)

### 7. Upload real inventory and real photos
- Target **30–50 published products** minimum. For each: 3–5 own photos (white/neutral background + in-context), 250+ word unique description, price in PKR, size/pot, light, watering, pet-safety, "acclimatised in Karachi", stock status.
- Product title pattern: `Philodendron Pink Princess Price in Pakistan | Muffin Greenhouse` (≤60 chars). Meta description: keyword + price + delivery + guarantee, ≤155 chars.
- Alt text: `Philodendron Pink Princess in a 5-inch pot, Karachi`. Descriptive file names.

### 8. Strengthen category pages
For `/shop/all`, `/shop/aroids`, `/shop/sansevierias`, `/shop/mangaves`, `/shop/fertilizer`, `/shop/planting-media` and the six `/shop-by-need/*` pages:
- 150–300 word intro above the grid (what it is, how to choose, Karachi care tips).
- A short "common questions" text block at the bottom (plain content: Google retired FAQ rich results on 7 May 2026, so do not add FAQPage schema for SERP benefit).
- Titles: `Buy Aroids Online in Pakistan – Monstera, Philodendron | Muffin Greenhouse`.

### 9. Local + richer schema
- Replace/extend Organization with `LocalBusiness`/`Store`: full `address` (streetAddress, postalCode), `geo`, `openingHoursSpecification`, `areaServed: Pakistan`, `priceRange`, `telephone: +923095360009`, `sameAs` (Instagram, Facebook, GBP, YouTube).
- Add `WebSite` + SearchAction, `Event` (workshops), `hasMerchantReturnPolicy` + `shippingDetails` on offers (uses 2-hour claim window, delivery zones).
- Validate at https://search.google.com/test/rich-results.

### 10. Performance & speed
1. Re-run PageSpeed Insights after replacing the API key (Google Cloud Console → PageSpeed Insights API → new key).
2. Make inner pages static/ISR (`export const revalidate = 3600`) so TTFB is stable; product/category pages should not be slow (some crawled at 5–16s).
3. Reduce hero image (443 KB AVIF at 1080w): re-export at ≤150 KB, set `sizes` correctly, and cap srcset widths at 1200–1920.
4. Set Sentry client `tracesSampleRate` to 0.1 or lower; remove the unused JetBrains Mono font if not used.
5. Keep the Vercel region close to users (Singapore/`sin1` is fine for Pakistan).

### 11. Housekeeping
- Add `X-Content-Type-Options: nosniff` and `Permissions-Policy` in `next.config.mjs` headers.
- Single-hop apex → www redirect.
- Sitemap: real `lastmod` values, drop `changefreq`/`priority`.
- Remove `<meta name="keywords">`. Logo `alt="Muffin Greenhouse"`.

---

## Phase 3: Content & authority (Month 2)

### 12. Publish 2 quality articles per week (target 16 in 8 weeks)
Write for Pakistani conditions, with real photos and the founder as a **named author** with bio (E-E-A-T). Starter list (validate in GSC / Google autocomplete before writing):
1. Best indoor plants for Karachi apartments (low light, humidity, heat)
2. How to care for plants in Karachi summer (40°C+, load-shedding, AC rooms)
3. Pet-safe plants in Pakistan
4. Monstera care guide for Pakistan (+ repotting, done properly)
5. Sansevieria (snake plant) varieties and prices in Pakistan
6. Money plant care: water propagation, yellow leaves
7. Hoya care guide, Mangave care guide
8. Best soil mix / potting media for Pakistan, fertilizer schedule
9. How we ship plants across Pakistan safely (and the 2-hour damage guarantee)
10. Balcony garden ideas Karachi (ties to landscaping service)
Each post: 1,000+ words, H2 questions, a common-questions section (plain content), links to 3+ relevant products/categories, `BlogPosting` with image + named author.

### 13. City & service landing pages (only with real substance)
- Create `/plants-in-karachi` (hub: delivery times, areas covered such as DHA, Clifton, Gulshan, PECHS, North Nazimabad, pickup). Expand to Lahore/Islamabad **only if you actually deliver there**, with unique shipping details per city. Avoid thin copy-pasted city pages.
- Landscaping/maintenance/expert-visit pages: add pricing ranges, project gallery, before/after photos, testimonials, `Service` schema per page.

### 14. Reviews
- Collect on-site and Google reviews; display on product pages with `Review`/`AggregateRating` schema (only real reviews).
- WhatsApp follow-up 3–5 days after delivery asking for a review with a link.

### 15. Backlinks and citations (Pakistan-first)
- List on Pakistani directories/citations with identical NAP: Google Maps, Bing Places, Facebook Page, Yellow Pages Pakistan and other Pakistani business/home-and-garden directories relevant to nurseries, plus Instagram/TikTok bios linking to the site.
- Outreach: Karachi home/lifestyle bloggers, interior designers and architects (link to your landscaping/plant services), university/gardening societies, local media features on plant parents; sponsor a workshop and get event listings (Eventbrite, Facebook Events, local event blogs).
- Collaborations: home décor and cafe brands who would cross-link.
- Avoid paid-link networks and PBNs.

---

## Phase 4: Monitoring & iteration (Ongoing)

Weekly (15 min): GSC → Performance (filter Country = Pakistan) → check impressions, top queries, new pages indexed, Coverage/Pages errors.
Monthly: update the top 10 pages using real queries; add internal links from each new article to product/category pages; refresh stale product stock and prices; add new 5–10 products.
Quarterly: re-run this audit (`/seo-audit`), Lighthouse on home/category/product, backlink review.

KPIs to track (set a baseline in week 1 from GSC/GA4):
| KPI | Target after 90 days |
|---|---|
| Indexed pages (GSC Pages) | ≥ 60 (products + guides) |
| Impressions from Pakistan | Growing week over week |
| GBP views / calls / direction requests | Baseline then +50% |
| Google reviews | ≥ 20 |
| Organic clicks to product pages | Any nonzero → growing |

## Priority checklist

- [ ] Delete/unpublish test products and the junk journal post
- [ ] Submit sitemap in GSC + Bing; request indexing
- [ ] Create GBP, get first 10 reviews
- [ ] Keyword in homepage H1/intro
- [ ] Canonicals on 8 pages
- [ ] Never emit empty product `image`
- [ ] 30+ real products with photos and unique copy
- [ ] Category page intros + common-questions text
- [ ] LocalBusiness/Event/WebSite schema; E.164 phone
- [ ] Static/ISR rendering; hero image ≤150 KB; PSI key fixed
- [ ] 16 articles in 8 weeks, named author
- [ ] Citations + 10 quality local backlinks
