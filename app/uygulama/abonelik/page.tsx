"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Crown,
  CreditCard,
  Calendar,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Check,
  X,
  Info,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Download,
  Eye,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/format"
import { UserInvoices } from "@/components/user-invoices"

export default function AbonelikPage() {
  const { user } = useAuth()
  const { subscription, isPremium, loading: subscriptionLoading } = useSubscription()
  const { toast } = useToast()
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("plan")

  // Handle payment callback
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const payment = searchParams.get("payment")
    const reason = searchParams.get("reason")

    if (payment) {
      if (payment === "success") {
        toast({
          title: "Ödeme Başarılı!",
          description: "Premium üyeliğiniz aktif edildi. Tüm özelliklere erişebilirsiniz!",
        })
      } else if (payment === "failed") {
        toast({
          title: "Ödeme Başarısız",
          description: reason ? decodeURIComponent(reason) : "Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        })
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [toast])

  // Cancel subscription handler
  const handleCancelSubscription = async () => {
    setShowCancelDialog(false)
    setIsCancelling(true)
    try {
      if (!user?.id) {
        throw new Error("Kullanıcı bulunamadı")
      }

      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Abonelik İptal Edildi",
          description: "Aboneliğiniz başarıyla iptal edildi. Mevcut dönem sonuna kadar premium özelliklerden yararlanabilirsiniz.",
        })
        window.location.reload()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Abonelik iptal edilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600 dark:text-white/70">Abonelik bilgileri yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Crown className="h-8 w-8" />
                Abonelik Yönetimi
              </h2>
              <p className="text-slate-100 text-lg">
                Abonelik planınızı yönetin, fatura geçmişinizi görüntüleyin ve özelliklerden yararlanın
              </p>
            </div>
            {!isPremium && (
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-slate-100 shadow-lg"
                onClick={() => router.push("/uygulama/premium")}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Premium'a Yükselt
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modern Tabs */}
      <div className="bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10">
            <TabsList className="grid grid-cols-3 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="plan"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Crown className="h-4 w-4" />
                <span className="font-medium">Mevcut Plan</span>
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Zap className="h-4 w-4" />
                <span className="font-medium">Özellikler</span>
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">Fatura Geçmişi</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="plan">
              <div className="space-y-6">
                {/* Mevcut Plan */}
                <Card className="dark:bg-black/20 dark:border-white/10">
                  <CardContent className="p-6">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 p-6 text-white">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <Crown className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold">{isPremium ? "Premium" : "Ücretsiz"} Plan</h3>
                              <p className="text-emerald-100">
                                {isPremium ? "Tüm özelliklere erişim" : "Temel özellikler"}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-white/20 border-white/30 text-white backdrop-blur-sm px-4 py-2">
                            {subscription?.status === "active" ? "Aktif" : subscription?.status || "N/A"}
                          </Badge>
                        </div>

                        {isPremium && subscription?.expiresAt && (
                          <div className="flex items-center gap-2 text-emerald-100">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              Bitiş Tarihi: {new Date(subscription.expiresAt).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                        )}

                        {subscription?.plan_id && (
                          <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                            <p className="text-sm font-medium mb-2">Plan Detayları</p>
                            <p className="text-xs text-emerald-100">
                              {subscription.plan_id === "premium-yearly"
                                ? "Yıllık Premium - 1,990₺/yıl"
                                : subscription.plan_id === "premium-monthly"
                                  ? "Aylık Premium - 199₺/ay"
                                  : "Ücretsiz Plan"}
                            </p>
                          </div>
                        )}

                        {/* Kullanım İstatistikleri */}
                        {subscription && (
                          <div className="mt-4 space-y-3">
                            <p className="text-sm font-medium text-emerald-100">Kullanım İstatistikleri</p>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">OCR Analizi</span>
                                  <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">
                                    {isPremium ? "Sınırsız" : `${subscription.usage?.ocrAnalysis?.used || 0}/${subscription.usage?.ocrAnalysis?.limit || 1}`}
                                  </Badge>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2">
                                  <div
                                    className="bg-white h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: isPremium
                                        ? "100%"
                                        : `${Math.min(100, ((subscription.usage?.ocrAnalysis?.used || 0) / (subscription.usage?.ocrAnalysis?.limit || 1)) * 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">Risk Analizi</span>
                                  <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">
                                    {isPremium ? "Sınırsız" : "Premium Gerekli"}
                                  </Badge>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2">
                                  <div
                                    className="bg-white h-2 rounded-full transition-all duration-300"
                                    style={{ width: isPremium ? "100%" : "0%" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* İptal Uyarısı */}
                    {subscription?.status === "cancelled" && subscription?.expiresAt && (
                      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-900 dark:text-yellow-100">Abonelik İptal Edildi</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Premium özellikleriniz{" "}
                              <strong>
                                {new Date(subscription.expiresAt).toLocaleDateString("tr-TR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </strong>{" "}
                              tarihine kadar aktif kalacak.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Aksiyonlar */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      {!isPremium ? (
                        <Button
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                          onClick={() => router.push("/uygulama/premium")}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Premium'a Yükselt
                        </Button>
                      ) : subscription?.status === "cancelled" ? (
                        <Button
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                          onClick={() => router.push("/uygulama/premium")}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Yeniden Abone Ol
                        </Button>
                      ) : (
                        <>
                          <Button
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                            onClick={() => router.push("/uygulama/premium")}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Planı Değiştir
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-400 bg-transparent"
                            onClick={() => setShowCancelDialog(true)}
                            disabled={isCancelling}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Aboneliği İptal Et
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bilgilendirme */}
                <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-700 dark:text-blue-300">Abonelik Bilgisi</AlertTitle>
                  <AlertDescription className="text-blue-600 dark:text-blue-400">
                    {isPremium
                      ? "Premium üyeliğiniz aktif. Tüm özelliklere sınırsız erişiminiz var. Aboneliğinizi istediğiniz zaman iptal edebilir veya planınızı değiştirebilirsiniz."
                      : "Ücretsiz plan kullanıyorsunuz. Premium'a yükselterek sınırsız OCR analizi, risk analizi ve reklamsız deneyimin keyfini çıkarabilirsiniz."}
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="features">
              <div className="space-y-6">
                <Card className="dark:bg-black/20 dark:border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Premium Özellikler
                    </CardTitle>
                    <CardDescription className="dark:text-white/60">
                      Premium planla gelen tüm özellikler
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Check, text: "Sınırsız OCR analizi", premium: true },
                      { icon: Check, text: "Sınırsız risk analizi", premium: true },
                      { icon: Check, text: "Sınırsız kredi kartı takibi", premium: true },
                      { icon: Check, text: "Gelişmiş raporlama ve analitik", premium: true },
                      { icon: Check, text: "Ödeme planı takvimi", premium: true },
                      { icon: Check, text: "E-posta hatırlatıcıları", premium: true },
                      { icon: Check, text: "PDF rapor indirme", premium: true },
                      { icon: Check, text: "Excel/CSV dışa aktarma", premium: true },
                      { icon: Check, text: "Öncelikli destek", premium: true },
                      { icon: Check, text: "Reklamsız deneyim", premium: true },
                      { icon: Shield, text: "Gelişmiş güvenlik", premium: true },
                      { icon: Zap, text: "Hızlı veri senkronizasyonu", premium: true },
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-black/10 rounded-lg"
                      >
                        <div className={`p-2 rounded-full ${isPremium ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-200 dark:bg-gray-700"}`}>
                          <feature.icon className={`h-4 w-4 ${isPremium ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`} />
                        </div>
                        <span className={`font-medium ${isPremium ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-white/60"}`}>
                          {feature.text}
                        </span>
                        {!isPremium && feature.premium && (
                          <Badge variant="outline" className="ml-auto">Premium</Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="invoices">
              <UserInvoices />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md dark:bg-black/90 dark:border-white/10">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl dark:text-white">Abonelik İptali</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2 dark:text-white/70">
              Aboneliğinizi iptal etmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-black/10 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Mevcut Abonelik:</p>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-700 dark:text-white/70">
                    {subscription?.plan_id === "premium-yearly" ? "Yıllık Premium" : "Aylık Premium"}
                  </span>
                  <Badge variant="outline" className="dark:border-white/20 dark:text-white/70">
                    {subscription?.plan_id === "premium-yearly" ? "1,990₺/yıl" : "199₺/ay"}
                  </Badge>
                </div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Önemli Bilgiler
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Mevcut dönem sonuna kadar premium özelliklerden yararlanabilirsiniz</li>
                      <li>• İptal işlemi hemen gerçekleşecektir</li>
                      <li>• Otomatik yenileme durdurulacaktır</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-gray-300 dark:border-white/10 dark:text-white/70"
              disabled={isCancelling}
            >
              Vazgeç
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  İptal Ediliyor...
                </>
              ) : (
                "Aboneliği İptal Et"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
