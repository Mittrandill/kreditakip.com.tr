"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { ExternalLink, CreditCard, AlertCircle, Loader2, RefreshCw, X } from "lucide-react"

interface Subscription {
  id: string
  status: "active" | "canceled" | "paused" | "past_due"
  plan_id: string
  paddle_subscription_id: string
  ends_at: string
  cancel_url?: string
  update_url?: string
  plan_name?: string
  amount?: number
  currency?: string
}

export function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/status")
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          setSubscription(data.subscription)
        }
      }
    } catch (error) {
      console.error("[Subscription] Failed to fetch:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = () => {
    if (subscription?.update_url) {
      window.open(subscription.update_url, "_blank")
    } else {
      toast({
        title: "Hata",
        description: "Yönetim URL'si bulunamadı",
        variant: "destructive",
      })
    }
  }

  const handleCancelSubscription = () => {
    if (subscription?.cancel_url) {
      window.open(subscription.cancel_url, "_blank")
    } else {
      toast({
        title: "Hata",
        description: "İptal URL'si bulunamadı",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "past_due":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif"
      case "canceled":
        return "İptal Edildi"
      case "paused":
        return "Durduruldu"
      case "past_due":
        return "Ödeme Gecikti"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Aktif aboneliğiniz bulunmuyor.</p>
            <Button className="mt-4" onClick={() => window.location.href = "/uygulama/premium"}>
              Premium'a Geç
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mevcut Abonelik</CardTitle>
              <CardDescription>
                Abonelik durumunuzu ve bilgilerinizi yönetin
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              {getStatusText(subscription.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">{subscription.plan_name || "Bilinmeyen Plan"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tutar</p>
              <p className="font-medium">
                {subscription.amount && subscription.currency
                  ? `${subscription.amount} ${subscription.currency}`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sonraki Fatura Tarihi</p>
              <p className="font-medium">
                {subscription.ends_at
                  ? new Date(subscription.ends_at).toLocaleDateString("tr-TR")
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abonelik ID</p>
              <p className="font-medium text-sm">{subscription.paddle_subscription_id}</p>
            </div>
          </div>

          {subscription.status === "canceled" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aboneliğiniz iptal edilmiş. Mevcut dönem sonuna kadar Premium özelliklere erişiminiz devam edecek.
              </AlertDescription>
            </Alert>
          )}

          {subscription.status === "past_due" && (
            <Alert className="border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ödemeniz başarısız oldu. Lütfen ödeme bilgilerinizi güncelleyin.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Abonelik İşlemleri</CardTitle>
          <CardDescription>
            Aboneliğinizi Paddle üzerinden yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.status === "active" && (
            <>
              <Button
                onClick={handleManageSubscription}
                className="w-full"
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Ödeme Bilgilerini Güncelle
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              <Button
                onClick={handleCancelSubscription}
                className="w-full"
                variant="outline"
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Aboneliği İptal Et
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {subscription.status === "canceled" && (
            <Button
              onClick={() => window.location.href = "/uygulama/premium"}
              className="w-full"
            >
              Yeni Abonelik Başlat
            </Button>
          )}

          {subscription.status === "past_due" && (
            <Button
              onClick={handleManageSubscription}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Ödeme Bilgilerini Güncelle
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Abonelik yönetimi Paddle'ın güvenli portalı üzerinden yapılır.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}