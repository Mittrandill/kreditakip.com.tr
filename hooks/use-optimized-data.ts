"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getAllPayments } from "@/lib/api/payments"
import { getCreditCards, getCreditCardSummary } from "@/lib/api/credit-cards"
import { cachedLoader, debounce, memoize, perfMonitor, reportCache } from "@/lib/performance"
import type { Credit, PaymentPlan, CreditCard } from "@/lib/types"

interface PopulatedCredit extends Credit {
  banks: { id: string; name: string; logo_url: string | null } | null
  credit_types: { id: string; name: string } | null
}

interface PopulatedPayment extends PaymentPlan {
  credits: {
    id: string
    credit_code: string
    user_id: string
    banks: {
      name: string
      logo_url: string | null
    } | null
  } | null
}

interface OptimizedDataState {
  credits: PopulatedCredit[]
  payments: PopulatedPayment[]
  creditCards: CreditCard[]
  creditCardSummary: any
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Memoized data processors
const processCreditsData = memoize((credits: PopulatedCredit[]) => {
  const stopTiming = perfMonitor.startTiming('processCreditsData')
  
  const activeCredits = credits.filter(c => c.status === "active")
  const totalActiveDebt = activeCredits.reduce((sum, c) => sum + c.remaining_debt, 0)
  const bankDistribution = activeCredits.reduce((acc, credit) => {
    const bankName = credit.banks?.name || "Diğer"
    acc[bankName] = (acc[bankName] || 0) + credit.remaining_debt
    return acc
  }, {} as Record<string, number>)
  
  stopTiming()
  
  return {
    activeCredits,
    totalActiveDebt,
    bankDistribution
  }
})

const processPaymentsData = memoize((payments: PopulatedPayment[]) => {
  const stopTiming = perfMonitor.startTiming('processPaymentsData')
  
  const paidPayments = payments.filter(p => p.status === 'paid' && p.payment_date)
  const overduePayments = payments.filter(p => 
    new Date(p.due_date) < new Date() && p.status === 'pending'
  )
  
  // Monthly trend data
  const monthlyData = paidPayments.reduce((acc, payment) => {
    const monthKey = new Date(payment.payment_date!).toISOString().slice(0, 7)
    const existing = acc.find(item => item.date === monthKey)
    if (existing) {
      existing.value += payment.total_payment
    } else {
      acc.push({ date: monthKey, value: payment.total_payment })
    }
    return acc
  }, [] as { date: string; value: number }[])
  
  // Sort and take last 12 months
  const sortedMonthlyData = monthlyData
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
  
  stopTiming()
  
  return {
    paidPayments,
    overduePayments,
    monthlyTrendData: sortedMonthlyData,
    totalOverdueAmount: overduePayments.reduce((sum, p) => sum + p.total_payment, 0)
  }
})

const processCreditCardsData = memoize((cards: CreditCard[], summary: any) => {
  const stopTiming = perfMonitor.startTiming('processCreditCardsData')
  
  const highUtilizationCards = cards.filter(card => card.utilization_rate > 80)
  const totalCardDebt = cards.reduce((sum, card) => sum + card.current_debt, 0)
  
  stopTiming()
  
  return {
    highUtilizationCards,
    totalCardDebt,
    averageUtilization: summary.averageUtilizationRate || 0
  }
})

export function useOptimizedData() {
  const { user } = useAuth()
  const [state, setState] = useState<OptimizedDataState>({
    credits: [],
    payments: [],
    creditCards: [],
    creditCardSummary: {},
    loading: false,
    error: null,
    lastUpdated: null
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Debounced refresh function
  const debouncedRefresh = useCallback(
    debounce(async (userId: string, force = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal
      
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const cacheKeys = {
          credits: `credits-${userId}`,
          payments: `payments-${userId}`,
          creditCards: `creditCards-${userId}`,
          summary: `creditCardSummary-${userId}`
        }
        
        // Clear cache if forced refresh
        if (force) {
          Object.values(cacheKeys).forEach(key => reportCache.delete(key))
        }
        
        const stopTiming = perfMonitor.startTiming('dataFetch')
        
        // Load data with caching
        const [credits, payments, creditCards, creditCardSummary] = await Promise.all([
          cachedLoader(cacheKeys.credits, () => getCredits(userId) as Promise<PopulatedCredit[]>),
          cachedLoader(cacheKeys.payments, () => getAllPayments(userId, 12, 12) as Promise<PopulatedPayment[]>),
          cachedLoader(cacheKeys.creditCards, () => getCreditCards(userId)),
          cachedLoader(cacheKeys.summary, () => getCreditCardSummary(userId))
        ])
        
        stopTiming()
        
        if (signal.aborted) return
        
        setState({
          credits: credits || [],
          payments: payments || [],
          creditCards: creditCards || [],
          creditCardSummary: creditCardSummary || {},
          loading: false,
          error: null,
          lastUpdated: new Date()
        })
      } catch (error: any) {
        if (signal.aborted) return
        
        console.error("Optimized data fetch error:", error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || "Veri yükleme hatası"
        }))
      }
    }, 300),
    []
  )
  
  // Initial data load
  useEffect(() => {
    if (user?.id) {
      debouncedRefresh(user.id)
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [user?.id, debouncedRefresh])
  
  // Processed data with memoization
  const processedData = useMemo(() => {
    const stopTiming = perfMonitor.startTiming('processAllData')
    
    const creditsData = processCreditsData(state.credits)
    const paymentsData = processPaymentsData(state.payments)
    const cardsData = processCreditCardsData(state.creditCards, state.creditCardSummary)
    
    stopTiming()
    
    return {
      ...creditsData,
      ...paymentsData,
      ...cardsData,
      totalDebt: creditsData.totalActiveDebt + cardsData.totalCardDebt
    }
  }, [state.credits, state.payments, state.creditCards, state.creditCardSummary])
  
  // Manual refresh function
  const refresh = useCallback((force = false) => {
    if (user?.id) {
      debouncedRefresh(user.id, force)
    }
  }, [user?.id, debouncedRefresh])
  
  // Prefetch related data
  const prefetchData = useCallback(async (dataType: 'credits' | 'payments' | 'cards') => {
    if (!user?.id) return
    
    const cacheKey = `${dataType}-${user.id}`
    if (reportCache.has(cacheKey)) return // Already cached
    
    try {
      switch (dataType) {
        case 'credits':
          await cachedLoader(cacheKey, () => getCredits(user.id) as Promise<PopulatedCredit[]>)
          break
        case 'payments':
          await cachedLoader(cacheKey, () => getAllPayments(user.id, 12, 12) as Promise<PopulatedPayment[]>)
          break
        case 'cards':
          await Promise.all([
            cachedLoader(`creditCards-${user.id}`, () => getCreditCards(user.id)),
            cachedLoader(`creditCardSummary-${user.id}`, () => getCreditCardSummary(user.id))
          ])
          break
      }
    } catch (error) {
      console.warn('Prefetch failed:', error)
    }
  }, [user?.id])
  
  return {
    ...state,
    processedData,
    refresh,
    prefetchData,
    isStale: state.lastUpdated ? Date.now() - state.lastUpdated.getTime() > 5 * 60 * 1000 : true, // 5 minutes
    performanceStats: perfMonitor.getAllStats()
  }
}

// Hook for filtered data with optimization
export function useFilteredData(filters: any, data: OptimizedDataState['credits'] | OptimizedDataState['payments']) {
  return useMemo(() => {
    const stopTiming = perfMonitor.startTiming('filterData')
    
    let filtered = data
    
    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filtered = filtered.filter((item: any) => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm)
        )
      )
    }
    
    // Apply date range filter
    if (filters.dateRange?.from || filters.dateRange?.to) {
      filtered = filtered.filter((item: any) => {
        const itemDate = new Date(item.created_at || item.due_date || item.payment_date)
        const from = filters.dateRange.from
        const to = filters.dateRange.to
        
        if (from && itemDate < from) return false
        if (to && itemDate > to) return false
        return true
      })
    }
    
    // Apply other filters
    if (filters.banks?.length > 0) {
      filtered = filtered.filter((item: any) => 
        filters.banks.includes(item.banks?.name || item.credits?.banks?.name)
      )
    }
    
    if (filters.statuses?.length > 0) {
      filtered = filtered.filter((item: any) => 
        filters.statuses.includes(item.status)
      )
    }
    
    stopTiming()
    
    return filtered
  }, [data, filters])
}

// Hook for background data synchronization
export function useDataSync() {
  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (!user?.id) return
    
    // Sync every 30 minutes
    intervalRef.current = setInterval(() => {
      // Clear old cache entries
      reportCache.clear()
      
      // The useOptimizedData hook will automatically refetch on next render
    }, 30 * 60 * 1000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [user?.id])
  
  const forcSync = useCallback(() => {
    reportCache.clear()
  }, [])
  
  return { forcSync }
}