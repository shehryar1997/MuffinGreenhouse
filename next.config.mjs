import analyze from '@next/bundle-analyzer';

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
    ],
    formats: ['image/webp', 'image/avif'], // ponytail: Optimized image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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
    const scriptSrc = process.env.NODE_ENV === 'production'
      ? "script-src 'self' 'unsafe-inline';"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
    // Client components (cart-provider session check, wishlist, account,
    // checkout saved-address lookup) call Supabase directly from the browser
    // via @supabase/ssr's browser client — a cross-origin fetch. `connect-src
    // 'self'` alone blocks every one of those calls with a CSP violation, so
    // the Supabase project URL must be explicitly allow-listed here.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const connectSrc = supabaseUrl ? `connect-src 'self' ${supabaseUrl};` : "connect-src 'self';"
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com https://ik.imagekit.io https://images.pexels.com https://pub-81f46d28c378411d9acc02aef58b2bee.r2.dev; ${scriptSrc} style-src 'self' 'unsafe-inline'; font-src 'self'; ${connectSrc} frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
