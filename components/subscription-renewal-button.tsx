"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, RefreshCw, AlertCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SubscriptionRenewalButtonProps {
  subscription: {
    id: string
    planId: string
    planType: string
    expiresAt: string
    status: string
  }
  userId: string
  userEmail: string
  planName?: string
  planPrice?: number
  onSuccess?: () => void
}

export default function SubscriptionRenewalButton({
  subscription,
  userId,
  userEmail,
  planName = "Premium",
  planPrice = 0,
  onSuccess,
}: SubscriptionRenewalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showIframe, setShowIframe] = useState(false)
  const [iframeToken, setIframeToken] = useState<string | null>(null)
  const { toast } = useToast()

  // Calculate days until expiry
  const expiryDate = new Date(subscription.expiresAt)
  const now = new Date()
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = daysUntilExpiry < 0
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0

  // Load PayTR iFrame resizer script
  useEffect(() => {
    if (showIframe && !window.iFrameResize) {
      const script = document.createElement("script")
      script.src = "https://www.paytr.com/js/iframeResizer.min.js"
      script.async = true
      document.body.appendChild(script)
    }
  }, [showIframe])

  const handleRenew = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/paytr/renew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Yenileme oluşturulamadı")
      }

      if (data.iframeToken) {
        setIframeToken(data.iframeToken)
        setShowIframe(true)

        toast({
          title: "Ödeme Sayfası Hazır",
          description: "Aboneliğinizi yenilemek için ödeme yapabilirsiniz",
        })
      }
    } catch (error: any) {
      console.error("PayTR renewal error:", error)
      toast({
        title: "Yenileme Hatası",
        description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setShowIframe(open)
    if (!open) {
      setIframeToken(null)
      onSuccess?.()
    }
  }

  return (
    <>
      <Card className={isExpiringSoon || isExpired ? "border-orange-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isExpired ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                Aboneliğiniz Sona Erdi
              </>
            ) : isExpiringSoon ? (
              <>
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Aboneliğiniz Yakında Sona Eriyor
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 text-emerald-500" />
                Abonelik Yenileme
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isExpired ? (
              "Aboneliğinizi yenileyerek premium özelliklere tekrar erişin"
            ) : (
              <>
                Son kullanım tarihi:{" "}
                <strong>{expiryDate.toLocaleDateString("tr-TR")}</strong>
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isExpired ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Premium özellikler devre dışı bırakıldı. Aboneliğinizi yenilemek için ödeme yapın.
              </AlertDescription>
            </Alert>
          ) : isExpiringSoon ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aboneliğiniz <strong>{daysUntilExpiry} gün</strong> içinde sona erecek.
                Kesintisiz hizmet için şimdi yenileyin.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-muted-foreground">
              Aboneliğiniz aktif. Kalan süre: <strong>{daysUntilExpiry} gün</strong>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium">{planName}</p>
              <p className="text-2xl font-bold">{planPrice} TL</p>
            </div>

            <Button
              onClick={handleRenew}
              disabled={loading}
              size="lg"
              variant={isExpired ? "destructive" : isExpiringSoon ? "default" : "outline"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hazırlanıyor...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isExpired ? "Aboneliği Yenile" : "Şimdi Yenile"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showIframe} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Abonelik Yenileme</DialogTitle>
            <DialogDescription>
              {planName} - {planPrice} TL
            </DialogDescription>
          </DialogHeader>

          <div className="w-full h-[600px] overflow-hidden">
            {iframeToken && (
              <iframe
                src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                id="paytr-renewal-iframe"
                frameBorder="0"
                scrolling="yes"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="PayTR Yenileme Ödemesi"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
