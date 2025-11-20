/**
 * Simple in-memory rate limiter
 *
 * IMPORTANT: This is a basic implementation suitable for single-server deployments.
 * For production multi-server environments, consider using:
 * - Redis-based rate limiting (e.g., @upstash/ratelimit)
 * - Vercel Edge Config
 * - Cloudflare Workers KV
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Unique identifier for the rate limit (e.g., IP address, user ID)
   */
  identifier: string

  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number

  /**
   * Time window in seconds
   */
  windowSeconds: number
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  success: boolean

  /**
   * Number of requests remaining in the current window
   */
  remaining: number

  /**
   * Time in seconds until the rate limit resets
   */
  reset: number

  /**
   * Total limit for this identifier
   */
  limit: number
}

/**
 * Check if a request should be rate limited
 */
export function rateLimit(config: RateLimitConfig): RateLimitResult {
  const { identifier, limit, windowSeconds } = config
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  // Get or create rate limit entry
  const entry = store[identifier]

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs
    }

    return {
      success: true,
      remaining: limit - 1,
      reset: windowSeconds,
      limit
    }
  }

  // Increment count
  entry.count++

  const remaining = Math.max(0, limit - entry.count)
  const resetSeconds = Math.ceil((entry.resetTime - now) / 1000)

  return {
    success: entry.count <= limit,
    remaining,
    reset: resetSeconds,
    limit
  }
}

/**
 * Get IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  // Check common proxy headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default value
  return 'unknown'
}

/**
 * Preset rate limit configurations
 */
export const RateLimits = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per 15 minutes per IP
   */
  AUTH: {
    limit: 5,
    windowSeconds: 15 * 60
  },

  /**
   * Rate limit for API endpoints
   * 100 requests per minute per IP
   */
  API: {
    limit: 100,
    windowSeconds: 60
  },

  /**
   * Rate limit for expensive operations (OCR, AI)
   * 10 requests per hour per user
   */
  EXPENSIVE: {
    limit: 10,
    windowSeconds: 60 * 60
  },

  /**
   * Rate limit for contact forms
   * 3 requests per hour per IP
   */
  CONTACT_FORM: {
    limit: 3,
    windowSeconds: 60 * 60
  },

  /**
   * Rate limit for newsletter subscription
   * 5 requests per day per IP
   */
  NEWSLETTER: {
    limit: 5,
    windowSeconds: 24 * 60 * 60
  },

  /**
   * Rate limit for payment initialization
   * 5 requests per minute per IP (prevent card testing attacks)
   */
  PAYMENT_INIT: {
    limit: 5,
    windowSeconds: 60
  },

  /**
   * Rate limit for webhook endpoints
   * 100 requests per minute per IP (allow legitimate retries)
   */
  WEBHOOK: {
    limit: 100,
    windowSeconds: 60
  }
}
