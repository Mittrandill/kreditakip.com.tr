import { kv } from "@vercel/kv"

/**
 * KV Storage Client
 *
 * Production: Uses Vercel KV (Redis)
 * Development: Falls back to in-memory Map if KV is not configured
 */

// Fallback for development (if KV is not configured)
const memoryStorage = new Map<string, string>()

export const kvStorage = {
  /**
   * Set a key-value pair with optional expiration (in seconds)
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    try {
      if (process.env.KV_REST_API_URL) {
        // Production: Use Vercel KV
        if (expirationSeconds) {
          await kv.setex(key, expirationSeconds, value)
        } else {
          await kv.set(key, value)
        }
      } else {
        // Development fallback: In-memory Map
        console.warn("[KV] Using in-memory storage (development only)")
        memoryStorage.set(key, value)

        // Simulate expiration with setTimeout
        if (expirationSeconds) {
          setTimeout(() => memoryStorage.delete(key), expirationSeconds * 1000)
        }
      }
    } catch (error) {
      console.error("[KV] Set error:", error)
      // Fallback to memory storage on error
      memoryStorage.set(key, value)
      if (expirationSeconds) {
        setTimeout(() => memoryStorage.delete(key), expirationSeconds * 1000)
      }
    }
  },

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      if (process.env.KV_REST_API_URL) {
        // Production: Use Vercel KV
        return await kv.get<string>(key)
      } else {
        // Development fallback: In-memory Map
        console.warn("[KV] Using in-memory storage (development only)")
        return memoryStorage.get(key) || null
      }
    } catch (error) {
      console.error("[KV] Get error:", error)
      // Fallback to memory storage on error
      return memoryStorage.get(key) || null
    }
  },

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    try {
      if (process.env.KV_REST_API_URL) {
        // Production: Use Vercel KV
        await kv.del(key)
      } else {
        // Development fallback: In-memory Map
        memoryStorage.delete(key)
      }
    } catch (error) {
      console.error("[KV] Delete error:", error)
      // Fallback to memory storage on error
      memoryStorage.delete(key)
    }
  },

  /**
   * Check if KV is properly configured
   */
  isConfigured(): boolean {
    return !!process.env.KV_REST_API_URL
  },
}
