# Muffin Plants: growth & UX report

Date: 2026-09-21. Based on reading the storefront code (home, shop, product page, cart drawer, checkout, pay page,
account, wishlist, reviews, plant finder, Muffin chatbot, footer, cron jobs, emails). I did not have sales or GA4 data,
so impact is my judgement, not measured. Effort: S = under a day, M = 1-3 days, L = a week or more.

## Top picks (do these first)

| # | Feature | Why | Impact | Effort |
|---|---|---|---|---|
| 1 | Payment reminder before the 24h hold ends | Every unpaid order is a sale you lose to a timer. Today the customer gets one e-mail, then the order auto-cancels. | High | S (n8n) |
| 2 | Free-delivery progress bar (cart + checkout) | Delivery is the biggest surprise cost; the cart shows "At checkout". A nudge raises basket size. | High | S |
| 3 | Real reviews, collected after delivery | `/reviews` is empty and linked in the footer; no product page shows any social proof. | High | M |
| 4 | Delivery cost/time shown before checkout | Cost is hidden until step 1 of checkout. Unknown cost is a top reason to abandon. | High | S-M |
| 5 | "Pairs well with" cross-sell | Product page and cart have no related products. Pots, soil and fertiliser are natural add-ons. | Med-High | M |
| 6 | Welcome coupon on e-mail signup | No newsletter or list capture exists anywhere. Coupons now exist, so this is cheap. | Med-High | S-M |
| 7 | Back-in-stock / "notify me" | Plants are one-offs. Sold-out pages currently dead-end with a disabled button. | Medium | M |
| 8 | Fix the Muffin chatbot's stale answers | It is confidently wrong (see Bugs). Wrong answers cost trust. | Medium | S |

## 1. Conversion and checkout

- **Payment reminders and recovery (#1).** Orders wait for a bank transfer, then `expire-pending-orders` cancels them. Add a
  WhatsApp/e-mail nudge at about 12h and 2h before expiry with a one-tap "Share receipt" link (the pay page already has
  the WhatsApp deep link). A "your plants are released in 2 hours" message converts well because the scarcity is real.
- **Free-delivery bar (#2).** "Add Rs X more for free delivery" in the cart drawer and checkout summary. You choose the
  threshold; store it in admin settings so it can change without a deploy. Karachi already has a flat fee, so start there.
- **Delivery clarity (#4).** Add a "Delivery" block on the product page: Karachi pickup is free, Karachi delivery is a flat
  fee, other cities are shipped in 1-2 business days. Optionally a city dropdown that shows the exact fee on the spot.
- **Capture the e-mail early.** Checkout only saves anything when the order is placed. Storing the e-mail once step 1 is
  valid enables abandoned-cart e-mails, which is the standard recovery tool. Needs a consent line.
- **Cash on delivery (decision, not a to-do).** You accept bank/wallet transfer only. In Pakistan COD drives a large share
  of orders and would likely lift conversion the most of anything here, but it brings fake orders and return costs.
  Options if you want it: COD for Karachi only, with a small advance, or WhatsApp confirmation before dispatch.
- **Trust near the buy button.** Next to Add to Cart: "Held for you 24h", "Our guarantee" (page exists), "Support on
  WhatsApp". These already exist as separate pages but are not present at the point of decision.
- **Coupon visibility.** Coupons apply only at checkout. Showing the applied code in the cart drawer, and a "Have a
  code?" hint there, avoids people leaving to hunt for one.
- **After the order.** The pay page is good (copy buttons, WhatsApp receipt). Add "Create an account to track this order"
  for guests, one click since the e-mail is known.

## 2. Trust and social proof

- **Reviews (#3).** The code says reviews are "a later phase", so the page is empty and the footer links to it. Build:
  `reviews` table, a review request e-mail 5-7 days after delivery (link opens a 1-tap star rating + optional photo),
  admin approve/hide, star average on product cards and product page, and `AggregateRating` in the product JSON-LD
  (you already generate product schema). Until this ships: either hide the footer link, or seed the page with a handful
  of real testimonials (with permission) from WhatsApp chats.
- **Real photos.** Customer photos of plants after unboxing beat studio shots for a nursery. Ask for them in the review flow.
- **Guarantee at a glance.** Surface the guarantee promise as a short badge on product cards, not only its own page.

## 3. Average order value

- **Cross-sell (#5).** "Pairs well with" on the product page (pot + soil for the plant you're viewing) and "Add a pot?"
  in the cart drawer. The catalogue already separates plants from Tools & Equipment, so matching is straightforward.
- **Care kits / bundles.** Plant + pot + soil + fertiliser at a small saving, shown as a single product. Also the
  easiest gift.
- **Gift option.** Gift message + hide prices on the delivery slip. Cheap and it opens a gifting audience.
- **Volume incentive.** The Karachi fee steps up above a certain item count; a "buy 3, save X" tier or the free-delivery
  bar aims at the same behaviour.

## 4. Retention and repeat purchases

- **Welcome coupon (#6).** A footer/exit signup that returns a `WELCOME10` style code. Builds the list you currently do not have.
- **Wishlist alerts.** The wishlist exists (and requires sign-in). Send back-in-stock and price-drop e-mails to people who saved it.
- **Back-in-stock for anyone (#7).** A "Notify me" field on sold-out products, no account needed.
- **Care follow-ups.** After delivery: a plant-specific care e-mail at day 2 and at week 3 ("time to repot / fertilise")
  that links to the matching soil/fertiliser. Ties support content to revenue.
- **Reorder and account.** Account shows orders, addresses and wishlist. Add "Buy again" on past orders.
- **Referral.** Each customer gets a personal code that gives a friend a discount and rewards them. Coupons make it small to build.
- **Events to sales.** Workshops are a strength. After an event, e-mail attendees a coupon for the plants/tools used.
  The events section and registration flow already exist.

## 5. Discovery and UX

- **Plant finder to cart.** The quiz filters by light, water and pets. Make results add-to-cart in place, and offer
  "e-mail me these results" (which also collects leads).
- **Sorting.** Shop sorts by new, price and name. Add "Best sellers" and "In stock first" once you have order data.
- **Recently viewed** strip on product and cart pages.
- **Stock messaging.** "Only N left" already exists for low stock. Keep it, and add it to product cards too.
- **Services (landscaping etc.).** These pages send people to WhatsApp only. Add a short request form (name, area,
  budget, photos) so leads are recorded and can be followed up even when WhatsApp is missed.

## 6. Analytics and admin

- GA4 already tracks view_item, add_to_cart, begin_checkout and purchase. Add: coupon applied/rejected, wishlist add,
  plant-finder completed, search with no results, and pay-page WhatsApp taps. That shows where the funnel leaks.
- Admin dashboard additions: unpaid orders about to expire (act by hand until reminders exist), low-stock list, top
  sellers, revenue by coupon, repeat-customer rate.
- Coupon usage and expiry are now in admin; add a per-coupon revenue and orders view.

## 7. Bugs and inconsistencies found

- **Chatbot gives wrong answers** ([lib/muffin-engine.ts](lib/muffin-engine.ts)): hard-coded "Next workshop: Feb 10"
  (a past date), "18+ in stock", and "Login at /account/orders", which is not a route (the page is `/account`).
  Fix: read the real next event and stock from the database, or remove the specifics.
- **Empty reviews page is linked in the footer** with no content behind it.
- **Cart drawer says "At checkout" for delivery** and never shows a discount or threshold; the running total is the subtotal only.
- **Two carts of truth for delivery:** `cart-provider` holds a `deliveryFee` while checkout recalculates its own. Worth
  unifying when the free-delivery bar goes in.
- **Coupon totals on admin order pages.** The order stores `discount_amount` and `coupon_code`, but I did not add them to
  the admin order screens. Small follow-up.

## 8. Suggested order of work

1. Week 1: #2 free-delivery bar, #4 delivery block, #8 chatbot fixes, hide/seed reviews link.
2. Week 2: #1 payment reminders (n8n), #6 welcome coupon signup.
3. Week 3-4: #3 reviews system, #5 cross-sell, #7 back-in-stock.
4. Then: care follow-up e-mails, wishlist alerts, referral, COD decision.

## What I could not check

I did not view the live site, run Lighthouse, or see traffic and conversion figures, so I cannot rank items by measured
loss. Connecting GA4/Search Console data would let me re-rank this list against actual drop-off points.
