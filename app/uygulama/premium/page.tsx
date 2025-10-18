"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Crown, Check, Sparkles, TrendingUp, X, Shield, BarChart3, Zap } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { SUBSCRIPTION_PLANS, calculateSavings } from "@/lib/subscription-plans"

export default function PremiumPage() {
  const { subscription, loading, isPremium } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isYearly, setIsYearly] = useState(true) // Varsayılan olarak yıllık seçili (indirim için)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const hasProcessedParams = useRef(false)

  useEffect(() => {
    if (hasProcessedParams.current) return

    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "true") {
      hasProcessedParams.current = true
      toast({
        title: "Ödeme Başarılı",
        description: "Premium üyeliğiniz aktif edildi. Tüm özelliklere erişebilirsiniz!",
      })
      router.replace("/uygulama/premium")
    } else if (error) {
      hasProcessedParams.current = true
      toast({
        title: "Ödeme Hatası",
        description: "Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
      router.replace("/uygulama/premium")
    }
  }, [searchParams, toast, router])

  const handleUpgrade = async () => {
    const planId = isYearly ? "premium-yearly" : "premium-monthly"
    router.push(`/uygulama/odeme?plan=${planId}`)
  }

  // Seçili planı al
  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.period === (isYearly ? "yearly" : "monthly"))
  const monthlyPlan = SUBSCRIPTION_PLANS.find((p) => p.period === "monthly")
  const yearlyPlan = SUBSCRIPTION_PLANS.find((p) => p.period === "yearly")

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 dark:from-emerald-600 dark:via-teal-700 dark:to-cyan-800 p-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="p-5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl">
              <Crown className="h-20 w-20 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold">Premium Üyelik</h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Tüm özelliklere sınırsız erişim, reklamsız deneyim ve gelişmiş analiz araçları
          </p>
          {isPremium && (
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-6 py-3 text-lg shadow-lg">
              <Check className="h-5 w-5 mr-2" />
              Aktif Premium Üye
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow h-fit">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Ücretsiz</CardTitle>
                <Badge variant="outline" className="text-xs">
                  Temel
                </Badge>
              </div>
              <CardDescription className="text-base">Temel özellikler ile başlayın</CardDescription>
              <div className="pt-4">
                <p className="text-5xl font-bold">
                  0₺<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ay</span>
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm">1 adet OCR analizi</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Risk analizi yok</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm">Temel kredi takibi</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm">Ödeme hatırlatıcıları</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
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

          {/* Premium Plan with Toggle */}
          <Card className="relative border-2 border-emerald-500 dark:border-emerald-600 shadow-2xl hover:shadow-xl transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 px-6 py-2 shadow-lg">
                <Sparkles className="h-4 w-4 mr-1" />
                En Popüler
              </Badge>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg -z-10"></div>

            <CardHeader className="relative space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Crown className="h-7 w-7 text-amber-500" />
                  <span>Premium</span>
                </CardTitle>
                {isYearly && yearlyPlan?.discount && (
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                    {yearlyPlan.discount}
                  </Badge>
                )}
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-center gap-3 p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}`}>
                  Aylık
                </span>
                <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-emerald-600" />
                <span className={`text-sm font-medium transition-colors ${isYearly ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}`}>
                  Yıllık
                  {yearlyPlan && (
                    <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">
                      (398₺ tasarruf)
                    </span>
                  )}
                </span>
              </div>

              <CardDescription className="text-base text-center">
                {isYearly ? "Yıllık öde, 2 ay bedava kazan!" : "Aylık ödeme ile premium özelliklere erişin"}
              </CardDescription>

              <div className="pt-4">
                {isYearly && yearlyPlan?.originalPrice && (
                  <p className="text-xl text-gray-500 dark:text-gray-400 line-through text-center">
                    {yearlyPlan.originalPrice}₺/yıllık
                  </p>
                )}
                <p className="text-5xl font-bold text-center">
                  {selectedPlan?.price}₺
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    /{isYearly ? "yıl" : "ay"}
                  </span>
                </p>
                {isYearly && yearlyPlan && monthlyPlan && (
                  <div className="mt-3 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 text-center flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4" />
                      {calculateSavings(yearlyPlan.price, monthlyPlan.price)}₺ tasarruf ediyorsunuz!
                    </p>
                  </div>
                )}
                {!isYearly && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                    Yıllık plan ile %17 indirim kazanın
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              <div className="space-y-4">
                {selectedPlan?.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              {isPremium ? (
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg" disabled size="lg">
                  <Check className="h-5 w-5 mr-2" />
                  Aktif Plan
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
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
                      Premium Al ({selectedPlan?.price}₺)
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative">
            <div className="p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-white text-xl">Sınırsız Analiz</CardTitle>
            <CardDescription className="text-white/80">
              OCR teknolojisi ile sınırsız kredi dökümü analizi yapın
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative">
            <div className="p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-white text-xl">Risk Analizi</CardTitle>
            <CardDescription className="text-white/80">
              Finansal durumunuzu detaylı analiz edin ve öneriler alın
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative">
            <div className="p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-white text-xl">Reklamsız</CardTitle>
            <CardDescription className="text-white/80">Kesintisiz, reklamsız bir deneyim yaşayın</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Current Usage */}
      {!isPremium && subscription && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 dark:from-amber-600 dark:via-orange-700 dark:to-red-700 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-white text-2xl">
              <TrendingUp className="h-6 w-6" />
              Mevcut Kullanım
            </CardTitle>
            <CardDescription className="text-white/90 text-base">Ücretsiz plan kullanım durumunuz</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-medium text-white">OCR Analizi</span>
                <span className="text-base font-bold text-white">
                  {subscription.usage.ocrAnalysis.used} / {subscription.usage.ocrAnalysis.limit}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-3 rounded-full transition-all shadow-lg"
                  style={{
                    width: `${(subscription.usage.ocrAnalysis.used / subscription.usage.ocrAnalysis.limit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-medium text-white">Risk Analizi</span>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium Özellik
                </Badge>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div className="bg-white/40 h-3 rounded-full w-0"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
