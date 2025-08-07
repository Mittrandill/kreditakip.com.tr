"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { calculateVisibleRange, perfMonitor } from "@/lib/performance"
import { cn } from "@/lib/utils"

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
  estimatedItemHeight?: number
  getItemKey?: (item: T, index: number) => string | number
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  estimatedItemHeight,
  getItemKey = (_, index) => index
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map())
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const stopTiming = perfMonitor.startTiming('calculateVisibleRange')
    
    const range = calculateVisibleRange(
      scrollTop,
      containerHeight,
      estimatedItemHeight || itemHeight,
      items.length,
      overscan
    )
    
    stopTiming()
    return range
  }, [scrollTop, containerHeight, itemHeight, estimatedItemHeight, items.length, overscan])
  
  // Get visible items
  const visibleItems = useMemo(() => {
    const stopTiming = perfMonitor.startTiming('getVisibleItems')
    
    const result = items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
    
    stopTiming()
    return result
  }, [items, visibleRange.startIndex, visibleRange.endIndex])
  
  // Calculate total height
  const totalHeight = useMemo(() => {
    if (estimatedItemHeight) {
      // Use measured heights if available
      let height = 0
      for (let i = 0; i < items.length; i++) {
        const measured = measuredHeights.get(i)
        height += measured || estimatedItemHeight
      }
      return height
    }
    return items.length * itemHeight
  }, [items.length, itemHeight, estimatedItemHeight, measuredHeights])
  
  // Calculate offset for visible items
  const offsetY = useMemo(() => {
    if (estimatedItemHeight) {
      let offset = 0
      for (let i = 0; i < visibleRange.startIndex; i++) {
        const measured = measuredHeights.get(i)
        offset += measured || estimatedItemHeight
      }
      return offset
    }
    return visibleRange.startIndex * itemHeight
  }, [visibleRange.startIndex, itemHeight, estimatedItemHeight, measuredHeights])
  
  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    onScroll?.(scrollTop)
  }, [onScroll])
  
  // Measure item height for dynamic sizing
  const measureItem = useCallback((index: number, height: number) => {
    if (estimatedItemHeight) {
      setMeasuredHeights(prev => {
        const newMap = new Map(prev)
        newMap.set(index, height)
        return newMap
      })
    }
  }, [estimatedItemHeight])
  
  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollElementRef.current) return
    
    let targetScrollTop = 0
    if (estimatedItemHeight) {
      for (let i = 0; i < index; i++) {
        const measured = measuredHeights.get(i)
        targetScrollTop += measured || estimatedItemHeight
      }
    } else {
      targetScrollTop = index * itemHeight
    }
    
    scrollElementRef.current.scrollTop = targetScrollTop
  }, [itemHeight, estimatedItemHeight, measuredHeights])
  
  return (
    <div
      ref={scrollElementRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.startIndex + relativeIndex
            const key = getItemKey(item, absoluteIndex)
            
            return (
              <VirtualizedItem
                key={key}
                index={absoluteIndex}
                item={item}
                renderItem={renderItem}
                expectedHeight={estimatedItemHeight || itemHeight}
                onHeightMeasured={measureItem}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Individual virtualized item with height measurement
interface VirtualizedItemProps<T> {
  item: T
  index: number
  renderItem: (item: T, index: number) => React.ReactNode
  expectedHeight: number
  onHeightMeasured: (index: number, height: number) => void
}

function VirtualizedItem<T>({
  item,
  index,
  renderItem,
  expectedHeight,
  onHeightMeasured
}: VirtualizedItemProps<T>) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [hasMeasured, setHasMeasured] = useState(false)
  
  useEffect(() => {
    if (elementRef.current && !hasMeasured) {
      const height = elementRef.current.offsetHeight
      if (height !== expectedHeight) {
        onHeightMeasured(index, height)
      }
      setHasMeasured(true)
    }
  }, [index, expectedHeight, onHeightMeasured, hasMeasured])
  
  return (
    <div
      ref={elementRef}
      style={{ minHeight: expectedHeight }}
    >
      {renderItem(item, index)}
    </div>
  )
}

// Grid virtualization for dashboard widgets
interface VirtualizedGridProps<T> {
  items: T[]
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  gap?: number
  renderItem: (item: T, index: number) => React.ReactNode
  getItemKey?: (item: T, index: number) => string | number
}

export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  gap = 0,
  renderItem,
  getItemKey = (_, index) => index
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  // Calculate grid dimensions
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap))
  const totalRows = Math.ceil(items.length / columnsPerRow)
  const totalHeight = totalRows * (itemHeight + gap) - gap
  
  // Calculate visible range
  const visibleRowStart = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 1)
  const visibleRowEnd = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + 1
  )
  
  // Get visible items
  const visibleItems = useMemo(() => {
    const startIndex = visibleRowStart * columnsPerRow
    const endIndex = Math.min(items.length - 1, (visibleRowEnd + 1) * columnsPerRow - 1)
    return items.slice(startIndex, endIndex + 1).map((item, relativeIndex) => ({
      item,
      index: startIndex + relativeIndex
    }))
  }, [items, visibleRowStart, visibleRowEnd, columnsPerRow])
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
    setScrollLeft(e.currentTarget.scrollLeft)
  }, [])
  
  return (
    <div
      className="overflow-auto"
      style={{ width: containerWidth, height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          width: columnsPerRow * (itemWidth + gap) - gap,
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map(({ item, index }) => {
          const row = Math.floor(index / columnsPerRow)
          const col = index % columnsPerRow
          const x = col * (itemWidth + gap)
          const y = row * (itemHeight + gap)
          const key = getItemKey(item, index)
          
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: itemWidth,
                height: itemHeight
              }}
            >
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Infinite loading virtualized list
interface InfiniteVirtualizedListProps<T> extends Omit<VirtualizedListProps<T>, 'items'> {
  items: T[]
  hasMore: boolean
  loadMore: () => Promise<void>
  loading: boolean
  threshold?: number
}

export function InfiniteVirtualizedList<T>({
  items,
  hasMore,
  loadMore,
  loading,
  threshold = 5,
  ...listProps
}: InfiniteVirtualizedListProps<T>) {
  const loadingRef = useRef(false)
  
  const handleScroll = useCallback(async (scrollTop: number) => {
    listProps.onScroll?.(scrollTop)
    
    // Check if we need to load more
    const scrolledToBottom = scrollTop + listProps.containerHeight >= 
      (items.length * listProps.itemHeight) - (threshold * listProps.itemHeight)
    
    if (scrolledToBottom && hasMore && !loading && !loadingRef.current) {
      loadingRef.current = true
      try {
        await loadMore()
      } finally {
        loadingRef.current = false
      }
    }
  }, [items.length, listProps.itemHeight, listProps.containerHeight, hasMore, loading, loadMore, threshold, listProps.onScroll])
  
  return (
    <VirtualizedList
      {...listProps}
      items={items}
      onScroll={handleScroll}
    />
  )
}