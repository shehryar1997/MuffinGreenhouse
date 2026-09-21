import analyze from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs/config';

const withBundleAnalyzer = analyze({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'pub-81f46d28c378411d9acc02aef58b2bee.r2.dev' },
      { protocol: 'https', hostname: 'images.muffinplants.com' },
    ],
    formats: ['image/webp', 'image/avif'], // ponytail: Optimized image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // 2048/3840 removed: 4K-wide variants of every image were mostly wasted bytes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    scrollRestoration: true,
  },
  // ponytail: Production build optimizations
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  async headers() {
    // Next.js dev mode (HMR / fast refresh) evaluates code via eval(), which
    // a strict script-src without 'unsafe-eval' blocks outright — that would
    // break `next dev` in the browser. Only lock this down in production.
    // Google Analytics (<GoogleAnalytics /> in app/layout.tsx) loads gtag.js from
    // googletagmanager.com and reports to google-analytics.com; without these
    // allowances the CSP below silently blocks it. Only added when a GA ID is set.
    const gaEnabled = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    const gaScript = gaEnabled ? ' https://www.googletagmanager.com' : ''
    const gaConnect = gaEnabled
      ? ' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com'
      : ''
    const gaImg = gaEnabled ? ' https://www.google-analytics.com https://www.googletagmanager.com' : ''
    const scriptSrc = process.env.NODE_ENV === 'production'
      ? `script-src 'self' 'unsafe-inline'${gaScript};`
      : `script-src 'self' 'unsafe-inline' 'unsafe-eval'${gaScript};`
    // Client components (cart-provider session check, wishlist, account,
    // checkout saved-address lookup) call Supabase directly from the browser
    // via @supabase/ssr's browser client — a cross-origin fetch. `connect-src
    // 'self'` alone blocks every one of those calls with a CSP violation, so
    // the Supabase project URL must be explicitly allow-listed here.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Sentry's browser SDK posts events/replays to the DSN's ingest host, which
    // is also cross-origin, so it needs the same explicit allow-listing.
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
    let sentryOrigin = ''
    try {
      if (sentryDsn) sentryOrigin = new URL(sentryDsn).origin
    } catch {
      // Malformed DSN: Sentry won't initialise either, so nothing to allow.
    }
    const connectSrc = `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ''}${sentryOrigin ? ` ${sentryOrigin}` : ''}${gaConnect};`
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com https://ik.imagekit.io https://images.pexels.com https://pub-81f46d28c378411d9acc02aef58b2bee.r2.dev https://images.muffinplants.com${gaImg}; ${scriptSrc} style-src 'self' 'unsafe-inline'; font-src 'self'; ${connectSrc} frame-ancestors 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:;`,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Admin is private. robots.txt must NOT block it: a crawler that can't fetch the page never sees this header.
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  telemetry: false,
  silent: !process.env.CI,
  // Source-map upload needs SENTRY_AUTH_TOKEN; skip it (quietly) when unset.
  // Note the build still logs one "Will not create release" warning per bundle
  // in that case — it goes away once the token is set.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
})
