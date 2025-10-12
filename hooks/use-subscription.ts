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
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/subscription/status")
        if (response.ok) {
          const data = await response.json()

          const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
          const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")

          setSubscription({
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
          })
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
      const response = await fetch("/api/subscription/status")
      if (response.ok) {
        const data = await response.json()
        const ocrUsage = data.usage?.find((u: any) => u.feature_type === "ocr_analysis")
        const riskUsage = data.usage?.find((u: any) => u.feature_type === "risk_analysis")
        setSubscription({
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
        })
      }
      setLoading(false)
    },
  }
}
