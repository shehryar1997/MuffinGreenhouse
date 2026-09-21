# SEO Audit v2: muffinplants.com (Muffin Greenhouse), Pakistani market

Audit date: 2026-09-21 · Live site as deployed after the clean-slate + code fixes · Market: Pakistan (Karachi base, nationwide delivery)
Business type: **E-commerce (plants and garden supplies) + local service business (landscaping, maintenance, expert visits, workshops)**

## SEO Health Score: **49 / 100** (v1 was 47, when junk test data was live)

| Category | Weight | v1 | Now | Weighted | Why |
|---|---|---|---|---|---|
| Technical SEO | 22% | 62 | **72** | 15.8 | Canonicals, headers, real 404s and a clean sitemap are now live. Held back by: sitemap not submitted, 2-hop redirect, slow cold responses, empty listing pages indexable |
| Content Quality | 23% | 25 | **18** | 4.1 | Down: with the junk removed there is now **no product, article, event or review content at all** |
| On-Page SEO | 20% | 55 | **60** | 12.0 | Titles/descriptions/canonicals are consistent. No keyword in the homepage H1, no Pakistani-search language, shallow internal linking |
| Schema | 10% | 45 | **60** | 6.0 | LocalBusiness/Store + WebSite live, phone valid, no empty image. Missing: street/geo/hours (none public), Product/Review (no products yet), only 1 `sameAs` |
| Performance (estimated) | 10% | 65 | **62** | 6.2 | Lab data still unavailable (PageSpeed quota). Warm TTFB 0.36–0.44s but cold 1–5s; hero image 443 KB; JS ~415 KB |
| AI Search Readiness | 10% | 40 | **35** | 3.5 | Crawlable, but nothing citable: no guides, no facts, no named author |
| Images | 5% | 30 | **35** | 1.8 | No product photos exist yet; hero is heavy |
| **Total** | | 46.9 | | **49.4** | |

**How to read this:** the score is low because the shop is empty, not because the engineering is poor. The site is now a clean, technically sound shell. Almost all remaining points come from content you must create (products, photos, guides, reviews) and from local/off-site signals (Google Business Profile, citations, links). A realistic ceiling for on-site work alone is ~85–90; rankings beyond that depend on authority you earn over months.

### Data limits (unchanged)
Google Search Console is connected but returns **no queries, pages or countries** for the last 90 days and shows **no submitted sitemaps**. PageSpeed/Lighthouse/CrUX unavailable (API quota exhausted), so performance is estimated from measured proxies. No keyword volumes, backlink or GBP data were available: **keyword lists below are candidates to validate, not volume-backed**. Pakistani competitor observations come from live SERPs and page fetches today.

---

## 1. What changed since v1 (verified live today)

| Item | v1 | Now |
|---|---|---|
| Junk products/journal/event | Live, in sitemap | Gone; DB clean |
| Sitemap URLs | 41 | 21 (no product/journal/event/shop-listing URLs until stock exists) |
| Canonicals | Missing on 8 pages | Present on all 18 crawled pages |
| Unknown product/category URL | HTTP 200 | HTTP 404 (verified `/shop/xyz`, `/shop/product/xyz`) |
| `X-Content-Type-Options`, `Permissions-Policy` | Missing | Present |
| Business schema | Generic Organization, phone `9230…` | Store+LocalBusiness, `+92…` phone, areaServed, WebSite |
| Meta keywords | Present | Removed |

## 2. Google's view of the site (Search Console URL Inspection)

| URL | Status |
|---|---|
| `/` | Submitted and indexed, last crawl 2026-09-21 |
| `/shop/all` | Indexed (crawled 09-20), breadcrumb rich result PASS. **It currently shows 0 items** |
| `/our-story` | Indexed, but *user canonical* recorded as the **homepage** (the old site-wide canonical bug). Google chose the page itself, and the fixed canonical is live: re-crawl will clear it |
| `/services/landscaping` | **Unknown to Google** |
| `/shop/product/*` | Unknown (and no products exist now) |
| Sitemap | **None submitted** |
| Queries/impressions/clicks (90 days) | **Zero** |

Conclusion: Google has found only a few pages by following links. Discovery, not ranking, is the first bottleneck.

## 3. Pakistani market and SERP analysis

### 3.1 Who you compete with (live SERPs today)

| Query type | Who ranks | What they do |
|---|---|---|
| "buy indoor plants online Karachi/Pakistan" | eTree.pk, Gulab.pk, MoneyPlant.pk, Plants.com.pk, TinyFolia, Gardener.pk, Poday Online, Plant.pk, Bagh.pk, PlantsNPot, Daraz | Large catalogues (hundreds to 1,000+ SKUs), city pages ("Buy Plants Online in Karachi"), price shown, COD |
| "monstera / philodendron price in Pakistan" | Daraz marketplace, MoneyPlant, Bagh.pk, Plant.pk, PlantsNPot, eTree | Product pages with price in PKR. Monstera on Plant.pk is listed roughly Rs 5,500–7,500 for small sizes up to Rs 16,500–35,000 for large |
| "rare plants / aroids / hoya Pakistan" | Gulab, PlantsNPot, Plants.com.pk ("Rare" category), eTree (rare snake plants), Garden Geek | Rare categories exist but are thin: **your differentiation space** |
| "landscaping / garden maintenance Karachi" | Plants N Pot, EcoScape, Roof Power, Al Haider Nursery (since 1981), Landscape Expert, Kaacib, Swift Care | Service pages, portfolios, B2B/commercial focus |
| "nursery near me Karachi" (local) | Lalazar Nursery (Clifton), DHA/Gulshan nurseries, directories | Physical addresses in Maps. **You have no public address = no map-pack presence unless you register as a service-area business** |
| Urdu: "پودے آن لائن کراچی" | Newspaper pages (Jang, Nawa-i-Waqt), a foreign site (italianflora.com), a generic care blog | **No serious Pakistani plant store ranks in Urdu**: open field |

### 3.2 Patterns worth copying (from PlantsNPot, the closest Karachi competitor)
- Title with location + payment: "Buy Top Quality Plants Online in Karachi on Cash on Delivery".
- **COD and local wallets shown prominently** (JazzCash, Easypaisa, Raast, bank transfer). Pakistani buyers search and decide on "COD". Your site should state accepted payments clearly (FAQ "How do I pay?" exists but the homepage/product pages don't surface it).
- Trustpilot/Google rating in footer, WhatsApp everywhere, a blog, discount badges, 9+ category clusters and a separate Gardening Services section.
- Weakness to exploit: no address/hours, generic descriptions, marketplace-style thin pages.

### 3.3 Where Muffin can realistically win
1. **Rare/acclimatised plants** (aroids, hoyas, sansevierias, mangaves) with honest Karachi-specific care: big sites treat these as thin categories.
2. **Karachi + WhatsApp + guarantee** experience (2-hour damage claim window is unusual: make it a headline trust signal).
3. **Urdu / Roman Urdu care content**: essentially unclaimed.
4. **Services + shop combo** (landscaping page can rank locally and feed shop sales).
5. Avoid head-on fights for "money plant" / "aloe vera" / "indoor plants Pakistan" for now (dominated by high-authority stores and Daraz).

### 3.4 Candidate keyword map (validate volumes in Google Keyword Planner / GSC before committing)

| Cluster | Example queries (English / Roman Urdu) | Target page | Intent |
|---|---|---|---|
| Local shop | buy plants online Karachi · indoor plants Karachi delivery · plant shop Karachi | Homepage + `/plants-in-karachi` hub | Transactional/local |
| Rare plants | rare plants Pakistan · aroids Pakistan · hoya Pakistan · pink princess price in Pakistan | `/shop/aroids`, product pages | Transactional |
| Price queries | monstera price in Pakistan · snake plant price Pakistan | Product pages + price/care guides | Commercial |
| Care (English) | how to care for monstera in Karachi · plants for Karachi heat · low light plants for apartments Pakistan | Journal guides | Informational |
| Care (Roman Urdu/Urdu) | پودوں کی دیکھ بھال · indoor plants ki dekh bhal · paudon mein pani kab dein | Urdu guides | Informational |
| Pet-safe / needs | pet safe plants Pakistan · low light plants Pakistan · air purifying plants Pakistan | `/shop-by-need/*` + guides | Commercial |
| Supplies | potting soil Karachi · plant fertilizer Pakistan · coco peat perlite Pakistan | `/shop/planting-media`, `/shop/fertilizer` | Transactional |
| Services | landscaping Karachi · balcony garden design Karachi · garden maintenance Karachi | `/services/*` | Local/transactional |
| Workshops | plant workshop Karachi · repotting workshop Karachi | `/events` | Local/informational |

---

## 4. Technical SEO: 72/100

**Working:** HTTPS+HSTS preload, valid robots.txt, real 404s (now including unknown shop/product slugs), trailing-slash normalisation, canonicals on all sampled pages, `noindex` on the not-found template, all common security headers now present (CSP, HSTS, nosniff, permissions-policy, frame and referrer policies), no broken homepage links, mobile viewport, ISR (`revalidate` 60–300s).

| # | Severity | Finding | Fix |
|---|---|---|---|
| T1 | **Critical** | No sitemap submitted; key pages unknown to Google (`/services/landscaping`) | GSC → Sitemaps → submit; request indexing for ~10 URLs (see Roadmap Week 1) |
| T2 | High | `/shop/all` is indexed and has 0 items; `/shop/*` listings are empty pages | Either stock products quickly, or add `noindex` to empty listings until products exist |
| T3 | Medium | Two-hop redirect `http://muffinplants.com` → `https://muffinplants.com` → `https://www…` (verified) | In Vercel Domains, set apex → www as a single redirect |
| T4 | Medium | Cold responses slow: homepage 4.8s first byte in today's crawl, inner pages 1–3s (warm 0.36–0.44s) | Keep ISR on all content pages; reduce Supabase cold-start exposure (project keep-alive already exists) |
| T5 | Medium | `X-Vercel-Cache: STALE` seen on the homepage | Fine (ISR), but confirm `/api/revalidate` fires when products are added so new products appear promptly |
| T6 | Low | No `manifest.webmanifest`; no `llms.txt` (optional) | Add manifest for Android install; llms.txt optional |
| T7 | Info | Sitemap now lists only URLs that exist; `/journal`, `/events` are listed while empty ("coming soon") | Acceptable; they will fill |

## 5. Content quality: 18/100

Rendered word counts (each includes ~60 words of nav/footer): home 880 · our-story 774 · landscaping 514 · expert-visit 510 · garden-maintenance 477 · services 362 · our-guarantee 344 · delivery 281 · visit-us 193 · shop/aroids 180 · shop/all 173 · events 152 · faq 147 · journal 139 · contact 136 · muffin 120 · shop-by-need/pet-safe 112 · reviews 106 · plant-finder 100.

| # | Severity | Finding |
|---|---|---|
| C1 | **Critical** | **Zero products.** An e-commerce site with no products has no commercial pages to rank |
| C2 | **Critical** | **Zero articles.** Journal is a "first stories are on their way" placeholder; nothing to earn informational traffic or links |
| C3 | High | Reviews page: "No reviews yet". No social proof anywhere on-site |
| C4 | High | Category/need pages are ~110–180 words of interface text with no buying guide. Even when stocked they'd be thin |
| C5 | High | `/faq` is a list of questions with 147 rendered words including chrome: answers are short/hidden; not much substance for search or AI |
| C6 | Medium | E-E-A-T: `/our-story` (774 words) is good and human. Missing: named founder/author bio, photos of the nursery/team, growing credentials, where plants are sourced |
| C7 | Medium | Static service pages (~500 words) are decent but have no pricing ranges, portfolio, before/after photos or testimonials |
| C8 | Medium | Nothing in Urdu/Roman Urdu; no Pakistan-specific care content (Karachi humidity, 40 °C summers, monsoon, load-shedding light, hard water) |
| C9 | Info | Brand voice is distinctive ("We killed a lot of plants so you do not have to"): keep, but pair with keyword-bearing subheadings |

## 6. On-page SEO: 60/100

- Titles 29–64 chars, descriptions 108–155 chars, one H1 per page, consistent `Page - Muffin Greenhouse` pattern: **good hygiene**.
- Homepage title "Buy Plants Online in Karachi - Muffin Greenhouse" (48) is on target. **Homepage H1 is the slogan only** ("Good plants. Good energy."), no location or product word in the H1 or the first 100 words. Add a keyword-bearing subline/intro.
- `/shop/all` title "All Plants - Muffin Greenhouse" (30) and description are fine but generic: use "Buy Indoor Plants Online in Pakistan".
- Category titles/descriptions in code are well written for Karachi (aroids, sansevierias, mangaves, etc.).
- `/services/garden-maintenance` meta description is short (108): expand to ~150 with a service verb and "Karachi".
- Internal linking: nav and footer solid (homepage: 44 links checked in v1, none broken). No product cross-links or guide→product links yet because neither exists.
- URL structure clean and readable.

## 7. Schema / structured data: 60/100

Live and valid in principle: `Store`+`LocalBusiness` (`@id` #business, name, url, logo, image, sameAs Instagram, city/region/country address, areaServed Karachi+Pakistan, PKR, email, `+923095360009`, contactPoint), `WebSite` (`inLanguage: en-PK`), `BreadcrumbList` on shop pages, `Service` on landscaping, `BlogPosting` template, `Event` template (for future rows).

| # | Severity | Finding | Fix |
|---|---|---|---|
| S1 | High | No street address, geo or opening hours (none are public) | If you register a GBP as a service-area business, keep the address hidden and add `areaServed` cities; once a public pickup point exists, add address/geo/hours |
| S2 | Medium | Only one `sameAs` (Instagram) | Add Facebook, TikTok, YouTube, Google Business Profile URL, WhatsApp Business link |
| S3 | Medium | `Service` schema only on landscaping (verify garden-maintenance and expert-visit have it) | Add per service with `areaServed`, `provider` `@id` |
| S4 | Medium | Product schema is ready but cannot appear until products exist. Add `hasMerchantReturnPolicy` (2-hour claim window) and `shippingDetails` with true rates when ready | Follow `lib/delivery-fee.ts` real rates |
| S5 | Info | **FAQ rich results were retired by Google on 7 May 2026.** Do not add FAQPage for SERP benefit. (My v1 plan suggested FAQPage: corrected in v1's ACTION-PLAN.) Keep the FAQ as plain, well-written content | n/a |
| S6 | Info | Validate at Google's Rich Results Test after the first products are live | n/a |

## 8. Performance: 62/100 (estimated, not lab-measured)

- HTML 147 KB (homepage). Compressed JS ≈ 415 KB (21 scripts including GA4 and Sentry client).
- **Hero image AVIF 1080w = 443 KB and is the LCP element** (preloaded). On Pakistani 4G with variable latency, this is the main LCP risk. Target ≤150 KB.
- Cold first byte 1–5s vs 0.36–0.44s warm: real users on a cache miss feel this.
- Vercel `sin1` (Singapore) edge is a good fit for Pakistan.
- Fixed since v1: image width list trimmed (no 2048/3840), Sentry trace sampling 10%.
- Still to do: compress the hero, lazy-load anything below the fold, remove the unused mono font if it is not used, re-test with PageSpeed once the API key works, and check CrUX after traffic exists.

## 9. Images: 35/100
Product photography does not exist yet. The hero is heavy. Decorative logos correctly use empty alt (they sit beside visible "Muffin Plants" text; v1's "logo alt" finding was wrong and is withdrawn). Once products exist, unique photos will matter more than anything else here: Pakistani competitors reuse supplier stock photos.

## 10. AI search readiness (GEO): 35/100
Crawlers are allowed (no AI bot blocks). Nothing citable yet. AI answers for "how to care for X in Pakistan" draw on clear question-headed guides with concrete facts; Muffin has none. `llms.txt` is optional and ignored by Google.

## 11. Local SEO (Karachi): findings
- No Google Business Profile evidence, no map-pack presence, no reviews, no citations. Physical competitors (Lalazar, DHA/Gulshan nurseries) own "near me".
- Your operating model (address shared on WhatsApp) fits a **service-area business** profile in GBP. Verification (video) will be required.
- Contact NAP: name + `+923095360009` + email + "Karachi" are consistent on `/contact`, `/visit-us`, footer and schema (good). Keep exactly the same on GBP, Instagram bio, Facebook and directories.

## 12. Payment/trust signals for Pakistan
Competitors headline **Cash on Delivery, JazzCash, Easypaisa, Raast, bank transfer**. Confirm which of these Muffin accepts and show them in the header/footer, product pages and FAQ. Also surface: 2-hour damage guarantee, WhatsApp support hours, delivery coverage/timelines by city, and a rating widget once reviews exist.

## 13. Risks and things that could invalidate this audit
- Scores are on-site heuristics; without GSC data, rankings/traffic are unmeasured.
- Competitor and price data are from today's public pages and may change.
- If Vercel cold starts or the database pause issue recur, crawl reliability can drop: monitor GSC "Crawl stats".
