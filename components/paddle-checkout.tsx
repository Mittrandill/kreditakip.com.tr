"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Loader2, AlertCircle, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSubscriptionV2 } from "@/hooks/use-subscription-v2"
import { useAuth } from "@/hooks/use-auth"

interface PaddleCheckoutProps {
  planId: string
  planName: string
  planPrice: number
  planPeriod: "monthly" | "yearly"
  originalPrice?: number
  discount?: string
  features: string[]
  popular?: boolean
  className?: string
}

export function PaddleCheckout({
  planId,
  planName,
  planPrice,
  planPeriod,
  originalPrice,
  discount,
  features,
  popular = false,
  className,
}: PaddleCheckoutProps) {
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const { createCheckout } = useSubscriptionV2()
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Oturum Gerekli",
        description: "Abonelik için lütfen oturum açın.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingCheckout(true)
    try {
      await createCheckout(planId)
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ödeme sayfası oluşturulamadı",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCheckout(false)
    }
  }

  return (
    <Card className={`relative ${popular ? "border-emerald-500 shadow-lg" : ""} ${className}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 text-sm">
            <Star className="w-3 h-3 mr-1" />
            En Popüler
          </Badge>
        </div>
      )}
      <CardHeader className={popular ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20" : ""}>
        <CardTitle className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${popular ? "text-emerald-600" : "text-gray-600"}`} />
          {planName}
        </CardTitle>
        <CardDescription className="text-base">
          {planPeriod === "monthly" ? "Aylık" : "Yıllık"} plan
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Price Display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{planPrice}₺</span>
            <span className="text-gray-500">/{planPeriod === "monthly" ? "ay" : "yıl"}</span>
          </div>
          {originalPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg text-gray-400 line-through">{originalPrice}₺</span>
              {discount && (
                <Badge variant="secondary" className="text-green-600">
                  {discount}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscribe}
          disabled={isCreatingCheckout}
          className={`w-full ${
            popular
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              : ""
          }`}
          size="lg"
        >
          {isCreatingCheckout ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Yönlendiriliyor...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              {planId === "free" ? "Ücretsiz Başla" : "Aboneliği Başlat"}
            </>
          )}
        </Button>

        {/* Trust Indicators */}
        {planId !== "free" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              </div>
              <span>İstediğiniz zaman iptal edebilirsiniz</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              </div>
              <span>Güvenli ödeme ile Paddle</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              </div>
              <span>14 gün iade garantisi</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Paddle Price Display Component
interface PaddlePriceDisplayProps {
  planId: string
  showPeriod?: boolean
  className?: string
}

export function PaddlePriceDisplay({ planId, showPeriod = true, className }: PaddlePriceDisplayProps) {
  const [price, setPrice] = useState<{ amount: number; currency: string; period: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await fetch(`/api/subscription/plans`)
        if (response.ok) {
          const data = await response.json()
          const plan = data.plans?.find((p: any) => p.id === planId)
          if (plan) {
            setPrice({
              amount: plan.price,
              currency: plan.currency || "TRY",
              period: plan.billing_period,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching price:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [planId])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Yükleniyor...</span>
      </div>
    )
  }

  if (!price) {
    return (
      <div className={`flex items-center gap-2 text-red-500 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span>Fiyat bulunamadı</span>
      </div>
    )
  }

  return (
    <div className={`font-semibold ${className}`}>
      <span className="text-xl">{price.amount} {price.currency}</span>
      {showPeriod && (
        <span className="text-sm text-gray-500 ml-1">
          /{price.period === "monthly" ? "ay" : price.period === "yearly" ? "yıl" : price.period}
        </span>
      )}
    </div>
  )
}