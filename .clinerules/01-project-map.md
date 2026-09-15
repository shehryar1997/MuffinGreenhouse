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
`app/events/page.tsx` — Events listing — N/A — N/A
`app/events/[slug]/page.tsx` — Event detail wrapper — N/A — N/A
`app/events/[slug]/event-detail-client.tsx` — Event detail content [LARGE] — N/A — N/A
`app/journal/page.tsx` — Journal/blog listing — N/A — N/A
`app/journal/[slug]/page.tsx` — Journal post page — N/A — N/A
`app/muffin/page.tsx` — Muffin mascot/character page — N/A — N/A
`app/our-story/page.tsx` — About page — N/A — N/A
`app/visit-us/page.tsx` — Visit/contact page — N/A — N/A
`app/reviews/page.tsx` — Customer reviews — N/A — N/A
`app/faq/page.tsx` — FAQ page — N/A — N/A
`app/delivery-and-pickup/page.tsx` — Delivery info — N/A — N/A
`app/our-guarantee/page.tsx` — Guarantee page — N/A — N/A
`app/contact/page.tsx` — Contact form — N/A — N/A
`app/checkout/page.tsx` — Checkout flow — N/A — N/A
`app/account/page.tsx` — Account dashboard — N/A — N/A
`app/account/login/page.tsx` — Login page — N/A — N/A

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

### /config
`config/categories.ts` — Category definitions — plantCategories, useCaseCategories, moodCategories — N/A
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

### /types
`types/index.ts` — Core TypeScript types — Category, Product, ProductImage, CareInfo, ProductVariant, Review, CartItem, Cart, User, Address, Order, MyPlant, Event, JournalPost, NavItem, etc. — N/A

## Shared dependencies
- `@/types` — Imported by: data/mock-products.ts, lib/mood-utils.ts, lib/plant-utils.ts, components/providers/cart-provider.tsx, components/providers/search-provider.tsx, components/ui/product-card.tsx
- `@/lib/utils` — Imported by: components/ui/* (7 files), components/layout/header.tsx, components/layout/footer.tsx
- `@/config/nav.config` — Imported by: components/layout/header.tsx, components/layout/shop-mega-menu.tsx, components/layout/footer.tsx, app/page.tsx
- `@/data/mock-products` — Imported by: app/page.tsx, app/shop/*, components/light-filter-teaser.tsx
- `framer-motion` — Imported by: app/page.tsx, components/ui/muffin-widget.tsx, components/layout/header.tsx
- `@/components/providers/cart-provider` — Imported by: components/cart/cart-drawer.tsx, components/ui/product-card.tsx, app/layout.tsx
- `@/components/providers/search-provider` — Imported by: components/search/search-drawer.tsx, components/layout/header.tsx, app/layout.tsx
- `@/components/providers/theme-provider` — Imported by: app/layout.tsx
