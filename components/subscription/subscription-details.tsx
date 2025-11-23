"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Crown, Calendar, CreditCard, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cancelSubscription } from "@/app/actions/subscription"

interface SubscriptionDetailsProps {
  subscription: {
    plan_id: string
    plan_type: string
    status: string
    start_date?: string
    expires_at?: string
  } | null
  isPremium: boolean
  onUpdate: () => void
}

export function SubscriptionDetails({ subscription, isPremium, onUpdate }: SubscriptionDetailsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelSubscription = async () => {
    setIsCancelling(true)

    try {
      const result = await cancelSubscription()

      if (result.success) {
        toast({
          title: "Abonelik İptal Edildi",
          description: result.message || "Aboneliğiniz başarıyla iptal edildi.",
        })
        onUpdate()
      } else {
        toast({
          title: "Hata",
          description: result.error || "Abonelik iptal edilemedi",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Cancel subscription error:", error)
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setShowCancelDialog(false)
    }
  }

  const getPlanName = (planId: string) => {
    if (planId === "premium-yearly") return "Yıllık Premium"
    if (planId === "premium-monthly") return "Aylık Premium"
    return "Ücretsiz Plan"
  }

  const getPlanPrice = (planId: string) => {
    if (planId === "premium-yearly") return "1,990₺/yıl"
    if (planId === "premium-monthly") return "199₺/ay"
    return "0₺"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-600 dark:bg-emerald-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aktif
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            İptal Edildi
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Süresi Doldu
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Abonelik Durumu
              </CardTitle>
              <CardDescription>Mevcut abonelik bilgileriniz</CardDescription>
            </div>
            {isPremium && (
              <Button onClick={() => router.push("/uygulama/premium")} variant="outline">
                Planı Değiştir
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isPremium ? (
            <div className="text-center py-8">
              <Crown className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ücretsiz Plan</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Premium özelliklere erişmek için yükseltin
              </p>
              <Button onClick={() => router.push("/uygulama/premium")}>
                <Crown className="h-4 w-4 mr-2" />
                Premium'a Yükselt
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Bilgisi */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Mevcut Plan</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {subscription?.plan_id ? getPlanName(subscription.plan_id) : "Premium"}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {subscription?.plan_id ? getPlanPrice(subscription.plan_id) : ""}
                  </p>
                </div>
                <Crown className="h-16 w-16 text-emerald-600 dark:text-emerald-400 opacity-20" />
              </div>

              {/* Durum */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Durum</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Abonelik durumunuz</p>
                  </div>
                </div>
                {subscription?.status && getStatusBadge(subscription.status)}
              </div>

              {/* Başlangıç Tarihi */}
              {subscription?.start_date && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Başlangıç Tarihi</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(subscription.start_date).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sonraki Ödeme/Bitiş Tarihi */}
              {subscription?.expires_at && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {subscription.status === "cancelled" ? "Bitiş Tarihi" : "Sonraki Ödeme"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(subscription.expires_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* İptal Butonu */}
              {subscription?.status === "active" && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-300 dark:border-red-800"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Aboneliği İptal Et
                  </Button>
                </div>
              )}

              {/* İptal Edilmiş Uyarı */}
              {subscription?.status === "cancelled" && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        Abonelik İptal Edildi
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Aboneliğiniz iptal edildi. {subscription.expires_at && (
                          <>
                            {new Date(subscription.expires_at).toLocaleDateString("tr-TR")} tarihine kadar premium
                            özelliklerine erişebilirsiniz.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aboneliği İptal Et</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Aboneliğinizi iptal etmek istediğinize emin misiniz?</p>
              {subscription?.expires_at && (
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(subscription.expires_at).toLocaleDateString("tr-TR")} tarihine kadar premium
                  özelliklerine erişmeye devam edebileceksiniz.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? "İptal Ediliyor..." : "Aboneliği İptal Et"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
