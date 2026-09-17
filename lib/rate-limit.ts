/**
 * Basic in-memory rate limiter for API endpoints
 * 
 * ponytail: In-memory - works within a single process only, not across serverless invocations.
 * To upgrade: replace with @upstash/ratelimit + Redis, or a shared cache like Supabase.
 * 
 * Usage:
 * const limiter = new RateLimiter({
 *   interval: 60_000, // 1 minute in milliseconds
 *   max: 5, // max requests per interval
 * });
 * 
 * const isLimited = limiter.limit(ip);
 * if (isLimited) return new Response('Too Many Requests', { status: 429 });
 */

interface RateLimiterOptions {
  /** Time window in milliseconds */
  interval: number
  /** Maximum requests per interval */
  max: number
  /** Optional cleanup interval in milliseconds (default: 5 minutes) */
  cleanupInterval?: number
}

interface TimestampEntry {
  count: number
  timestamps: number[]
}

export class RateLimiter {
  private store = new Map<string, TimestampEntry>()
  private interval: number
  private max: number
  private cleanupInterval: number
  private cleanupTimer?: NodeJS.Timeout

  constructor(options: RateLimiterOptions) {
    this.interval = options.interval
    this.max = options.max
    this.cleanupInterval = options.cleanupInterval ?? 5 * 60 * 1000 // 5 minutes
    
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval)
    if (this.cleanupTimer.unref) this.cleanupTimer.unref()
  }

  /**
   * Check if a key (e.g., IP address) is rate limited
   * @returns true if limited (should reject), false if allowed
   */
  limit(key: string): boolean {
    const now = Date.now()
    const cutoff = now - this.interval
    
    let entry = this.store.get(key)
    
    if (!entry) {
      entry = { count: 1, timestamps: [now] }
      this.store.set(key, entry)
      return false
    }
    
    // Clean old timestamps
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)
    entry.count = entry.timestamps.length
    
    // Check if limit exceeded
    if (entry.count >= this.max) {
      return true
    }
    
    // Add new timestamp
    entry.timestamps.push(now)
    entry.count = entry.timestamps.length
    
    return false
  }

  /**
   * Get remaining requests for a key
   */
  remaining(key: string): number {
    const now = Date.now()
    const cutoff = now - this.interval
    
    const entry = this.store.get(key)
    if (!entry) return this.max
    
    const validTimestamps = entry.timestamps.filter(t => t > cutoff)
    return Math.max(0, this.max - validTimestamps.length)
  }

  /**
   * Get reset time (milliseconds until next window) for a key
   */
  resetIn(key: string): number {
    const now = Date.now()
    const entry = this.store.get(key)
    
    if (!entry || entry.timestamps.length === 0) return 0
    
    const oldest = Math.min(...entry.timestamps)
    return Math.max(0, oldest + this.interval - now)
  }

  /**
   * Clean up old entries that are outside any reasonable window
   */
  private cleanup() {
    const now = Date.now()
    const cutoff = now - (this.interval * 2) // Keep 2x interval for safety
    
    for (const [key, entry] of this.store.entries()) {
      const hasRecent = entry.timestamps.some(t => t > cutoff)
      if (!hasRecent) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Stop the cleanup timer (call this before process exit if needed)
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }
}

// Default instance for common use (5 requests per minute)
export const defaultLimiter = new RateLimiter({
  interval: 60_000, // 1 minute
  max: 5, // 5 requests per minute
})

/**
 * Helper to extract IP from NextRequest
 * Handles X-Forwarded-For header for Vercel deployments
 */
export function getClientIP(request: Request): string {
  // Try to get IP from headers (Vercel sets x-forwarded-for)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain (client IP)
    const firstIP = forwardedFor.split(',')[0].trim()
    if (firstIP) return firstIP
  }
  
  // Fallback to a placeholder (in production, should always have x-forwarded-for)
  return 'unknown'
}

/**
 * Convenience wrapper for Next.js route handlers
 * Returns 429 response if rate limited, otherwise null
 */
export function checkRateLimit(
  request: Request,
  limiter: RateLimiter = defaultLimiter
): Response | null {
  const ip = getClientIP(request)
  if (limiter.limit(ip)) {
    return new Response(
      JSON.stringify({ 
        error: 'Too many requests', 
        message: 'Rate limit exceeded. Please try again in a minute.' 
      }),
      { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
  return null
}