"use client"

import { useEffect, useState } from "react"
import { useAuth } from "./use-auth"

export interface SubscriptionStatus {
  planType: "free" | "premium"
  status: "active" | "cancelled" | "expired"
  expiresAt?: string
  startDate?: string
  usage: {
    ocrAnalysis: {
      used: number
      limit: number
    }
    riskAnalysis: {
      used: number
      limit: number
    }
  }
}

const CACHE_KEY = "subscription_cache"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data
          }
        } catch (e) {
          // Invalid cache, ignore
        }
      }
    }
    return null
  })
  const [loading, setLoading] = useState(!subscription) // Don't show loading if we have cached data

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/subscription/status?userId=${user.id}`)

        if (response.ok) {
          const data = await response.json()

          const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")

          const subscriptionStatus = {
            planType: data.subscription?.plan_type || "free",
            status: data.subscription?.status || "active",
            expiresAt: data.subscription?.expires_at,
            startDate: data.subscription?.start_date,
            usage: {
              ocrAnalysis: {
                used: ocrUsage?.used_count || 0,
                limit: ocrUsage?.limit_count || 1,
              },
              riskAnalysis: {
                used: riskUsage?.used_count || 0,
                limit: riskUsage?.limit_count || 0,
              },
            },
          }

          setSubscription(subscriptionStatus)

          if (typeof window !== "undefined") {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                data: subscriptionStatus,
                timestamp: Date.now(),
              }),
            )
          }
        }
      } catch (error) {
        console.error("[v0] Subscription fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const isPremium = subscription?.planType === "premium"
  const canUseOCR =
    isPremium || (subscription?.usage.ocrAnalysis.used || 0) < (subscription?.usage.ocrAnalysis.limit || 1)
  const canUseRiskAnalysis = isPremium

  return {
    subscription,
    loading,
    isPremium,
    canUseOCR,
    canUseRiskAnalysis,
    refresh: async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/subscription/status?userId=${user?.id}`)
        if (response.ok) {
          const data = await response.json()

          const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")

          const subscriptionStatus = {
            planType: data.subscription?.plan_type || "free",
            status: data.subscription?.status || "active",
            expiresAt: data.subscription?.expires_at,
            startDate: data.subscription?.start_date,
            usage: {
              ocrAnalysis: {
                used: ocrUsage?.used_count || 0,
                limit: ocrUsage?.limit_count || 1,
              },
              riskAnalysis: {
                used: riskUsage?.used_count || 0,
                limit: riskUsage?.limit_count || 0,
              },
            },
          }

          setSubscription(subscriptionStatus)

          if (typeof window !== "undefined") {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                data: subscriptionStatus,
                timestamp: Date.now(),
              }),
            )
          }
        }
      } catch (error) {
        console.error("[v0] Subscription refresh error:", error)
      } finally {
        setLoading(false)
      }
    },
  }
}
