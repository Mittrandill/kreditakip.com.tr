"use client"

import { useEffect, useState } from "react"
import { useAuth } from "./use-auth"

export interface SubscriptionStatus {
  planType: "free" | "premium"
  status: "active" | "cancelled" | "expired"
  expiresAt?: string
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

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        console.log("[v0] No user, skipping subscription fetch")
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching subscription status for user:", user.id)
        const response = await fetch(`/api/subscription/status?userId=${user.id}`)
        console.log("[v0] Subscription API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Subscription data received:", data)

          const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")

          const subscriptionStatus = {
            planType: data.subscription?.plan_type || "free",
            status: data.subscription?.status || "active",
            expiresAt: data.subscription?.expires_at,
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

          console.log("[v0] Processed subscription status:", subscriptionStatus)
          console.log("[v0] Is Premium:", subscriptionStatus.planType === "premium")
          setSubscription(subscriptionStatus)
        } else {
          console.error("[v0] Subscription API error:", response.status, response.statusText)
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

  console.log("[v0] useSubscription state:", { isPremium, canUseOCR, canUseRiskAnalysis, loading })

  return {
    subscription,
    loading,
    isPremium,
    canUseOCR,
    canUseRiskAnalysis,
    refresh: async () => {
      console.log("[v0] Refreshing subscription status...")
      setLoading(true)
      try {
        const response = await fetch(`/api/subscription/status?userId=${user?.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Refreshed subscription data:", data)

          const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")

          const subscriptionStatus = {
            planType: data.subscription?.plan_type || "free",
            status: data.subscription?.status || "active",
            expiresAt: data.subscription?.expires_at,
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

          console.log("[v0] Refreshed subscription status:", subscriptionStatus)
          setSubscription(subscriptionStatus)
        }
      } catch (error) {
        console.error("[v0] Subscription refresh error:", error)
      } finally {
        setLoading(false)
      }
    },
  }
}
