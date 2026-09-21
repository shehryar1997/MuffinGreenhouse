## Testing & CI
`tests/smoke.spec.ts` — Playwright smoke tests for critical paths — test, expect — ./setup, playwright
`tests/audit-regressions.spec.ts` — Audit/regression guard tests — test, expect — @playwright/test
`tests/setup.ts` — Test utilities and fixtures — test, expect — @playwright/test
`playwright.config.ts` — Playwright configuration — defineConfig, devices — @playwright/test, package.json scripts
`.github/workflows/ci.yml` — GitHub Actions CI pipeline — N/A — package.json scripts, tests/*
`README.md` — Project overview and development guide — N/A — TESTING.md
`TESTING.md` — Detailed testing documentation — N/A — playwright.config.ts, tests/*

## Shared dependencies
- `@/types` — Imported by: data/mock-products.ts, lib/plant-utils.ts, lib/structured-data.ts, components/providers/cart-provider.tsx, components/providers/search-provider.tsx, components/ui/product-card.tsx, components/shop/product-filters.tsx
- `@/lib/utils` — Imported by: components/ui/* (7 files), components/layout/header.tsx, components/layout/footer.tsx
- `@/config/nav.config` — Imported by: lib/structured-data.ts, components/layout/header.tsx, components/layout/shop-mega-menu.tsx, components/layout/footer.tsx, app/page.tsx
- `@/data/mock-products` — Imported by: app/page.tsx, app/shop/*, components/light-filter-teaser.tsx
- `framer-motion` — Imported by: app/page.tsx, components/ui/muffin-widget.tsx, components/layout/header.tsx
- `@/components/providers/cart-provider` — Imported by: components/cart/cart-drawer.tsx, components/ui/product-card.tsx, app/layout.tsx
- `@/components/providers/search-provider` — Imported by: components/search/search-drawer.tsx, components/layout/header.tsx, app/layout.tsx
- `@/components/providers/theme-provider` — Imported by: app/layout.tsx
- `@/components/shop/product-filters` — Imported by: app/shop/all/page.tsx, app/shop/[category]/page.tsx
- `@/lib/structured-data` — Imported by: app/layout.tsx, app/shop/product/[slug]/product-detail-client.tsx, app/shop/[category]/shop-category-client.tsx, app/shop/all/shop-all-client.tsx