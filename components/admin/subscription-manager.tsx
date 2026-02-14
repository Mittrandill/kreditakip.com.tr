"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  CreditCard,
  Clock,
  TrendingUp,
  Ban,
  Plus,
  RefreshCw,
} from "lucide-react"
import { format, addMonths, addYears } from "date-fns"
import { tr } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface SubscriptionManagerProps {
  userId: string
  currentSubscription: any
  usage: any[]
  availablePlans: any[]
}

export function SubscriptionManager({
  userId,
  currentSubscription,
  usage,
  availablePlans,
}: SubscriptionManagerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [newExpiresAt, setNewExpiresAt] = useState<Date | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false)

  // Get usage statistics
  const ocrUsage = usage?.find((u) => u.feature_type === "ocr_analysis")
  const riskUsage = usage?.find((u) => u.feature_type === "risk_analysis")
  const savedCreditsUsage = usage?.find((u) => u.feature_type === "saved_credits")

  // Check if subscription is manual (admin-created) - null or explicitly admin_override
  const isManualSubscription =
    !currentSubscription?.payment_provider ||
    currentSubscription?.payment_provider === null

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
            Aktif
          </Badge>
        )
      case "cancelled":
      case "canceled":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
            İptal Edildi
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
            Süresi Doldu
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
            {status}
          </Badge>
        )
    }
  }

  // Calculate days remaining
  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  // Handle plan change
  const handlePlanChange = async () => {
    if (!selectedPlan || !currentSubscription) {
      toast.error("Lütfen bir plan seçin")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          userId,
          subscriptionId: currentSubscription.id,
          planId: selectedPlan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Plan değiştirilemedi")
      }

      toast.success("Plan başarıyla değiştirildi")
      setShowChangePlanDialog(false)
      setSelectedPlan("")
      router.refresh()
    } catch (error: any) {
      console.error("Error changing plan:", error)
      toast.error(error.message || "Plan değiştirilirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle extend subscription
  const handleExtend = async () => {
    if (!newExpiresAt || !currentSubscription) {
      toast.error("Lütfen yeni bitiş tarihini seçin")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend",
          userId,
          subscriptionId: currentSubscription.id,
          expiresAt: newExpiresAt.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Süre uzatılamadı")
      }

      toast.success("Abonelik süresi başarıyla uzatıldı")
      setShowExtendDialog(false)
      setNewExpiresAt(null)
      router.refresh()
    } catch (error: any) {
      console.error("Error extending subscription:", error)
      toast.error(error.message || "Süre uzatılırken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle create new subscription (manual - admin override)
  const handleCreate = async () => {
    if (!selectedPlan) {
      toast.error("Lütfen bir plan seçin")
      return
    }

    setIsLoading(true)
    try {
      // Manuel abonelikler için 1 yıl süre ver
      const expiresDate = new Date()
      expiresDate.setFullYear(expiresDate.getFullYear() + 1)

      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId,
          planId: selectedPlan,
          expiresAt: expiresDate.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Abonelik oluşturulamadı")
      }

      toast.success("Manuel abonelik başarıyla oluşturuldu (1 yıl süreyle)")
      setShowCreateDialog(false)
      setSelectedPlan("")
      setNewExpiresAt(null)
      router.refresh()
    } catch (error: any) {
      console.error("Error creating subscription:", error)
      toast.error(error.message || "Abonelik oluşturulurken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancel subscription
  const handleCancel = async () => {
    if (!currentSubscription) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          userId,
          subscriptionId: currentSubscription.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Abonelik iptal edilemedi")
      }

      toast.success("Abonelik başarıyla iptal edildi")
      setShowCancelDialog(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error cancelling subscription:", error)
      toast.error(error.message || "Abonelik iptal edilirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  // Quick extend actions
  const handleQuickExtend = (months: number) => {
    const currentExpires = currentSubscription?.expires_at
      ? new Date(currentSubscription.expires_at)
      : new Date()
    const newDate = addMonths(currentExpires, months)
    setNewExpiresAt(newDate)
  }

  const handleQuickExtendYear = () => {
    const currentExpires = currentSubscription?.expires_at
      ? new Date(currentSubscription.expires_at)
      : new Date()
    const newDate = addYears(currentExpires, 1)
    setNewExpiresAt(newDate)
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card
        className={`backdrop-blur-xl ${
          isManualSubscription
            ? "bg-black/20 border-purple-500/30"
            : "bg-black/20 border-white/10"
        }`}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {isManualSubscription ? (
              <>
                <span className="text-purple-400">⚡</span>
                <span>Manuel Premium Abonelik</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 text-white/60" />
                <span>Mevcut Abonelik</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSubscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Plan</p>
                  <p className="text-white font-semibold text-lg">
                    {currentSubscription.plan_type === "premium"
                      ? "Premium"
                      : currentSubscription.plan_type === "pro"
                      ? "Pro"
                      : "Ücretsiz"}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {currentSubscription.billing_period === "monthly" ? "Aylık" : "Yıllık"}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-1">Durum</p>
                  <div>{getStatusBadge(currentSubscription.status)}</div>
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-1">Başlangıç Tarihi</p>
                  <p className="text-white font-medium">
                    {format(new Date(currentSubscription.start_date), "PPP", { locale: tr })}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-1">Bitiş Tarihi</p>
                  <p className="text-white font-medium">
                    {format(new Date(currentSubscription.expires_at), "dd MMMM yyyy", { locale: tr })}
                  </p>
                  {currentSubscription.status === "active" && (
                    <>
                      {getDaysRemaining(currentSubscription.expires_at) > 0 ? (
                        <p className="text-emerald-400 text-xs mt-1">
                          ⏱️ {getDaysRemaining(currentSubscription.expires_at)} gün kaldı
                        </p>
                      ) : (
                        <p className="text-red-400 text-xs mt-1">
                          ⚠️ Süresi doldu
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-1">Abonelik Tipi</p>
                  {isManualSubscription ? (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                      ⚡ Manuel (Admin Tarafından Verildi)
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                      💳 Ödeme ({currentSubscription.payment_provider || "PayTR"})
                    </Badge>
                  )}
                </div>
              </div>

              {/* Usage Statistics */}
              {usage && usage.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-white/60" />
                    Kullanım İstatistikleri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                      <p className="text-white/60 text-xs mb-1">OCR Analizi</p>
                      <p className="text-white font-bold text-xl">
                        {ocrUsage?.usage_count || 0}
                        <span className="text-white/40 text-sm font-normal">
                          {" "}
                          / {ocrUsage?.usage_limit === -1 ? "∞" : ocrUsage?.usage_limit || 0}
                        </span>
                      </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                      <p className="text-white/60 text-xs mb-1">Risk Analizi</p>
                      <p className="text-white font-bold text-xl">
                        {riskUsage?.usage_count || 0}
                        <span className="text-white/40 text-sm font-normal">
                          {" "}
                          / {riskUsage?.usage_limit || 0}
                        </span>
                      </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                      <p className="text-white/60 text-xs mb-1">Kayıtlı Kredi</p>
                      <p className="text-white font-bold text-xl">
                        {savedCreditsUsage?.usage_count || 0}
                        <span className="text-white/40 text-sm font-normal">
                          {" "}
                          / {savedCreditsUsage?.usage_limit || 0}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-black/20 border border-purple-500/30 rounded-lg p-8 max-w-md mx-auto backdrop-blur-xl">
                <div className="bg-black/40 border border-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-white/40" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Aktif Abonelik Yok
                </h3>
                <p className="text-white/60 mb-6 text-sm">
                  Bu kullanıcıya manuel olarak premium abonelik verebilirsiniz
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Manuel Premium Ver
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Management Actions */}
      {currentSubscription && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Plan */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg">Plan Değiştir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="Plan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.billing_period === "monthly" ? "Aylık" : "Yıllık"}) -{" "}
                      {plan.price} ₺
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowChangePlanDialog(true)}
                disabled={!selectedPlan || isLoading}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Planı Değiştir
              </Button>
            </CardContent>
          </Card>

          {/* Extend Subscription */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg">Süre Uzat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickExtend(1)}
                  className="flex-1 bg-black/20 border-white/10 text-white hover:bg-white/10"
                >
                  +1 Ay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickExtend(3)}
                  className="flex-1 bg-black/20 border-white/10 text-white hover:bg-white/10"
                >
                  +3 Ay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleQuickExtendYear}
                  className="flex-1 bg-black/20 border-white/10 text-white hover:bg-white/10"
                >
                  +1 Yıl
                </Button>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-black/20 border-white/10 text-white hover:bg-white/10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newExpiresAt ? (
                      format(newExpiresAt, "PPP", { locale: tr })
                    ) : (
                      <span>Tarih seçin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newExpiresAt || undefined}
                    onSelect={(date) => setNewExpiresAt(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                onClick={() => setShowExtendDialog(true)}
                disabled={!newExpiresAt || isLoading}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
              >
                <Clock className="mr-2 h-4 w-4" />
                Süreyi Uzat
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Subscription */}
      {currentSubscription && currentSubscription.status === "active" && (
        <Card className="bg-black/20 border-red-500/20 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold mb-1">Aboneliği İptal Et</h3>
                <p className="text-white/60 text-sm">
                  Bu işlem geri alınamaz. Abonelik iptal edilecek ve kullanıcı ücretsiz plana
                  geçecektir.
                </p>
              </div>
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="destructive"
                disabled={isLoading}
              >
                <Ban className="mr-2 h-4 w-4" />
                İptal Et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <AlertDialogContent className="bg-black/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Plan Değiştir</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Bu kullanıcının planını değiştirmek istediğinizden emin misiniz? Yeni plan
              limitleri hemen uygulanacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-black/20 border-white/10 text-white">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePlanChange}
              disabled={isLoading}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
            >
              {isLoading ? "İşleniyor..." : "Onayla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <AlertDialogContent className="bg-black/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Süre Uzat</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Abonelik bitiş tarihini{" "}
              <span className="text-emerald-400 font-semibold">
                {newExpiresAt && format(newExpiresAt, "PPP", { locale: tr })}
              </span>{" "}
              olarak güncellemek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-black/20 border-white/10 text-white">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExtend}
              disabled={isLoading}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
            >
              {isLoading ? "İşleniyor..." : "Onayla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="bg-black/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              ⚡ Manuel Premium Abonelik Ver
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Bu kullanıcıya manuel olarak premium abonelik vereceksiniz. Ödeme gerektirmez ve 1 yıl süreyle geçerli olacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block font-medium">
                Premium Plan Seçin
              </label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white hover:border-purple-500/30 transition-colors">
                  <SelectValue placeholder="Pro veya Premium seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans
                    ?.filter((plan) => plan.id.includes("pro") || plan.id.includes("premium"))
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.description || "Premium özellikler"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-white/40 text-xs mt-2">
                💡 Manuel abonelikler otomatik olarak 1 yıl süreyle verilir
              </p>
            </div>

            <div className="bg-black/40 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-white/80 font-medium text-sm mb-2">
                Manuel Abonelik Özellikleri
              </h4>
              <ul className="text-white/60 text-xs space-y-1">
                <li>• 1 yıl süreyle geçerli</li>
                <li>• Ödeme gerektirmez</li>
                <li>• Tüm premium özellikler dahil</li>
                <li>• İstediğiniz zaman uzatabilir veya iptal edebilirsiniz</li>
              </ul>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-black/20 border-white/10 text-white">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreate}
              disabled={isLoading || !selectedPlan}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
            >
              {isLoading ? "İşleniyor..." : "Manuel Abonelik Ver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-black/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Aboneliği İptal Et</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Bu kullanıcının aboneliğini iptal etmek istediğinizden emin misiniz? Bu işlem
              geri alınamaz ve kullanıcı hemen ücretsiz plana geçecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-black/20 border-white/10 text-white">
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
            >
              {isLoading ? "İşleniyor..." : "İptal Et"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
