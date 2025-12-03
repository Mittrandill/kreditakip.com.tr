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
import { useSubscriptionV2 } from "@/hooks/use-subscription-v2"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { fetchPlans, calculateSavings, type SubscriptionPlan } from "@/lib/subscription-plans"
import { LoadingSpinner } from "@/components/loading-screen"

export default function PremiumPage() {
  const { subscription, loading, isPremium } = useSubscriptionV2()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [targetPlanId, setTargetPlanId] = useState<string>("")
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
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
      } finally {
        setPlansLoading(false)
      }
    }
    loadPlans()
  }, [])

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    // Eğer query param yoksa, hiçbir şey yapma
    if (!success && !error) {
      return
    }

    // Zaten işlendiyse, tekrar işleme
    if (hasProcessedParams.current) {
      return
    }

    if (success === "true") {
      hasProcessedParams.current = true
      toast({
        title: "Ödeme Başarılı",
        description: "Aboneliğiniz aktif edildi. Tüm özelliklere erişebilirsiniz!",
      })
      // Query params'ı temizle
      setTimeout(() => {
        router.replace("/uygulama/premium")
      }, 100)
    } else if (error) {
      hasProcessedParams.current = true
      toast({
        title: "Ödeme Hatası",
        description: "Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
      // Query params'ı temizle
      setTimeout(() => {
        router.replace("/uygulama/premium")
      }, 100)
    }
  }, [searchParams, toast, router])

  const handlePlanSelect = async (planId: string) => {
    const currentPlanId = subscription?.planId

    // Aynı plan kontrolü
    if (currentPlanId === planId) {
      return
    }

    // Free kullanıcı -> Ödeme sayfasına yönlendir
    if (!currentPlanId || currentPlanId === "free") {
      router.push(`/uygulama/odeme?plan=${planId}`)
      return
    }

    // Ücretli kullanıcı -> Plan değişikliği onayı iste
    setTargetPlanId(planId)
    setShowConfirmDialog(true)
  }

  const confirmPlanChange = async () => {
    setIsProcessing(true)
    setShowConfirmDialog(false)

    try {
      const response = await fetch("/api/subscription/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPlanId: targetPlanId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Plan Değişikliği Başarılı",
          description: data.message,
        })

        // Sayfayı yenile - query params olmadan
        router.replace("/uygulama/premium")
        router.refresh()
      } else {
        toast({
          title: "Hata",
          description: data.error || "Plan değiştirilemedi",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Plan change error:", error)
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Plan grupları oluştur
  const freePlan = plans.find((p) => p.id === "free")
  const proMonthly = plans.find((p) => p.id === "pro-monthly")
  const proYearly = plans.find((p) => p.id === "pro-yearly")
  const premiumMonthly = plans.find((p) => p.id === "premium-monthly")
  const premiumYearly = plans.find((p) => p.id === "premium-yearly")

  // Kullanıcının mevcut planı
  const currentPlanId = subscription?.planId || "free"
  const currentPlanType = currentPlanId.includes("premium") ? "premium" : currentPlanId.includes("pro") ? "pro" : "free"
  const isYearlyUser = currentPlanId.includes("yearly")

  // Global toggle state - varsayılan olarak kullanıcının mevcut tercihine göre ayarla
  const [isYearly, setIsYearly] = useState(isYearlyUser)

  if (loading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Plan kartı bileşeni
  const PlanCard = ({
    title,
    subtitle,
    price,
    originalPrice,
    period,
    features,
    planId,
    badge,
    isPopular,
    showToggle,
    isYearly,
    onToggleChange,
    monthlyPrice,
  }: {
    title: string
    subtitle: string
    price: number
    originalPrice?: number
    period: string
    features: string[]
    planId: string
    badge?: { text: string; variant: "default" | "outline" | "secondary" }
    isPopular?: boolean
    showToggle?: boolean
    isYearly?: boolean
    onToggleChange?: (checked: boolean) => void
    monthlyPrice?: number
  }) => {
    const isCurrent = currentPlanId === planId
    const isCurrentType = currentPlanType === title.toLowerCase()

    return (
      <Card
        className={`relative border-2 flex flex-col ${
          isPopular
            ? "border-emerald-500 dark:border-emerald-600 shadow-2xl hover:shadow-xl"
            : "border-gray-200 dark:border-white/10 hover:shadow-lg"
        } dark:bg-black/20 transition-all`}
      >
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 px-6 py-2 shadow-lg">
              <Sparkles className="h-4 w-4 mr-1" />
              En Popüler
            </Badge>
          </div>
        )}
        {isPopular && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg -z-10"></div>
        )}

        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl">
              {title === "Premium" && <Crown className="h-7 w-7 text-amber-500" />}
              {title === "Pro" && <Sparkles className="h-7 w-7 text-blue-500" />}
              <span>{title}</span>
            </CardTitle>
            {badge && (
              <Badge variant={badge.variant} className="text-xs">
                {badge.text}
              </Badge>
            )}
          </div>

          {/* Toggle Switch */}
          {showToggle && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/10">
              <span
                className={`text-xs sm:text-sm font-medium transition-colors ${!isYearly ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}`}
              >
                Aylık
              </span>
              <Switch checked={isYearly} onCheckedChange={onToggleChange} className="data-[state=checked]:bg-emerald-600" />
              <span
                className={`text-xs sm:text-sm font-medium transition-colors ${isYearly ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}`}
              >
                Yıllık
                {isYearly && monthlyPrice && (
                  <span className="ml-1 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ({calculateSavings(price, monthlyPrice)}₺ tasarruf)
                  </span>
                )}
              </span>
            </div>
          )}

          <CardDescription className="text-base text-center">{subtitle}</CardDescription>

          <div className="pt-4">
            {originalPrice && (
              <p className="text-lg sm:text-xl text-gray-500 dark:text-white/60 line-through text-center">{originalPrice}₺</p>
            )}
            <p className="text-4xl sm:text-5xl font-bold text-center">
              {price}₺<span className="text-base sm:text-lg font-normal text-gray-600 dark:text-white/60">/{period}</span>
            </p>
            {showToggle && isYearly && monthlyPrice && (
              <div className="mt-3 p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 text-center flex items-center justify-center gap-1 sm:gap-2">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{calculateSavings(price, monthlyPrice)}₺ tasarruf ediyorsunuz!</span>
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
          {isCurrent ? (
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
              onClick={() => handlePlanSelect(planId)}
              disabled={isProcessing || !planId}
              className={`w-full shadow-lg hover:shadow-xl transition-all mt-auto ${
                title === "Free"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              }`}
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
                  {currentPlanType === "free" ? `${title} Al (${price}₺)` : `${title} Planına Geç`}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-800 text-white border-0 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Crown className="h-8 w-8" />
                Abonelik Planları
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-4">
                Size uygun planı seçin ve finansal kontrolünüzü arttırın
              </p>

              {/* Plan Bilgileri */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Mevcut Plan</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {subscription && subscription.planId && subscription.planId !== "free"
                      ? subscription.planId === "premium-yearly"
                        ? "Yıllık Premium"
                        : subscription.planId === "premium-monthly"
                          ? "Aylık Premium"
                          : subscription.planId === "pro-yearly"
                            ? "Yıllık Pro"
                            : subscription.planId === "pro-monthly"
                              ? "Aylık Pro"
                              : "Aktif Plan"
                      : "Ücretsiz Plan"}
                  </p>
                </div>
                {subscription && subscription.expiresAt && subscription.planId !== "free" && (
                  <div>
                    <p className="text-white/70 text-xs sm:text-sm mb-1">Geçerlilik Tarihi</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {new Date(subscription.expiresAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                )}
              </div>
            </div>
  

            {/* Yearly/Monthly Switch - Right Side */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-white text-center">
                Yıllık Alın, %20 İndirimden Faydalanın!
              </p>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold transition-colors ${!isYearly ? "text-white" : "text-white/60"}`}>
                  Aylık
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="data-[state=checked]:bg-white/90"
                />
                <span className={`text-sm font-semibold transition-colors ${isYearly ? "text-white" : "text-white/60"}`}>
                  Yıllık
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans - Centered */}
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Pro Plan */}
          {proMonthly && proYearly && (
            <PlanCard
              title="Pro"
              subtitle={isYearly ? "Yıllık öde, %20 tasarruf et" : "Aylık ödeme ile profesyonel özelliklere erişin"}
              price={isYearly ? proYearly.price : proMonthly.price}
              originalPrice={isYearly ? proYearly.originalPrice : undefined}
              period={isYearly ? "yıl" : "ay"}
              features={isYearly ? proYearly.features : proMonthly.features}
              planId={isYearly ? "pro-yearly" : "pro-monthly"}
              showToggle={false}
              isYearly={isYearly}
              monthlyPrice={proMonthly.price}
            />
          )}

          {/* Premium Plan */}
          {premiumMonthly && premiumYearly && (
            <PlanCard
              title="Premium"
              subtitle={isYearly ? "Yıllık öde, %20 tasarruf et" : "Aylık ödeme ile sınırsız özelliklere erişin"}
              price={isYearly ? premiumYearly.price : premiumMonthly.price}
              originalPrice={isYearly ? premiumYearly.originalPrice : undefined}
              period={isYearly ? "yıl" : "ay"}
              features={isYearly ? premiumYearly.features : premiumMonthly.features}
              planId={isYearly ? "premium-yearly" : "premium-monthly"}
              isPopular
              showToggle={false}
              isYearly={isYearly}
              monthlyPrice={premiumMonthly.price}
            />
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative pb-4 sm:pb-6 p-4 sm:p-6">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm mb-2 sm:mb-3">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
            </div>
            <CardTitle className="text-white text-lg sm:text-xl mb-1 sm:mb-2">OCR Teknolojisi</CardTitle>
            <CardDescription className="text-white/90 text-sm sm:text-base leading-relaxed">
              Kredi döküm analizi otomasyonu
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative pb-4 sm:pb-6 p-4 sm:p-6">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm mb-2 sm:mb-3">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
            </div>
            <CardTitle className="text-white text-lg sm:text-xl mb-1 sm:mb-2">AI Finansal Sağlık Analizi</CardTitle>
            <CardDescription className="text-white/90 text-sm sm:text-base leading-relaxed">
              Yapay zeka destekli finansal öneriler
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative pb-4 sm:pb-6 p-4 sm:p-6">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm mb-2 sm:mb-3">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
            </div>
            <CardTitle className="text-white text-lg sm:text-xl mb-1 sm:mb-2">Reklamsız Deneyim</CardTitle>
            <CardDescription className="text-white/90 text-sm sm:text-base leading-relaxed">
              Kesintisiz kullanım imkanı
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Current Usage for Free Users */}
      {!isPremium && subscription && subscription.usage && currentPlanType === "free" && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl"></div>
          <CardHeader className="relative p-3 sm:p-4">
            <CardTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Mevcut Kullanım
            </CardTitle>
            <CardDescription className="text-white/90 text-xs sm:text-sm">Ücretsiz plan kullanım durumunuz</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-3 p-3 sm:p-4 pt-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                <span className="text-xs sm:text-sm font-medium text-white">OCR Teknolojisi İle Kayıt Edilebilir Kredi Sayısı</span>
                <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  {subscription?.usage?.ocrAnalysis?.savedCredits || 0} / 1
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div
                  className="bg-white h-1.5 sm:h-2 rounded-full transition-all shadow-lg"
                  style={{
                    width: `${((subscription?.usage?.ocrAnalysis?.savedCredits || 0) / 1) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                <span className="text-xs sm:text-sm font-medium text-white">AI Finansal Sağlık Analizi</span>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-[10px] sm:text-xs px-1.5 py-0.5">
                  <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Ücretli Özellik</span>
                  <span className="sm:hidden">Ücretli</span>
                </Badge>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div className="bg-white/40 h-1.5 sm:h-2 rounded-full w-0"></div>
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
              Plan değişikliğiniz kaydedilecektir. Mevcut abonelik süreniz bittiğinde yeni plan otomatik olarak devreye
              girecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Mevcut Plan:</p>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-700 dark:text-white/70">
                    {currentPlanId === "premium-yearly"
                      ? "Yıllık Premium"
                      : currentPlanId === "premium-monthly"
                        ? "Aylık Premium"
                        : currentPlanId === "pro-yearly"
                          ? "Yıllık Pro"
                          : currentPlanId === "pro-monthly"
                            ? "Aylık Pro"
                            : "Ücretsiz"}
                  </span>
                  <Badge variant="outline">{plans.find((p) => p.id === currentPlanId)?.price || 0}₺</Badge>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">Yeni Plan:</p>
                <div className="flex items-center justify-between">
                  <span className="text-base text-emerald-700 dark:text-emerald-300">
                    {targetPlanId === "premium-yearly"
                      ? "Yıllık Premium"
                      : targetPlanId === "premium-monthly"
                        ? "Aylık Premium"
                        : targetPlanId === "pro-yearly"
                          ? "Yıllık Pro"
                          : targetPlanId === "pro-monthly"
                            ? "Aylık Pro"
                            : "Bilinmiyor"}
                  </span>
                  <Badge className="bg-emerald-600 dark:bg-emerald-500">
                    {plans.find((p) => p.id === targetPlanId)?.price || 0}₺
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Önemli:</strong> Plan değişikliğiniz kaydedilecektir. Mevcut abonelik süreniz{" "}
                {subscription?.expiresAt && (
                  <span className="font-semibold">({new Date(subscription.expiresAt).toLocaleDateString("tr-TR")})</span>
                )}{" "}
                bittiğinde yeni plan otomatik olarak devreye girecektir.
              </p>
            </div>
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
