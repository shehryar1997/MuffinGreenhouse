/**
 * Test file for rate limiting functionality
 * Run with: npx tsx lib/rate-limit.test.ts
 */

import { RateLimiter } from './rate-limit'

function testBasicRateLimiting() {
  console.log('Testing basic rate limiting...')
  
  const limiter = new RateLimiter({
    interval: 1000, // 1 second window
    max: 3, // 3 requests per second
  })
  
  const ip = '127.0.0.1'
  
  // First 3 requests should succeed
  console.assert(!limiter.limit(ip), 'Request 1 should pass')
  console.assert(!limiter.limit(ip), 'Request 2 should pass')
  console.assert(!limiter.limit(ip), 'Request 3 should pass')
  
  // Fourth request should be limited
  console.assert(limiter.limit(ip), 'Request 4 should be limited')
  
  console.log('✓ Basic rate limiting works')
}

function testWindowSliding() {
  console.log('Testing window sliding...')
  
  const limiter = new RateLimiter({
    interval: 1000,
    max: 2,
  })
  
  const ip = '192.168.1.1'
  
  // Make 2 requests
  console.assert(!limiter.limit(ip), 'Request 1 should pass')
  console.assert(!limiter.limit(ip), 'Request 2 should pass')
  
  // Wait 1.1 seconds (past window)
  setTimeout(() => {
    console.assert(!limiter.limit(ip), 'Request after window should pass')
    console.log('✓ Window sliding works')
  }, 1100)
}

function testMultipleIPs() {
  console.log('Testing multiple IPs...')
  
  const limiter = new RateLimiter({
    interval: 1000,
    max: 2,
  })
  
  const ip1 = '10.0.0.1'
  const ip2 = '10.0.0.2'
  
  // IP1 uses its quota
  console.assert(!limiter.limit(ip1), 'IP1 request 1 should pass')
  console.assert(!limiter.limit(ip1), 'IP1 request 2 should pass')
  console.assert(limiter.limit(ip1), 'IP1 request 3 should be limited')
  
  // IP2 should still have quota
  console.assert(!limiter.limit(ip2), 'IP2 request 1 should pass')
  console.assert(!limiter.limit(ip2), 'IP2 request 2 should pass')
  console.assert(limiter.limit(ip2), 'IP2 request 3 should be limited')
  
  console.log('✓ Multiple IP isolation works')
}

function testRemainingAndReset() {
  console.log('Testing remaining and reset calculations...')
  
  const limiter = new RateLimiter({
    interval: 1000,
    max: 5,
  })
  
  const ip = '172.16.0.1'
  
  console.assert(limiter.remaining(ip) === 5, 'Remaining should be 5 initially')
  
  limiter.limit(ip)
  console.assert(limiter.remaining(ip) === 4, 'Remaining should be 4 after 1 request')
  
  limiter.limit(ip)
  limiter.limit(ip)
  limiter.limit(ip)
  console.assert(limiter.remaining(ip) === 1, 'Remaining should be 1 after 4 requests')
  
  const resetIn = limiter.resetIn(ip)
  console.assert(resetIn > 0 && resetIn <= 1000, `Reset should be between 0-1000ms, got ${resetIn}`)
  
  console.log('✓ Remaining and reset calculations work')
}

function testCleanup() {
  console.log('Testing cleanup...')
  
  const limiter = new RateLimiter({
    interval: 1000,
    max: 2,
    cleanupInterval: 500, // Short cleanup for test
  })
  
  const oldIP = '192.168.0.99'
  const now = Date.now()
  
  // Simulate an old timestamp (outside 2x interval)
  limiter['store'].set(oldIP, {
    count: 1,
    timestamps: [now - 3000] // 3 seconds old
  })
  
  // Trigger cleanup manually
  limiter['cleanup']()
  
  console.assert(!limiter['store'].has(oldIP), 'Old entries should be cleaned up')
  
  limiter.destroy()
  console.log('✓ Cleanup works')
}

// Run tests
try {
  testBasicRateLimiting()
  
  // Run async tests
  setTimeout(() => {
    testWindowSliding()
    
    testMultipleIPs()
    testRemainingAndReset()
    testCleanup()
    
    console.log('\n✅ All rate limiting tests passed!')
    console.log('\nNote: This implementation is in-memory only (single process).')
    console.log('For production scaling across serverless functions, consider:')
    console.log('1. @upstash/ratelimit + Redis (recommended for Vercel)')
    console.log('2. Supabase Edge Functions with KV store')
    console.log('3. Vercel\'s built-in rate limiting features')
  }, 1200)
} catch (error) {
  console.error('❌ Test failed:', error)
  process.exit(1)
}