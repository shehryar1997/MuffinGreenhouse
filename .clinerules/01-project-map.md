## Maintenance rule
Whenever you create, delete, rename, or significantly restructure a file in this project,
update this file's own project map section as part of the SAME response, before ending the task.
When updating, only add/remove/modify the lines for files that changed — leave all other lines untouched.
Do not regenerate the full map unless explicitly asked to.

## Project map

### Root config files
`package.json` — Project dependencies and scripts — N/A — N/A
`tsconfig.json` — TypeScript configuration — N/A — N/A
`tailwind.config.ts` — Tailwind theme and custom colors — N/A — N/A
`next.config.mjs` — Next.js config — N/A — N/A
`postcss.config.mjs` — PostCSS config — N/A — N/A
`components.json` — shadcn/ui configuration — N/A — N/A
`.eslintrc.json` — ESLint config — N/A — N/A
`vercel.json` — Vercel deployment config with cron jobs — N/A — N/A

### /app (Next.js App Router)
`app/layout.tsx` — Root layout with providers — RootLayout, metadata — providers/*, layouts/*, @/lib/utils
`app/page.tsx` — Homepage with sections — FadeIn, KineticHeading, LiftText — @/config/*, @/data/*, @/components/*, framer-motion [LARGE]
`app/globals.css` — Global styles and CSS variables — N/A — N/A
`app/favicon.ico` — Site favicon — N/A — N/A
`app/shop/page.tsx` — Shop redirect — N/A — N/A
`app/shop/all/page.tsx` — All products grid — N/A — N/A
`app/shop/[category]/page.tsx` — Category product listing — N/A — N/A
`app/shop/product/[slug]/page.tsx` — Product detail page — N/A — N/A
`app/shop-by-need/page.tsx` — Shop by need landing — N/A — N/A
`app/shop-by-need/[slug]/page.tsx` — Need category page — N/A — N/A
`app/plant-finder/page.tsx` — Plant finder quiz — N/A — N/A
`app/events/page.tsx` — Events listing — Server Component — @/data/mock-products, ./events-grid
`app/events/events-grid.tsx` — Client component for event cards with hover animations — EventCard, EventsGrid — @/types, framer-motion
`app/events/[slug]/page.tsx` — Event detail wrapper — N/A — N/A
`app/events/[slug]/event-detail-client.tsx` — Event detail content [LARGE] — N/A — N/A
`app/journal/page.tsx` — Journal/blog listing — Server Component — @/data/mock-products, ./journal-grid
`app/journal/journal-grid.tsx` — Client component for journal cards with hover animations — JournalGrid — @/types, framer-motion
`app/journal/[slug]/page.tsx` — Journal post page — N/A — N/A
`app/muffin/page.tsx` — Muffin mascot/character page — N/A — N/A
`app/our-story/page.tsx` — About page — Server Component — N/A
`app/visit-us/page.tsx` — Visit/contact page — Server Component — N/A
`app/reviews/page.tsx` — Customer reviews — Server Component — @/data/mock-products, ./reviews-grid
`app/reviews/reviews-grid.tsx` — Client component for review cards with stagger animations — ReviewsGrid — @/types, framer-motion
`app/faq/page.tsx` — FAQ page — Server Component — ./faq-accordion
`app/faq/faq-accordion.tsx` — Client component for FAQ accordion with state — FAQAccordion — framer-motion
`app/delivery-and-pickup/page.tsx` — Delivery info — Server Component — N/A
`app/our-guarantee/page.tsx` — Guarantee page — Server Component — N/A
`app/contact/page.tsx` — Contact page — Server Component — N/A
`app/checkout/page.tsx` — Checkout flow — N/A — N/A
`app/checkout/pay/page.tsx` — Payment page with static account details and Confirm Booking — CheckoutPayPage — @/components/ui/*, @/lib/utils, @/config/nav.config
`app/account/page.tsx` — Account dashboard (server auth check + signed-out/signed-in states) — SignedOutState — @/components/ui/*, @/lib/supabase/server-client, ./account-dashboard
`app/account/account-dashboard.tsx` — Client dashboard for signed-in users — AccountDashboard — @/components/ui/*, @/lib/supabase/browser-client, framer-motion
`app/account/login/page.tsx` — Login page — N/A — N/A
`app/admin/login/page.tsx` — Admin login — N/A — N/A
`app/admin/products/page.tsx` — Products list with search — AdminProductsPage — @/supabase/admin-client
`app/admin/products/layout.tsx` — Admin layout with nav + logout — AdminProductsLayout — @/lib/admin-session
`app/admin/products/new/page.tsx` — New product form — N/A — N/A
`app/admin/products/[id]/edit/page.tsx` — Edit product form — N/A — N/A
`app/admin/email/page.tsx` — Email sender form [NEW] — AdminEmailPage — N/A
`app/api/send-email/route.ts` — Resend email API [NEW] — POST handler — resend, @/lib/rate-limit
`app/api/revalidate/route.ts` — ISR revalidation webhook — POST handler — N/A
`app/api/checkout-submit/route.ts` — Checkout order submission using Supabase create_order RPC — POST handler — @/lib/rate-limit, @/supabase/admin-client, @/lib/email/send-order-confirmation
`app/api/checkout-confirm/route.ts` — Booking confirmation endpoint (sends booking received email) — POST handler — @/lib/rate-limit, @/supabase/admin-client, @/lib/email/send-booking-received
`app/api/cron/expire-pending-orders/route.ts` — Cron job to auto-cancel pending orders after 2 hours — GET handler — @/supabase/admin-client, @/lib/email/send-order-cancelled
`app/api/product-dimensions/route.ts` — Fetch product box dimensions for shipping calculation — POST handler — @/lib/supabase/server-client

### /components
`components/light-filter-teaser.tsx` — Light level filter section — LightFilterTeaser — @/types, @/components/ui/*, @/data/* [LARGE]
`components/cart/cart-drawer.tsx` — Cart sidebar drawer — CartDrawer — @/components/providers/cart-provider, @/components/ui/* [LARGE]
`components/layout/footer.tsx` — Site footer — Footer — @/config/nav.config
`components/layout/header.tsx` — Site header with navigation — Header, ShopMegaMenu — @/config/nav.config, @/components/providers/* [LARGE]
`components/layout/shop-mega-menu.tsx` — Shop dropdown mega menu — ShopMegaMenu — @/config/nav.config [LARGE]
`components/providers/cart-provider.tsx` — Cart state context — CartProvider, useCart — @/types [LARGE]
`components/providers/search-provider.tsx` — Search state context — SearchProvider, useSearch — @/types
`components/providers/theme-provider.tsx` — Theme/dark mode provider — ThemeProvider — next-themes
`components/search/search-drawer.tsx` — Search overlay drawer — SearchDrawer — @/components/providers/search-provider [LARGE]
`components/ui/badge.tsx` — Status badge component — Badge — @/lib/utils
`components/ui/button.tsx` — Button component — Button, buttonVariants — @/lib/utils, class-variance-authority
`components/ui/card.tsx` — Card container — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter — @/lib/utils
`components/ui/input.tsx` — Form input component — Input — @/lib/utils
`components/ui/muffin-widget.tsx` — Chat widget — MuffinWidget — framer-motion [LARGE]
`components/ui/product-card.tsx` — Product display card — ProductCard, AddToCartButton — @/components/providers/cart-provider
`components/ui/slider.tsx` — Range slider — Slider — @radix-ui/react-slider
`components/ui/sonner.tsx` — Toast notifications — Toaster — sonner, next-themes
`components/ui/whatsapp-button.tsx` — WhatsApp CTA button — WhatsAppButton — N/A
`components/shop/product-filters.tsx` — Shared filter UI + logic — ProductFilters, FilterSidebar, MAX_PRICE — @/components/ui/*, @/types

### /config
`config/nav.config.ts` — Navigation config — siteConfig, shopByNeedCategories, shopMegaMenuSections, mainNav, footerNav, mobileNav — @/types

### /data
`data/mock-products.ts` — Mock data for products/events — mockProducts, mockEvents, mockReviews, mockJournalPosts, categories, categoryMeta, getProductBySlug, getProductsByCategory, etc. — @/types [LARGE]

### /hooks
`hooks/use-parallax.ts` — Cursor-reactive parallax — useParallax — React hooks
`hooks/use-reduced-motion.ts` — Motion preference hook — useReducedMotion — N/A

### /lib
`lib/utils.ts` — Utility functions — cn, formatPrice, debounce, throttle, formatDate, generateId, slugify, getInitials, scrollToElement — clsx, tailwind-merge
`lib/mood-utils.ts` — Mood theme utilities — Mood, MoodTheme, moodThemes, filterProductsByMood, getMoodTheme — @/types
`lib/plant-utils.ts` — Light filter logic — LightLevel, lightLevelLabels, filterProductsByLight, getLightPreviewProducts — @/types
`lib/admin-session.ts` — Admin session utilities (HMAC‑signed expiring tokens) — verifyPassword, getSessionCookieValue, isValidSessionCookie, COOKIE_NAME — crypto (Web Crypto), env:SESSION_SECRET
`lib/rate-limit.ts` — In-memory rate limiting — RateLimiter, defaultLimiter, getClientIP, checkRateLimit — N/A
`lib/rate-limit.test.ts` — Test suite for rate limiting — N/A — N/A
`lib/UPGRADE-RATE-LIMIT.md` — Upgrade guide for distributed rate limiting — N/A — N/A
`lib/email/send-otp-email.ts` — OTP email sender using Resend — sendOtpEmail — resend
`lib/email/send-order-confirmation.ts` — Order confirmation email sender — sendOrderConfirmationEmail — resend
`lib/email/send-booking-received.ts` — Booking received email sender — sendBookingReceivedEmail — resend
`lib/email/send-order-confirmed.ts` — Payment received / order confirmed email sender — sendOrderConfirmedEmail — resend
`lib/email/send-order-cancelled.ts` — Order cancelled email sender — sendOrderCancelledEmail — resend

### /types
`types/index.ts` — Core TypeScript types — Category, Product, ProductImage, CareInfo, ProductVariant, Review, CartItem, Cart, User, Address, Order, MyPlant, Event, JournalPost, NavItem, etc. — Includes shipping box dimensions (boxHeightCm, boxWidthCm, boxBreadthCm) — N/A

## Shared dependencies
- `@/types` — Imported by: data/mock-products.ts, lib/mood-utils.ts, lib/plant-utils.ts, components/providers/cart-provider.tsx, components/providers/search-provider.tsx, components/ui/product-card.tsx, components/shop/product-filters.tsx
- `@/lib/utils` — Imported by: components/ui/* (7 files), components/layout/header.tsx, components/layout/footer.tsx
- `@/config/nav.config` — Imported by: components/layout/header.tsx, components/layout/shop-mega-menu.tsx, components/layout/footer.tsx, app/page.tsx
- `@/data/mock-products` — Imported by: app/page.tsx, app/shop/*, components/light-filter-teaser.tsx
- `framer-motion` — Imported by: app/page.tsx, components/ui/muffin-widget.tsx, components/layout/header.tsx
- `@/components/providers/cart-provider` — Imported by: components/cart/cart-drawer.tsx, components/ui/product-card.tsx, app/layout.tsx
- `@/components/providers/search-provider` — Imported by: components/search/search-drawer.tsx, components/layout/header.tsx, app/layout.tsx
- `@/components/providers/theme-provider` — Imported by: app/layout.tsx
- `@/components/shop/product-filters` — Imported by: app/shop/all/page.tsx, app/shop/[category]/page.tsx
