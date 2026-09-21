# Roadmap: 49 → as close to 100 as on-site work allows (Pakistan)

Scores below are estimates of the on-site Health Score after each stage is done well. **100 is not a realistic target**: the last points depend on off-site authority (links, mentions, reviews, brand searches) that grow over months. Aim for **~65 after Stage 2, ~77 after Stage 3, ~85 after Stage 4**.

| Stage | When | Health score (est.) | Main unlock |
|---|---|---|---|
| Now | | 49 | Clean technical shell, empty shop |
| 1. Get found | Week 1–2 | ~53 | Google discovers and trusts the site; local entity exists |
| 2. Real catalogue | Weeks 2–6 | ~64 | 30+ products with real photos, category copy, Product schema |
| 3. Content + trust | Weeks 6–12 | ~77 | Guides (English + Urdu), reviews, city/service depth, citations |
| 4. Authority + polish | Months 4–6+ | ~85 | Links, PR, seasonal campaigns, speed, refresh cycle |

Order matters: Stage 1 is prerequisite for everything (nothing ranks if Google can't find it); Stage 2 must precede Stage 3 (guides need products to link to); Stage 4 needs the assets from 2–3 to earn links.

---

## STAGE 1: Get found (Week 1–2)  [+4]

### 1.1 Submit the sitemap and request indexing (15 min) · Critical
1. Search Console → property `muffinplants.com` → **Sitemaps** → add `sitemap.xml` → Submit.
2. **URL Inspection → Request indexing** for: `/`, `/services`, `/services/landscaping`, `/services/garden-maintenance`, `/services/expert-visit`, `/our-story`, `/our-guarantee`, `/delivery-and-pickup`, `/shop-by-need`, `/contact`.
3. Do the same in **Bing Webmaster Tools** (import from GSC).
- *Failure check:* after 7 days GSC → Pages shows fewer than ~15 indexed. *Leading indicator:* "Discovered/Crawled" counts rising daily.

### 1.2 Google Business Profile (1–2 hr) · Critical for local
1. Create/claim "Muffin Greenhouse". Category: **Plant nursery** (secondary: Garden center, Landscaper if offered).
2. Choose **service-area business** (Karachi neighbourhoods you deliver to: DHA, Clifton, Gulshan, PECHS, North Nazimabad, etc.) and hide the address, or add it if you want walk-ins.
3. Phone `+92 309 5360009`, site URL, WhatsApp link, hours, services list, 10+ real photos (nursery, packing, team, plants).
4. Complete verification (video for SAB).
5. Send your first 10–20 customers a direct review link.
- *Failure check:* profile not verified in 14 days or suspended. *Leading indicator:* GBP "profile views" and "website clicks" appear.

### 1.3 Single-hop domain redirect (10 min)
Vercel → Domains: make `muffinplants.com` redirect to `https://www.muffinplants.com` directly (today: 2 hops).

### 1.4 Homepage keyword pass (30–60 min)
- Keep "Good plants. Good energy." but add a visible line under the H1 or a 100–150 word intro containing: indoor plants, Karachi, delivery across Pakistan, rare aroids/hoyas/sansevierias, 2-hour guarantee.
- Surface **payments accepted (COD / JazzCash / Easypaisa / bank / Raast: whichever are true)** and delivery coverage in the trust strip.
- (Edit `components/home/sections/hero.tsx` and `trust-strip.tsx`; hero.tsx has your uncommitted changes.)

### 1.5 Hero image ≤150 KB (30 min)
Re-export the hero AVIF/WebP smaller; keep the srcset ≤1920. This is the LCP element.

### 1.6 Social profiles for `sameAs` (30 min)
Create/complete Facebook Page, TikTok, YouTube handle; same name/NAP/logo/link everywhere; add to `sameAs` in `lib/structured-data.ts` and the GBP.

### 1.7 Empty listing pages
`/shop/all` is already indexed with 0 items. Prefer to stock products within days (Stage 2). If it will take longer than ~2 weeks, add `noindex` to empty `/shop/*` listings, then remove it when stocked.

---

## STAGE 2: Real catalogue (Weeks 2–6)  [+11]

### 2.1 Product quality standard (the checklist for every product)
- **3–5 of your own photos** (clean background + in context + scale shot). No supplier stock photos. Descriptive filename (`philodendron-pink-princess-5-inch-karachi.jpg`), alt text describing the plant and pot.
- **200–300 unique words**: what it is, size/pot, light, watering in Karachi conditions, pet safety, growth habit, origin/acclimatised, what arrives in the box, guarantee.
- **Price in PKR**, stock status, variants/sizes, SKU.
- **Title:** `Philodendron Pink Princess Price in Pakistan | Muffin Greenhouse` (≤60 chars). **Meta description:** plant + size + price hint + Karachi delivery + guarantee, ≤155 chars.
- Cross-link: to its category, the "shop by need" pages that fit (pet-safe? low-light?), and later a care guide.

### 2.2 Launch set (target 30–50 products by week 4–6)
Prioritise your niche (rare/acclimatised): aroids (Monstera, Philodendron, Syngonium, Pink Princess), sansevierias, mangaves, hoyas, plus a supply row (planting media, fertilizer, pots) because those are simple, repeat-purchase and easy to write. Ensure every published category has ≥6 products (categories with fewer than that look thin).

### 2.3 Category and "shop by need" pages (150–300 words each)
Add a buying-guide intro above the grid (what it is, how to choose, Karachi care tips), plus a short "common questions" text block (plain content, not FAQPage schema: Google retired FAQ rich results in May 2026). Titles like `Buy Aroids Online in Pakistan: Monstera, Philodendron | Muffin Greenhouse`.

### 2.4 Structured data once products exist
Validate Product/Offer in Google's Rich Results Test; add real `shippingDetails` (use `lib/delivery-fee.ts` rates) and `hasMerchantReturnPolicy` reflecting the 2-hour claim window. Check whether your products are eligible for Google Merchant Center free listings in Pakistan before investing in a feed.

### 2.5 Verify the pipeline
After adding the first product, check within 5 minutes: it appears on the site (`/api/revalidate`), in `sitemap.xml`, and passes the Rich Results Test. Then Request indexing for it.
- *Failure check:* product missing from sitemap or JSON-LD lacks image. *Leading indicator:* product URLs move "Discovered" → "Indexed" within ~2 weeks.

---

## STAGE 3: Content + trust (Weeks 6–12)  [+13]

### 3.1 Publish 2 guides a week (16 by week 12), English first, then Urdu/Roman Urdu
Each: 1,000+ words (English) with real photos, a named author (founder bio page), question-style H2s, concrete numbers/dates, links to ≥3 products/categories, `BlogPosting` (already implemented) with image.
Suggested order (validate demand with GSC/Keyword Planner):
1. Best indoor plants for Karachi apartments (heat, humidity, low light)
2. Caring for plants in Karachi summer (40 °C+, AC rooms, load-shedding)
3. Monsoon plant care in Pakistan (overwatering, fungus)
4. Pet-safe plants available in Pakistan
5. Monstera care in Pakistan + how to repot (rewrite properly)
6. Pink Princess Philodendron care and price guide
7. Snake plant (sansevieria) varieties and prices
8. Hoya care for beginners; Mangave care
9. Best potting mix and fertilizer schedule for Pakistan
10. How we pack and ship plants across Pakistan (+ the 2-hour guarantee)
11. Balcony garden ideas for Karachi (feeds the landscaping service)
12. **Urdu / Roman Urdu editions** of the top 4 (این پودوں کی دیکھ بھال… "paudon ki dekh bhal"): this is the weakest SERP you saw. Use `lang="ur"` on the Urdu pages if fully in Urdu, and keep a clean URL such as `/journal/ur/...`. Only add hreflang if you publish equivalent pairs.

### 3.2 Karachi hub and service depth
- `/plants-in-karachi` hub: delivery times per area, pickup, COD, guarantee, local FAQs (plain content), links to top categories. Expand to Lahore/Islamabad **only if you truly deliver there** and can add unique details per city.
- Service pages: add price ranges or "from" pricing, 6+ project photos with before/after, testimonials, process steps, service areas, and a WhatsApp quote CTA. Add `Service` schema on each with `areaServed`.

### 3.3 Reviews and proof
- WhatsApp message 3–5 days after delivery: ask for a Google review (direct link) and a photo. Target 20+ Google reviews by week 12.
- Show approved reviews on product pages; add `Review`/`AggregateRating` only for genuine reviews.
- Add an "as seen"/community section (Instagram embed of customers' plants).

### 3.4 Citations and social (NAP identical everywhere)
Facebook Page, Instagram, TikTok, YouTube, Bing Places, Apple Maps, Pakistani business directories relevant to nurseries and home/garden, plus local gardening Facebook groups (participate; don't spam).

---

## STAGE 4: Authority + polish (Months 4–6+)  [+8]

### 4.1 Earn links (target 10–20 quality Pakistani links in 3 months)
- Interior designers/architects and cafés (landscaping + plant styling); Karachi lifestyle bloggers; university gardening/environment societies; sponsor or host a workshop and get it listed (Facebook Events, local event blogs); expert quotes for Pakistani lifestyle/home sites; data pieces ("what plants survive Karachi summer: our sales/care data").
- No paid link networks/PBNs.

### 4.2 Events
Publish real workshop dates (the events template is ready, `Event` schema included): repotting, plant walks, terrarium building. Each event page: date, place-by-arrangement, price, capacity, photos.

### 4.3 Seasonal calendar (hypotheses to validate in GSC trends)
Plan content/offers ahead of: spring planting (Feb–Apr), monsoon (Jul–Sep) care/pest content, Eid/Ramadan gifting, wedding-season plant gifts, Independence Day. Publish 3–4 weeks before each.

### 4.4 Performance and monitoring
- Get a valid PageSpeed API key, re-test home/category/product (mobile). Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1 (field data via CrUX once you have traffic).
- Keep image weight low; lazy-load below-fold sections.
- Re-audit quarterly (`/seo audit`), compare against this baseline.

---

## Weekly operating rhythm (15–30 min)
1. GSC → Performance → filter Country = Pakistan: impressions, clicks, top queries, CTR by page.
2. GSC → Pages: new indexed vs excluded; fix "Crawled – currently not indexed" pages by improving content.
3. GBP: reply to reviews within 24h, post an update weekly.
4. Publish 2 guides, add 5–10 products, request indexing for each new URL.

## KPIs (baseline today: 0 impressions, 0 clicks, 0 reviews, ~15 indexed URLs)
| KPI | Week 4 | Week 12 | Month 6 |
|---|---|---|---|
| Indexed URLs | 30 | 80+ | 150+ |
| GSC impressions (Pakistan) | first non-zero | steady weekly growth | thousands/week |
| GBP reviews | 10 | 20+ | 50+ |
| Published products | 30 | 50+ | 100+ |
| Guides | 4 | 16 | 30 |
| Referring domains (Pakistani) | 3 | 10 | 20+ |

## Recommendation logic (why these come in this order)
| Recommendation | First-principle reason | Depends on | How you'd know it failed | Leading indicator |
|---|---|---|---|---|
| Submit sitemap + request indexing | A page Google hasn't seen can't rank | none | URLs still "Unknown to Google" after 14 days | Indexed count rising in GSC |
| GBP as service-area business | Local intent is resolved in the map pack | phone/NAP consistency (done) | Not verified/suspended | GBP views, calls, WhatsApp clicks |
| 30–50 real products with own photos | No inventory = no commercial relevance | photos, pricing | Products indexed but no impressions after 6 weeks → titles/copy too generic | Product pages "Indexed" |
| Rare/acclimatised niche focus | Large stores can't out-content a specialist on long-tail | products | Impressions only on head terms you can't win | Long-tail queries appearing in GSC |
| Urdu/Roman Urdu guides | Weakest SERP in your market | guides infrastructure | Guides indexed but zero impressions → wrong terms | Impressions on Urdu queries |
| Reviews + payment/trust signals | Pakistani buyers decide on COD/trust | orders | Conversion doesn't move after adding | Review count, add-to-cart rate |
| Links from local sources | Authority is the last ranking gap | content worth citing | No new referring domains in 8 weeks | Referring domains in GSC Links |
