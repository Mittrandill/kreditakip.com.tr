"use client"

import type React from "react"

import { useState } from "react"

import { useCallback, useMemo, useRef, useEffect } from "react"

// Debounce hook for search and input optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for scroll and resize events
export function useThrottle<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const throttledCallback = useRef<T>()
  const lastExecuted = useRef<number>(0)

  return useCallback(
    ((...args) => {
      const now = Date.now()
      if (now - lastExecuted.current >= delay) {
        lastExecuted.current = now
        return callback(...args)
      }
    }) as T,
    [callback, delay],
  )
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(elementRef: React.RefObject<Element>, options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef, options])

  return isIntersecting
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length)

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    }
  }, [items, itemHeight, containerHeight, scrollTop])

  return {
    ...visibleItems,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
  }
}

// Request batching utility
class RequestBatcher {
  private batches = new Map<string, Promise<any>>()
  private timeouts = new Map<string, NodeJS.Timeout>()

  batch<T>(key: string, request: () => Promise<T>, delay = 50): Promise<T> {
    // Clear existing timeout
    const existingTimeout = this.timeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Return existing batch if available
    if (this.batches.has(key)) {
      return this.batches.get(key)!
    }

    // Create new batched request
    const batchedRequest = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.batches.delete(key)
          this.timeouts.delete(key)
        }
      }, delay)

      this.timeouts.set(key, timeout)
    })

    this.batches.set(key, batchedRequest)
    return batchedRequest
  }
}

export const requestBatcher = new RequestBatcher()

// Cache utility with TTL
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl = 300000) {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const cacheManager = new CacheManager()
