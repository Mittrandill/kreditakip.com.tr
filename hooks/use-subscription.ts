"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@/components/auth-provider"

export interface SubscriptionStatus {
  planType: "free" | "premium"
  plan_id?: string // 'premium-monthly' | 'premium-yearly' | null
  status: "active" | "cancelled" | "expired"
  expiresAt?: string
  startDate?: string
  usage: {
    ocrAnalysis: {
      used: number
      saved: number // OCR ile kaydedilen kredi sayısı
      limit: number
    }
    riskAnalysis: {
      used: number
      limit: number
    }
  }
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to get user-specific cache key
const getCacheKey = (userId: string) => `subscription_cache_${userId}`

export function useSubscription() {
  const { user } = useAuthContext()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Reset subscription when user changes
  useEffect(() => {
    const newUserId = user?.id || null
    if (newUserId !== currentUserId) {
      setSubscription(null)
      setLoading(true)
      setCurrentUserId(newUserId)
    }
  }, [user?.id, currentUserId])

  useEffect(() => {
    async function fetchSubscription() {
      if (!user?.id) {
        setSubscription(null)
        setLoading(false)

        // Clear localStorage cache
        if (typeof window !== "undefined") {
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith("subscription_cache_")) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key))
        }
        return
      }

      try {
        const response = await fetch(`/api/subscription/status`)

        if (response.ok) {
          const data = await response.json()

          const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")

          const isPremiumUser = data.subscription?.plan_type === "premium"

          const subscriptionStatus = {
            planType: data.subscription?.plan_type || "free",
            plan_id: data.subscription?.plan_id || null,
            status: data.subscription?.status || "active",
            expiresAt: data.subscription?.expires_at,
            startDate: data.subscription?.start_date,
            usage: {
              ocrAnalysis: {
                used: ocrUsage?.used_count || 0,
                saved: ocrUsage?.saved_credits_count || 0, // Kaydedilen kredi sayısı
                limit: ocrUsage?.limit_count || (isPremiumUser ? 999999 : 1),
              },
              riskAnalysis: {
                used: riskUsage?.used_count || 0,
                limit: riskUsage?.limit_count || (isPremiumUser ? 999999 : 0),
              },
            },
          }

          setSubscription(subscriptionStatus)

          // Save to user-specific cache
          if (typeof window !== "undefined") {
            const cacheKey = getCacheKey(user.id)
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: subscriptionStatus,
                timestamp: Date.now(),
              }),
            )
          }
        }
      } catch (error) {
        // Silent error handling in production
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user?.id])

  // Premium check: active OR (cancelled but not expired yet)
  const isPremium =
    subscription?.planType === "premium" &&
    (subscription?.status === "active" ||
      (subscription?.status === "cancelled" && subscription?.expiresAt && new Date(subscription.expiresAt) > new Date()))

  // OCR: Analiz sınırsız, kaydetme sınırlı (saved count kontrolü)
  const canUseOCR =
    isPremium || (subscription?.usage.ocrAnalysis.saved || 0) < (subscription?.usage.ocrAnalysis.limit || 1)
  const canUseRiskAnalysis = isPremium

  return {
    subscription,
    loading,
    isPremium,
    canUseOCR,
    canUseRiskAnalysis,
    refresh: async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        const response = await fetch(`/api/subscription/status`)
        if (response.ok) {
          const data = await response.json()

          const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")

          const isPremiumUser = data.subscription?.plan_type === "premium"

          const subscriptionStatus = {
            planType: data.subscription?.plan_type || "free",
            plan_id: data.subscription?.plan_id || null,
            status: data.subscription?.status || "active",
            expiresAt: data.subscription?.expires_at,
            startDate: data.subscription?.start_date,
            usage: {
              ocrAnalysis: {
                used: ocrUsage?.used_count || 0,
                saved: ocrUsage?.saved_credits_count || 0, // Kaydedilen kredi sayısı
                limit: ocrUsage?.limit_count || (isPremiumUser ? 999999 : 1),
              },
              riskAnalysis: {
                used: riskUsage?.used_count || 0,
                limit: riskUsage?.limit_count || (isPremiumUser ? 999999 : 0),
              },
            },
          }

          setSubscription(subscriptionStatus)

          // Save to user-specific cache
          if (typeof window !== "undefined") {
            const cacheKey = getCacheKey(user.id)
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: subscriptionStatus,
                timestamp: Date.now(),
              }),
            )
          }
        }
      } catch (error) {
        // Silent error handling in production
      } finally {
        setLoading(false)
      }
    },
  }
}
