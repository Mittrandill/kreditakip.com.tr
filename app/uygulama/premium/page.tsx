"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Crown, Check, Sparkles, TrendingUp, X, Shield, BarChart3, Zap, AlertCircle } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { fetchPlans, FALLBACK_PLANS, calculateSavings, type SubscriptionPlan } from "@/lib/subscription-plans"

export default function PremiumPage() {
  const { subscription, loading, isPremium } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isYearly, setIsYearly] = useState(true) // Varsayılan olarak yıllık seçili (indirim için)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [targetPlanId, setTargetPlanId] = useState<string>("")
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS)
  const [plansLoading, setPlansLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const hasProcessedParams = useRef(false)

  // Fetch plans from API
  useEffect(() => {
    async function loadPlans() {
      try {
        const fetchedPlans = await fetchPlans()
        setPlans(fetchedPlans)
      } catch (error) {
        console.error("Error loading plans:", error)
        // Fallback plans already set in initial state
      } finally {
        setPlansLoading(false)
      }
    }
    loadPlans()
  }, [])

  // Kullanıcının mevcut planına göre toggle'ı ayarla
  useEffect(() => {
    if (isPremium && subscription?.plan_id) {
      setIsYearly(subscription.plan_id === "premium-yearly")
    }
  }, [isPremium, subscription?.plan_id])

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

    // Eğer mevcut planla aynı plana tıklandıysa, hiçbir şey yapma
    if (isPremium && subscription?.plan_id === planId) {
      return
    }

    // Eğer zaten premium ise ve farklı bir plana geçmek istiyorsa
    if (isPremium && subscription?.plan_id !== planId) {
      setTargetPlanId(planId)
      setShowConfirmDialog(true)
    } else {
      // Yeni premium kullanıcı
      router.push(`/uygulama/odeme?plan=${planId}`)
    }
  }

  const confirmPlanChange = () => {
    setShowConfirmDialog(false)
    router.push(`/uygulama/odeme?plan=${targetPlanId}&upgrade=true`)
  }

  // Seçili planı al
  const selectedPlan = plans.find((p) => p.period === (isYearly ? "yearly" : "monthly"))
  const monthlyPlan = plans.find((p) => p.period === "monthly")
  const yearlyPlan = plans.find((p) => p.period === "yearly")

  if (loading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-white/60">Yükleniyor...</p>
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
            {isPremium
              ? "Premium üyeliğiniz aktif! İstediğiniz zaman planınızı değiştirebilirsiniz."
              : "Tüm özelliklere sınırsız erişim, reklamsız deneyim ve gelişmiş analiz araçları"}
          </p>
          {isPremium && subscription && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-6 py-3 text-lg shadow-lg">
                <Check className="h-5 w-5 mr-2" />
                {subscription.plan_id === "premium-yearly" ? "Yıllık Premium" : "Aylık Premium"}
              </Badge>
              {subscription.expiresAt && (
                <Badge className="bg-white/15 text-white/90 border-white/20 backdrop-blur-sm px-6 py-3 text-base">
                  <Crown className="h-4 w-4 mr-2" />
                  {new Date(subscription.expiresAt).toLocaleDateString("tr-TR")} tarihine kadar geçerli
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 dark:border-white/10 hover:shadow-lg transition-shadow flex flex-col">
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
                  0₺<span className="text-lg font-normal text-gray-600 dark:text-white/60">/ay</span>
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
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
                  <span className="text-sm text-gray-500 dark:text-white/60">Risk analizi yok</span>
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
                  <span className="text-sm text-gray-500 dark:text-white/60">Reklamlar gösterilir</span>
                </div>
              </div>
              {!isPremium && (
                <Button variant="outline" className="w-full bg-transparent mt-auto" disabled>
                  Mevcut Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan with Toggle */}
          <Card className="relative border-2 border-emerald-500 dark:border-emerald-600 shadow-2xl hover:shadow-xl transition-all flex flex-col">
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
              <div className="flex items-center justify-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
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
                  <p className="text-xl text-gray-500 dark:text-white/60 line-through text-center">
                    {yearlyPlan.originalPrice}₺/yıllık
                  </p>
                )}
                <p className="text-5xl font-bold text-center">
                  {selectedPlan?.price}₺
                  <span className="text-lg font-normal text-gray-600 dark:text-white/60">
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
                  <p className="text-sm text-gray-600 dark:text-white/60 text-center mt-2">
                    Yıllık plan ile %17 indirim kazanın
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {selectedPlan?.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              {isPremium && subscription?.plan_id === (isYearly ? "premium-yearly" : "premium-monthly") ? (
                <Button
                  className="w-full bg-gray-400 dark:bg-emerald-900/40 cursor-not-allowed shadow-lg mt-auto opacity-60"
                  disabled
                  size="lg"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Mevcut Planınız
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all mt-auto"
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
                      {isPremium ? `Plana Geç (${selectedPlan?.price}₺)` : `Premium Al (${selectedPlan?.price}₺)`}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative pb-6">
            <div className="p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm mb-3">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-white text-xl mb-2">Sınırsız Analiz</CardTitle>
            <CardDescription className="text-white/90 text-base leading-relaxed">
              OCR teknolojisi ile sınırsız kredi dökümü analizi yapın
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative pb-6">
            <div className="p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm mb-3">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-white text-xl mb-2">Risk Analizi</CardTitle>
            <CardDescription className="text-white/90 text-base leading-relaxed">
              Finansal durumunuzu detaylı analiz edin ve öneriler alın
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative pb-6">
            <div className="p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm mb-3">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-white text-xl mb-2">Reklamsız</CardTitle>
            <CardDescription className="text-white/90 text-base leading-relaxed">Kesintisiz, reklamsız bir deneyim yaşayın</CardDescription>
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

      {/* Plan Change Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-xl">Plan Değişikliği Onayı</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              {subscription?.plan_id === "premium-yearly"
                ? "Yıllık planınızdan aylık plana geçmek istediğinize emin misiniz?"
                : "Aylık planınızdan yıllık plana geçmek istediğinize emin misiniz?"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-black/10 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Mevcut Plan:</p>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-700 dark:text-white/70">
                    {subscription?.plan_id === "premium-yearly" ? "Yıllık Premium" : "Aylık Premium"}
                  </span>
                  <Badge variant="outline">
                    {subscription?.plan_id === "premium-yearly" ? "1,990₺/yıl" : "199₺/ay"}
                  </Badge>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">Yeni Plan:</p>
                <div className="flex items-center justify-between">
                  <span className="text-base text-emerald-700 dark:text-emerald-300">
                    {targetPlanId === "premium-yearly" ? "Yıllık Premium" : "Aylık Premium"}
                  </span>
                  <Badge className="bg-emerald-600 dark:bg-emerald-500">
                    {targetPlanId === "premium-yearly" ? "1,990₺/yıl" : "199₺/ay"}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 mt-4">
              Plan değişikliği hemen gerçekleşecek ve yeni ödeme döngüsü başlayacaktır.
            </p>
          </div>
          <DialogFooter className="sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-300 dark:border-white/10"
            >
              İptal
            </Button>
            <Button
              onClick={confirmPlanChange}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 text-white"
            >
              Planı Değiştir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
