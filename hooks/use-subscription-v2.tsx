"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./use-auth"

export interface Usage {
  ocrAnalysis: {
    limit: number
    used: number
    savedCredits: number
    savedCreditsLimit: number
    resetAt: string | null
    canUse: boolean
  }
  riskAnalysis: {
    limit: number
    used: number
    savedCredits: number
    resetAt: string | null
    canUse: boolean
  }
}

export interface Subscription {
  id: string
  planId: string
  planType: "free" | "pro" | "premium"
  status: "active" | "trialing" | "canceled" | "expired" | "past_due" | "paused" | "grace_period" | "suspended"
  startDate: string
  expiresAt: string
  canceledAt?: string
  gracePeriodStartedAt?: string
  gracePeriodEndsAt?: string
  requiresPaymentAction: boolean
  // paddleSubscriptionId?: string // REMOVED: Paddle integration removed
  paymentProvider?: "paytr" // Only PayTR supported now
  // cancelUrl?: string // REMOVED: Paddle-specific
  // updateUrl?: string // REMOVED: Paddle-specific
  usage?: Usage
}

export function useSubscriptionV2() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription data
  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use API endpoint instead of direct Supabase view query
      // This is more reliable as it handles the view internally
      const response = await fetch('/api/subscription/status')

      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const apiData = await response.json()
      const subData = apiData?.subscription

      if (subData) {
        // Derive planType from plan_id if plan_type is not available
        const derivedPlanType: "free" | "pro" | "premium" =
          subData.plan_type ||
          (subData.plan_id && subData.plan_id.includes("pro") ? "pro" :
           subData.plan_id && subData.plan_id.includes("premium") ? "premium" : "free")

        // Map API data to subscription interface
        const mappedSubscription: Subscription = {
          id: subData.id,
          planId: subData.plan_id,
          planType: derivedPlanType,
          status: subData.status,
          startDate: subData.start_date,
          expiresAt: subData.expires_at,
          canceledAt: subData.canceled_at,
          gracePeriodStartedAt: subData.grace_period_started_at,
          gracePeriodEndsAt: subData.grace_period_ends_at,
          requiresPaymentAction: subData.requires_payment_action || false,
          // paddleSubscriptionId: subData.paddle_subscription_id, // REMOVED: Paddle integration removed
          paymentProvider: subData.payment_provider || "paytr",
          usage: apiData?.usage ? {
            ocrAnalysis: (() => {
              const ocr = apiData.usage.find((u: any) => u.feature_type === 'ocr_analysis')
              return {
                limit: ocr?.limit_count ?? 1,
                used: ocr?.usage_count ?? 0,
                savedCredits: ocr?.saved_credits_count ?? 0,
                savedCreditsLimit: ocr?.saved_credits_limit ?? 1,
                resetAt: ocr?.reset_at ?? null,
                canUse: ocr?.limit_count === -1 || (ocr?.usage_count ?? 0) < (ocr?.limit_count ?? 1)
              }
            })(),
            riskAnalysis: (() => {
              const risk = apiData.usage.find((u: any) => u.feature_type === 'risk_analysis')
              return {
                limit: risk?.limit_count ?? 0,
                used: risk?.usage_count ?? 0,
                savedCredits: risk?.saved_credits_count ?? 0,
                resetAt: risk?.reset_at ?? null,
                canUse: risk?.limit_count === -1 || (risk?.usage_count ?? 0) < (risk?.limit_count ?? 0)
              }
            })(),
          } : undefined,
        }

        // REMOVED: Paddle management URLs functionality
        // PayTR subscriptions are managed through the payment page

        setSubscription(mappedSubscription)
      } else {
        // No subscription - return free plan
        setSubscription({
          id: "free",
          planId: "free",
          planType: "free",
          status: "active",
          startDate: new Date().toISOString(),
          expiresAt: "2099-12-31",
          requiresPaymentAction: false,
          usage: {
            ocrAnalysis: { limit: 1, used: 0, savedCredits: 0, savedCreditsLimit: 1, resetAt: null, canUse: true },
            riskAnalysis: { limit: 0, used: 0, savedCredits: 0, resetAt: null, canUse: false },
          },
        })
      }
    } catch (err: any) {
      console.error("Error fetching subscription:", err)
      setError(err.message || "Failed to load subscription")
    } finally {
      setLoading(false)
    }
  }, [user])

  // Track usage
  const trackUsage = useCallback(async (featureType: "ocr_analysis" | "risk_analysis", saveCredit = false) => {
    if (!user) {
      toast({
        title: "Oturum Gerekli",
        description: "Bu özelliği kullanmak için lütfen oturum açın.",
        variant: "destructive",
      })
      return false
    }

    try {
      const response = await fetch("/api/subscription/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          featureType,
          saveCredit,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.error === "Usage limit exceeded") {
          toast({
            title: "Limit Aşıldı",
            description: "Bu özelliği kullanmak için premium plana yükseltin.",
            variant: "destructive",
            action: (
              <button
                onClick={() => router.push("/uygulama/premium")}
                className="bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700"
              >
                Yükselt
              </button>
            ),
          })
          return false
        }
        throw new Error(data.error || "Failed to track usage")
      }

      // Refresh subscription to update usage counts
      await refresh()

      return true
    } catch (err: any) {
      console.error("Error tracking usage:", err)
      toast({
        title: "Hata",
        description: err.message || "İşlem başarısız oldu",
        variant: "destructive",
      })
      return false
    }
  }, [user, toast, router, refresh])

  // Create checkout session
  const createCheckout = useCallback(async (planId: string) => {
    if (!user) {
      toast({
        title: "Oturum Gerekli",
        description: "Abonelik için lütfen oturum açın.",
        variant: "destructive",
      })
      return null
    }

    try {
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.user_metadata?.name || "",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create checkout")
      }

      // Redirect to checkout
      window.location.href = data.checkoutUrl
      return data.checkoutUrl
    } catch (err: any) {
      console.error("Error creating checkout:", err)
      toast({
        title: "Hata",
        description: err.message || "Ödeme sayfası oluşturulamadı",
        variant: "destructive",
      })
      return null
    }
  }, [user, toast])

  // REMOVED: Cancel subscription - PayTR subscriptions don't support cancel API
  // Users need to contact support or stop renewing
  const cancelSubscription = useCallback(async () => {
    toast({
      title: "PayTR Abonelikleri",
      description: "PayTR aboneliklerini iptal etmek için lütfen destek ile iletişime geçin.",
      variant: "default",
    })
    return false
  }, [toast])

  // REMOVED: Pause subscription - PayTR doesn't support pause/resume
  const pauseSubscription = useCallback(async (resumeDate?: string) => {
    toast({
      title: "Özellik Desteklenmiyor",
      description: "PayTR abonelikleri duraklatma özelliğini desteklemiyor.",
      variant: "default",
    })
    return false
  }, [toast])

  // REMOVED: Resume subscription - PayTR doesn't support pause/resume
  const resumeSubscription = useCallback(async () => {
    toast({
      title: "Özellik Desteklenmiyor",
      description: "PayTR abonelikleri devam ettirme özelliğini desteklemiyor.",
      variant: "default",
    })
    return false
  }, [toast])

  // Computed properties
  const hasPremiumPlan =
    subscription?.planType === "premium" ||
    subscription?.planType === "pro" ||
    subscription?.planId?.includes("premium") ||
    subscription?.planId?.includes("pro") ||
    false

  const isActive = subscription?.status === "active" || subscription?.status === "trialing" || false
  const isInGracePeriod = subscription?.status === "grace_period" || false

  // isPremium: Has premium/pro plan AND subscription is active/trialing/grace_period
  const isPremium = hasPremiumPlan && (isActive || isInGracePeriod)

  const requiresPayment = subscription?.requiresPaymentAction || false
  const canUseOCR = subscription?.usage?.ocrAnalysis?.canUse || false
  const canUseRiskAnalysis = subscription?.usage?.riskAnalysis?.canUse || false

  // Get days until expiration
  const daysUntilExpiration = subscription?.expiresAt ?
    Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
    null

  // Get days until grace period ends
  const daysUntilGraceEnd = subscription?.gracePeriodEndsAt ?
    Math.ceil((new Date(subscription.gracePeriodEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
    null

  // Payment provider flags
  const isPayTRSubscription = subscription?.paymentProvider === "paytr"
  // const isPaddleSubscription = subscription?.paymentProvider === "paddle" // REMOVED: Paddle integration removed

  // Auto-refresh on mount and when user changes
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    subscription,
    loading,
    error,
    isPremium,
    isActive,
    isInGracePeriod,
    requiresPayment,
    canUseOCR,
    canUseRiskAnalysis,
    daysUntilExpiration,
    daysUntilGraceEnd,
    isPayTRSubscription,
    // isPaddleSubscription, // REMOVED: Paddle integration removed
    refresh,
    trackUsage,
    createCheckout,
    cancelSubscription, // Note: Now shows message for PayTR
    pauseSubscription, // Note: Now shows message for PayTR
    resumeSubscription, // Note: Now shows message for PayTR
  }
}