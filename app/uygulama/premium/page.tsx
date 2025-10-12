"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Sparkles, Zap, TrendingUp, X } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function PremiumPage() {
  const { subscription, loading, isPremium } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "true") {
      toast({
        title: "Ödeme Başarılı",
        description: "Premium üyeliğiniz aktif edildi. Tüm özelliklere erişebilirsiniz!",
      })
      router.replace("/uygulama/premium")
    } else if (error) {
      toast({
        title: "Ödeme Hatası",
        description: "Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
      router.replace("/uygulama/premium")
    }
  }, [searchParams, toast, router])

  const handleUpgrade = async () => {
    setIsProcessing(true)
    console.log("[v0] Starting payment initialization...")

    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
      })

      console.log("[v0] Payment API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Payment API error:", errorData)
        throw new Error(errorData.error || "Ödeme başlatılamadı")
      }

      const data = await response.json()
      console.log("[v0] Payment data received:", { hasToken: !!data.token, hasUrl: !!data.paymentPageUrl })

      if (data.paymentPageUrl) {
        console.log("[v0] Redirecting to payment page...")
        window.location.href = data.paymentPageUrl
      } else if (data.checkoutFormContent) {
        console.log("[v0] Rendering checkout form...")
        const checkoutDiv = document.createElement("div")
        checkoutDiv.innerHTML = data.checkoutFormContent
        document.body.appendChild(checkoutDiv)
      } else {
        throw new Error("Ödeme sayfası bilgisi alınamadı")
      }
    } catch (error) {
      console.error("[v0] Payment initialization error:", error)
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Ödeme işlemi başlatılamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800 p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="relative z-10 text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <Crown className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold">Premium Üyelik</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Tüm özelliklere sınırsız erişim, reklamsız deneyim ve gelişmiş analiz araçları
          </p>
          {isPremium && (
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-6 py-2 text-lg">
              <Check className="h-5 w-5 mr-2" />
              Aktif Premium Üye
            </Badge>
          )}
        </div>
      </div>

      {/* Pricing Card */}
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Ücretsiz</span>
              </CardTitle>
              <CardDescription>Temel özellikler</CardDescription>
              <div className="pt-4">
                <p className="text-4xl font-bold">
                  0₺<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ay</span>
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm">1 adet OCR analizi</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Risk analizi yok</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm">Temel kredi takibi</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm">Ödeme hatırlatıcıları</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Reklamlar gösterilir</span>
                </div>
              </div>
              {!isPremium && (
                <Button variant="outline" className="w-full bg-transparent" disabled>
                  Mevcut Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-emerald-600 dark:border-emerald-500 shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 px-4 py-1">
                <Sparkles className="h-4 w-4 mr-1" />
                Önerilen
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <span>Premium</span>
              </CardTitle>
              <CardDescription>Tüm özellikler</CardDescription>
              <div className="pt-4">
                <p className="text-4xl font-bold">
                  199₺<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ay</span>
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm font-medium">Sınırsız OCR analizi</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm font-medium">Detaylı risk analizi</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm font-medium">Gelişmiş raporlar</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm font-medium">Öncelikli destek</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm font-medium">Reklamsız deneyim</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span className="text-sm font-medium">Tüm gelecek özellikler</span>
                </div>
              </div>
              {isPremium ? (
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600" disabled>
                  <Check className="h-5 w-5 mr-2" />
                  Aktif Plan
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Premium'a Geç
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg w-fit">
              <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Sınırsız Analiz</CardTitle>
            <CardDescription>OCR teknolojisi ile sınırsız kredi dökümü analizi yapın</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Risk Analizi</CardTitle>
            <CardDescription>Finansal durumunuzu detaylı analiz edin ve öneriler alın</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>Reklamsız</CardTitle>
            <CardDescription>Kesintisiz, reklamsız bir deneyim yaşayın</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Current Usage */}
      {!isPremium && subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Mevcut Kullanım</CardTitle>
            <CardDescription>Ücretsiz plan kullanım durumunuz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">OCR Analizi</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {subscription.usage.ocrAnalysis.used} / {subscription.usage.ocrAnalysis.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(subscription.usage.ocrAnalysis.used / subscription.usage.ocrAnalysis.limit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Risk Analizi</span>
                <Badge variant="outline" className="text-xs">
                  Premium Özellik
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full w-0"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
