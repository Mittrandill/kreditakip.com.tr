/**
 * Performance utilities for enhanced reports
 */

// Simple in-memory cache with TTL
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttlMs = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  delete(key: string) {
    this.cache.delete(key)
  }
  
  clear() {
    this.cache.clear()
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
}

export const reportCache = new MemoryCache()

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), waitMs)
  }
}

// Throttle utility for frequent operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limitMs)
    }
  }
}

// Memoization for expensive calculations
const memoCache = new Map<string, any>()

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (memoCache.has(key)) {
      return memoCache.get(key)
    }
    
    const result = func(...args)
    memoCache.set(key, result)
    
    // Clean up old entries to prevent memory leaks
    if (memoCache.size > 100) {
      const firstKey = memoCache.keys().next().value
      memoCache.delete(firstKey)
    }
    
    return result
  }) as T
}

// Async data loader with caching
export async function cachedLoader<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = 5 * 60 * 1000
): Promise<T> {
  // Check cache first
  const cached = reportCache.get(key)
  if (cached) {
    return cached
  }
  
  // Load data
  const data = await loader()
  
  // Cache result
  reportCache.set(key, data, ttlMs)
  
  return data
}

// Batch operations utility
export class BatchProcessor<T, R> {
  private queue: T[] = []
  private processor: (items: T[]) => Promise<R[]>
  private batchSize: number
  private delay: number
  private timeout: NodeJS.Timeout | null = null
  
  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize = 10,
    delayMs = 100
  ) {
    this.processor = processor
    this.batchSize = batchSize
    this.delay = delayMs
  }
  
  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item)
      
      // Store resolve/reject with the item
      ;(item as any).__resolve = resolve
      ;(item as any).__reject = reject
      
      this.scheduleProcess()
    })
  }
  
  private scheduleProcess() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    
    this.timeout = setTimeout(() => {
      this.processBatch()
    }, this.delay)
    
    // Process immediately if batch is full
    if (this.queue.length >= this.batchSize) {
      this.processBatch()
    }
  }
  
  private async processBatch() {
    if (this.queue.length === 0) return
    
    const batch = this.queue.splice(0, this.batchSize)
    
    try {
      const results = await this.processor(batch)
      
      batch.forEach((item, index) => {
        const resolve = (item as any).__resolve
        if (resolve) {
          resolve(results[index])
        }
      })
    } catch (error) {
      batch.forEach(item => {
        const reject = (item as any).__reject
        if (reject) {
          reject(error)
        }
      })
    }
    
    // Process remaining items
    if (this.queue.length > 0) {
      this.scheduleProcess()
    }
  }
}

// Enhanced Performance monitoring with Core Web Vitals
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private observers: PerformanceObserver[] = []
  private static instance: PerformanceMonitor
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  startTiming(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }
  
  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }
  
  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    const start = performance.now()
    renderFn()
    const end = performance.now()
    
    this.recordMetric(`render_${componentName}`, end - start)
  }

  // Measure API call time
  async measureApiCall<T>(name: string, apiCall: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await apiCall()
      const end = performance.now()
      this.recordMetric(`api_${name}`, end - start)
      return result
    } catch (error) {
      const end = performance.now()
      this.recordMetric(`api_${name}_error`, end - start)
      throw error
    }
  }

  // Monitor Core Web Vitals
  initCoreWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.recordMetric('lcp', lastEntry.renderTime || lastEntry.loadTime)
      })
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.push(lcpObserver)
    } catch (e) {
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime)
        })
      })
      
      fidObserver.observe({ type: 'first-input', buffered: true })
      this.observers.push(fidObserver)
    } catch (e) {
    }

    // Cumulative Layout Shift
    let clsValue = 0
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.recordMetric('cls', clsValue)
      })
      
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      this.observers.push(clsObserver)
    } catch (e) {
    }
  }

  // Get memory usage
  getMemoryUsage() {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null
    }

    const memory = (performance as any).memory
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    }
  }

  // Get network information
  getNetworkInfo() {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return null
    }

    const connection = (navigator as any).connection
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }
  
  getStats(label: string) {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return null
    
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    return { avg, min, max, count: values.length }
  }
  
  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [label, values] of this.metrics) {
      stats[label] = this.getStats(label)
    }
    return stats
  }
  
  // Get performance insights
  getInsights() {
    const insights: Record<string, any> = {}
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)
      
      insights[name] = {
        average: Math.round(avg * 100) / 100,
        max: Math.round(max * 100) / 100,
        min: Math.round(min * 100) / 100,
        count: values.length
      }
    }
    
    return insights
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
  
  clear(label?: string) {
    if (label) {
      this.metrics.delete(label)
    } else {
      this.metrics.clear()
    }
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    const monitor = PerformanceMonitor.getInstance()
    monitor.initCoreWebVitals()
    
    // Log performance insights every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const insights = monitor.getInsights()
        const memory = monitor.getMemoryUsage()
        const network = monitor.getNetworkInfo()
        
      }, 30000)
    }
  }
}

export const perfMonitor = new PerformanceMonitor()

// Virtual scrolling utilities
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 5
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )
  
  return { startIndex, endIndex, visibleCount: endIndex - startIndex + 1 }
}

// Data processing optimizations
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export function processDataInChunks<T, R>(
  data: T[],
  processor: (chunk: T[]) => R[],
  chunkSize = 100
): R[] {
  const chunks = chunkArray(data, chunkSize)
  const results: R[] = []
  
  for (const chunk of chunks) {
    results.push(...processor(chunk))
  }
  
  return results
}

// Web Worker utilities for heavy computations
export function createWorkerScript(workerFunction: Function): string {
  const script = `
    self.onmessage = function(e) {
      const { data, id } = e.data;
      try {
        const result = (${workerFunction.toString()})(data);
        self.postMessage({ result, id });
      } catch (error) {
        self.postMessage({ error: error.message, id });
      }
    };
  `
  
  return URL.createObjectURL(new Blob([script], { type: 'application/javascript' }))
}

export function runInWorker<T, R>(
  data: T,
  workerFunction: (data: T) => R
): Promise<R> {
  return new Promise((resolve, reject) => {
    const workerScript = createWorkerScript(workerFunction)
    const worker = new Worker(workerScript)
    const id = Math.random().toString(36)
    
    const cleanup = () => {
      worker.terminate()
      URL.revokeObjectURL(workerScript)
    }
    
    worker.onmessage = (e) => {
      const { result, error, id: responseId } = e.data
      
      if (responseId === id) {
        cleanup()
        
        if (error) {
          reject(new Error(error))
        } else {
          resolve(result)
        }
      }
    }
    
    worker.onerror = (error) => {
      cleanup()
      reject(error)
    }
    
    worker.postMessage({ data, id })
    
    // Cleanup after 30 seconds to prevent memory leaks
    setTimeout(cleanup, 30000)
  })
}