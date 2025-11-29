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
  planType: "free" | "premium"
  status: "active" | "trialing" | "canceled" | "expired" | "past_due" | "paused" | "grace_period" | "suspended"
  startDate: string
  expiresAt: string
  canceledAt?: string
  gracePeriodStartedAt?: string
  gracePeriodEndsAt?: string
  requiresPaymentAction: boolean
  paddleSubscriptionId?: string
  cancelUrl?: string
  updateUrl?: string
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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Get subscription data from the view
      const { data: subData, error: subError } = await supabase
        .from("subscription_status_view")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (subError && subError.code !== "PGRST116") {
        throw subError
      }

      if (subData) {
        // Map view data to subscription interface
        const mappedSubscription: Subscription = {
          id: subData.id,
          planId: subData.plan_id,
          planType: subData.plan_type || "free", // Use plan_type from database directly
          status: subData.effective_status || subData.status,
          startDate: subData.start_date,
          expiresAt: subData.expires_at,
          canceledAt: subData.canceled_at,
          gracePeriodStartedAt: subData.grace_period_started_at,
          gracePeriodEndsAt: subData.grace_period_ends_at,
          requiresPaymentAction: subData.requires_payment_action || false,
          paddleSubscriptionId: subData.paddle_subscription_id,
          usage: subData.usage ? {
            ocrAnalysis: subData.usage.ocrAnalysis || { limit: 0, used: 0, savedCredits: 0, resetAt: null, canUse: false },
            riskAnalysis: subData.usage.riskAnalysis || { limit: 0, used: 0, savedCredits: 0, resetAt: null, canUse: false },
          } : undefined,
        }

        // Get management URLs if subscription has Paddle ID
        if (subData.paddle_subscription_id) {
          try {
            const response = await fetch(`/api/subscription/manage?userId=${user.id}`)
            if (response.ok) {
              const data = await response.json()
              if (data.managementUrls) {
                mappedSubscription.cancelUrl = data.managementUrls.cancel
                mappedSubscription.updateUrl = data.managementUrls.update_payment
              }
            }
          } catch (err) {
            console.error("Failed to fetch management URLs:", err)
          }
        }

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
            ocrAnalysis: { limit: 1, used: 0, savedCredits: 0, resetAt: null, canUse: true },
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

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!user || !subscription?.paddleSubscriptionId) {
      toast({
        title: "Hata",
        description: "İptal edilecek abonelik bulunamadı",
        variant: "destructive",
      })
      return false
    }

    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: "cancel",
          subscriptionId: subscription.paddleSubscriptionId,
          options: {
            effectiveFrom: "next_billing_period",
          },
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel subscription")
      }

      toast({
        title: "Abonelik İptal Edildi",
        description: "Aboneliğiniz sonraki fatura döneminde iptal edilecektir.",
      })

      await refresh()
      return true
    } catch (err: any) {
      console.error("Error canceling subscription:", err)
      toast({
        title: "Hata",
        description: err.message || "Abonelik iptal edilemedi",
        variant: "destructive",
      })
      return false
    }
  }, [user, subscription, toast, refresh])

  // Pause subscription
  const pauseSubscription = useCallback(async (resumeDate?: string) => {
    if (!user || !subscription?.paddleSubscriptionId) {
      toast({
        title: "Hata",
        description: "Duraklatılacak abonelik bulunamadı",
        variant: "destructive",
      })
      return false
    }

    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: "pause",
          subscriptionId: subscription.paddleSubscriptionId,
          options: {
            mode: "fixed",
            resumeDate,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to pause subscription")
      }

      toast({
        title: "Abonelik Duraklatıldı",
        description: resumeDate ?
          `Aboneliğiniz ${new Date(resumeDate).toLocaleDateString("tr-TR")} tarihinde otomatik devam edecek.` :
          "Aboneliğiniz duraklatıldı.",
      })

      await refresh()
      return true
    } catch (err: any) {
      console.error("Error pausing subscription:", err)
      toast({
        title: "Hata",
        description: err.message || "Abonelik duraklatılamadı",
        variant: "destructive",
      })
      return false
    }
  }, [user, subscription, toast, refresh])

  // Resume subscription
  const resumeSubscription = useCallback(async () => {
    if (!user || !subscription?.paddleSubscriptionId) {
      toast({
        title: "Hata",
        description: "Devam ettirilecek abonelik bulunamadı",
        variant: "destructive",
      })
      return false
    }

    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: "resume",
          subscriptionId: subscription.paddleSubscriptionId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to resume subscription")
      }

      toast({
        title: "Abonelik Devam Etti",
        description: "Aboneliğiniz başarıyla devam ettirildi.",
      })

      await refresh()
      return true
    } catch (err: any) {
      console.error("Error resuming subscription:", err)
      toast({
        title: "Hata",
        description: err.message || "Abonelik devam ettirilemedi",
        variant: "destructive",
      })
      return false
    }
  }, [user, subscription, toast, refresh])

  // Computed properties
  const isPremium = subscription?.planType === "premium" || false
  const isActive = subscription?.status === "active" || subscription?.status === "trialing" || false
  const isInGracePeriod = subscription?.status === "grace_period" || false
  const requiresPayment = subscription?.requiresPaymentAction || false

  // Get days until expiration
  const daysUntilExpiration = subscription?.expiresAt ?
    Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
    null

  // Get days until grace period ends
  const daysUntilGraceEnd = subscription?.gracePeriodEndsAt ?
    Math.ceil((new Date(subscription.gracePeriodEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
    null

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
    daysUntilExpiration,
    daysUntilGraceEnd,
    refresh,
    trackUsage,
    createCheckout,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
  }
}