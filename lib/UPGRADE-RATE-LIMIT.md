# Rate Limiting Upgrade Path

## Current Implementation

The current rate limiter (`lib/rate-limit.ts`) is an **in-memory, single-process solution** that works within these boundaries:

- ✅ Basic rate limiting (5 requests/minute per IP)
- ✅ Works in development and small deployments
- ✅ No external dependencies
- ✅ Easy to test and debug

**Limitations:**
- ❌ **Single process only** - doesn't work across serverless function invocations
- ❌ **Memory-based** - resets on server restart/redeploy
- ❌ **No persistence** - can't share state between edge functions

## When to Upgrade

Upgrade to a distributed rate limiter when:

1. **Deploying to Vercel** (serverless functions)
2. **Scaling beyond a single process**
3. **Needing consistent rate limiting across deployments**
4. **Handling high traffic**

## Recommended Upgrade Options

### Option 1: @upstash/ratelimit + Redis (Recommended for Vercel)

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create a new rate limiter using Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
})

// Usage in route handler
const { success, limit, reset, remaining } = await rateLimiter.limit(ip)
if (!success) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "X-RateLimit-Limit": limit.toString(), "X-RateLimit-Remaining": remaining.toString(), "X-RateLimit-Reset": reset.toString() } }
  )
}
```

**Pros:**
- Works across serverless functions
- Persists across deployments
- Vercel-native (Upstash is Vercel's Redis service)
- Highly scalable

**Cons:**
- Additional cost for Redis
- External dependency

### Option 2: Supabase Edge Functions with KV

If you're already using Supabase:

```typescript
// In Supabase Edge Function
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Use Supabase's KV store for rate limiting
// (Requires custom implementation)
```

**Pros:**
- Leverages existing Supabase infrastructure
- Consistency with your data layer

**Cons:**
- More complex implementation
- KV store availability varies by region

### Option 3: Vercel's Built-in Rate Limiting

If using Vercel Pro/Enterprise:

```typescript
// Use Vercel's API for advanced rate limiting
// See: https://vercel.com/docs/security/rate-limits
```

**Pros:**
- Built into platform
- No additional code changes needed

**Cons:**
- Available on higher-tier plans
- Less control over exact bucket configuration

## Migration Steps

1. **Install dependencies** for your chosen solution
2. **Create environment variables** (e.g., `UPSTASH_REDIS_REST_URL`)
3. **Update `lib/rate-limit.ts`** to use the new implementation
4. **Test thoroughly** - the API should remain the same
5. **Deploy and monitor** rate limiting behavior

## Files to Update

When migrating to a distributed solution:

- `lib/rate-limit.ts` - Replace `RateLimiter` class implementation
- `app/api/send-email/route.ts` - Already uses `checkRateLimit()`, no change needed
- `app/api/checkout-submit/route.ts` - Already uses `checkRateLimit()`, no change needed
- Any future API routes - Use `checkRateLimit()` as shown

## Testing Distributed Rate Limiting

```typescript
// Create a test that simulates multiple function invocations
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

describe("Distributed rate limiting", () => {
  it("should work across multiple function invocations", async () => {
    // Test from different "processes"
  })
})
```

## Monitoring

Set up monitoring for:
- Rate limit hits (429 responses)
- Redis connection errors  
- Request patterns by IP
- Peak traffic times

## Security Considerations

- **IP spoofing**: The current implementation uses `x-forwarded-for` header
- **Burst attacks**: Consider adding token bucket or fixed window algorithms
- **DDoS protection**: Rate limiting alone isn't sufficient for DDoS

---

**Current Status**: Using in-memory rate limiting. Upgrade when deploying to production on Vercel.