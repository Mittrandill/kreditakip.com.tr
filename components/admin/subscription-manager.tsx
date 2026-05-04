"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"
import {
  CreditCard,
  TrendingUp,
  Ban,
  Plus,
  Infinity,
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useRouter } from "next/navigation"

// Predefined admin packages
const ADMIN_PACKAGES = [
  {
    id: "pro-1m",
    label: "1 Ay Pro",
    planId: "pro-monthly",
    planType: "pro",
    durationLabel: "1 ay",
    color: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300",
    getExpiresAt: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d },
  },
  {
    id: "premium-1m",
    label: "1 Ay Premium",
    planId: "premium-monthly",
    planType: "premium",
    durationLabel: "1 ay",
    color: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300",
    getExpiresAt: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d },
  },
  {
    id: "pro-1y",
    label: "1 Yıl Pro",
    planId: "pro-yearly",
    planType: "pro",
    durationLabel: "1 yıl",
    color: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300",
    getExpiresAt: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d },
  },
  {
    id: "premium-1y",
    label: "1 Yıl Premium",
    planId: "premium-yearly",
    planType: "premium",
    durationLabel: "1 yıl",
    color: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300",
    getExpiresAt: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d },
  },
  {
    id: "premium-unlimited",
    label: "Sınırsız Premium",
    planId: "premium-yearly",
    planType: "premium",
    durationLabel: "sınırsız",
    color: "bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 text-purple-300",
    getExpiresAt: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 50); return d },
  },
]

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
}: SubscriptionManagerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const ocrUsage = usage?.find((u) => u.feature_type === "ocr_analysis")
  const riskUsage = usage?.find((u) => u.feature_type === "risk_analysis")

  const isManualSubscription =
    !currentSubscription?.payment_provider ||
    currentSubscription?.payment_provider === null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">Aktif</Badge>
      case "cancelled":
      case "canceled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/20">İptal Edildi</Badge>
      case "expired":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">Süresi Doldu</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">{status}</Badge>
    }
  }

  const getDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const isUnlimited = (expiresAt: string) => {
    return new Date(expiresAt).getFullYear() >= 2070
  }

  const handleCreate = async () => {
    if (!selectedPackage) {
      toast.error("Lütfen bir paket seçin")
      return
    }

    const pkg = ADMIN_PACKAGES.find((p) => p.id === selectedPackage)
    if (!pkg) return

    setIsLoading(true)
    try {
      const expiresAt = pkg.getExpiresAt()
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId,
          planId: pkg.planId,
          expiresAt: expiresAt.toISOString(),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Abonelik oluşturulamadı")

      toast.success(`${pkg.label} abonelik başarıyla verildi`)
      setShowCreateDialog(false)
      setSelectedPackage("")
      router.refresh()
    } catch (error: any) {
      console.error("Error creating subscription:", error)
      toast.error(error.message || "Abonelik oluşturulurken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePackage = async () => {
    if (!selectedPackage || !currentSubscription) {
      toast.error("Lütfen bir paket seçin")
      return
    }

    const pkg = ADMIN_PACKAGES.find((p) => p.id === selectedPackage)
    if (!pkg) return

    setIsLoading(true)
    try {
      const expiresAt = pkg.getExpiresAt()

      // Update plan type + limits
      const updateResponse = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          userId,
          subscriptionId: currentSubscription.id,
          planId: pkg.planId,
        }),
      })
      const updateData = await updateResponse.json()
      if (!updateResponse.ok) throw new Error(updateData.error || "Plan güncellenemedi")

      // Extend expiry to match the new package duration
      const extendResponse = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend",
          userId,
          subscriptionId: currentSubscription.id,
          expiresAt: expiresAt.toISOString(),
        }),
      })
      const extendData = await extendResponse.json()
      if (!extendResponse.ok) throw new Error(extendData.error || "Süre güncellenemedi")

      toast.success(`${pkg.label} paketi başarıyla uygulandı`)
      setSelectedPackage("")
      router.refresh()
    } catch (error: any) {
      console.error("Error changing package:", error)
      toast.error(error.message || "Paket değiştirilirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

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
      if (!response.ok) throw new Error(data.error || "Abonelik iptal edilemedi")

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

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card
        className={`backdrop-blur-xl ${
          isManualSubscription ? "bg-black/20 border-purple-500/30" : "bg-black/20 border-white/10"
        }`}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {isManualSubscription ? (
              <><span className="text-purple-400">⚡</span><span>Manuel Abonelik</span></>
            ) : (
              <><CreditCard className="h-5 w-5 text-white/60" /><span>Mevcut Abonelik</span></>
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
                    {currentSubscription.plan_type === "premium" ? "Premium"
                      : currentSubscription.plan_type === "pro" ? "Pro"
                      : "Ücretsiz"}
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
                  {isUnlimited(currentSubscription.expires_at) ? (
                    <div className="flex items-center gap-1 text-purple-400 font-medium">
                      <Infinity className="h-4 w-4" />
                      <span>Sınırsız</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-white font-medium">
                        {format(new Date(currentSubscription.expires_at), "dd MMMM yyyy", { locale: tr })}
                      </p>
                      {currentSubscription.status === "active" && (
                        getDaysRemaining(currentSubscription.expires_at) > 0 ? (
                          <p className="text-emerald-400 text-xs mt-1">
                            ⏱️ {getDaysRemaining(currentSubscription.expires_at)} gün kaldı
                          </p>
                        ) : (
                          <p className="text-red-400 text-xs mt-1">⚠️ Süresi doldu</p>
                        )
                      )}
                    </>
                  )}
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-1">Abonelik Tipi</p>
                  {isManualSubscription ? (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                      ⚡ Manuel (Admin)
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                      <p className="text-white/60 text-xs mb-1">OCR Analizi</p>
                      <p className="text-white font-bold text-xl">
                        {ocrUsage?.usage_count || 0}
                        <span className="text-white/40 text-sm font-normal">
                          {" "}/ {ocrUsage?.limit_count === -1 ? "∞" : ocrUsage?.limit_count || 0}
                        </span>
                      </p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                      <p className="text-white/60 text-xs mb-1">Risk Analizi</p>
                      <p className="text-white font-bold text-xl">
                        {riskUsage?.usage_count || 0}
                        <span className="text-white/40 text-sm font-normal">
                          {" "}/ {riskUsage?.limit_count || 0}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-black/20 border border-purple-500/30 rounded-lg p-8 max-w-md mx-auto">
                <CreditCard className="h-8 w-8 text-white/40 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">Aktif Abonelik Yok</h3>
                <p className="text-white/60 mb-6 text-sm">
                  Bu kullanıcıya manuel olarak abonelik verebilirsiniz
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Abonelik Ver
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Package Change (only if subscription exists) */}
      {currentSubscription && (
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">Paket Değiştir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/60 text-sm">Yeni paket seçin — plan tipi ve bitiş tarihi güncellenir:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADMIN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(selectedPackage === pkg.id ? "" : pkg.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                    selectedPackage === pkg.id
                      ? pkg.color + " ring-2 ring-white/20"
                      : "bg-black/20 border-white/10 text-white/70 hover:bg-white/5"
                  }`}
                >
                  <span>{pkg.label}</span>
                  {pkg.id === "premium-unlimited" && <Infinity className="h-4 w-4 ml-2 opacity-70" />}
                </button>
              ))}
            </div>
            <Button
              onClick={handleChangePackage}
              disabled={!selectedPackage || isLoading}
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
            >
              {isLoading ? "İşleniyor..." : "Paketi Uygula"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription */}
      {currentSubscription && currentSubscription.status === "active" && (
        <Card className="bg-black/20 border-red-500/20 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold mb-1">Aboneliği İptal Et</h3>
                <p className="text-white/60 text-sm">
                  Abonelik iptal edilecek ve kullanıcı ücretsiz plana geçecektir.
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

      {/* Create Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="bg-black/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              ⚡ Manuel Abonelik Ver
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Paket seçin ve onaylayın. Ödeme gerektirmez.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-2 py-2">
            {ADMIN_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(selectedPackage === pkg.id ? "" : pkg.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                  selectedPackage === pkg.id
                    ? pkg.color + " ring-2 ring-white/20"
                    : "bg-black/20 border-white/10 text-white/70 hover:bg-white/5"
                }`}
              >
                <span>{pkg.label}</span>
                <span className="text-xs opacity-60">{pkg.durationLabel}</span>
              </button>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-black/20 border-white/10 text-white"
              onClick={() => setSelectedPackage("")}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreate}
              disabled={isLoading || !selectedPackage}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
            >
              {isLoading ? "İşleniyor..." : "Abonelik Ver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-black/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Aboneliği İptal Et</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Bu kullanıcının aboneliğini iptal etmek istediğinizden emin misiniz?
              Kullanıcı hemen ücretsiz plana geçecektir.
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
