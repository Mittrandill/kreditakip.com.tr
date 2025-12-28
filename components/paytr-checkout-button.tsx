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
import { Loader2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayTRCheckoutButtonProps {
  planId: string
  planName: string
  price: number
  userId: string
  userEmail: string
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  children?: React.ReactNode
}

export default function PayTRCheckoutButton({
  planId,
  planName,
  price,
  userId,
  userEmail,
  onSuccess,
  onError,
  className,
  variant = "default",
  children,
}: PayTRCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showIframe, setShowIframe] = useState(false)
  const [iframeToken, setIframeToken] = useState<string | null>(null)
  const { toast } = useToast()

  // Load PayTR iFrame resizer script
  useEffect(() => {
    if (showIframe && !window.iFrameResize) {
      const script = document.createElement("script")
      script.src = "https://www.paytr.com/js/iframeResizer.min.js"
      script.async = true
      document.body.appendChild(script)
    }
  }, [showIframe])

  const handleCheckout = async () => {
    if (!userId || !userEmail) {
      toast({
        title: "Hata",
        description: "Lütfen önce giriş yapın",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          userId,
          userEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Ödeme oluşturulamadı")
      }

      if (data.iframeToken) {
        setIframeToken(data.iframeToken)
        setShowIframe(true)

        toast({
          title: "Ödeme Sayfası Hazır",
          description: "Güvenli ödeme sayfasına yönlendiriliyorsunuz...",
        })
      }
    } catch (error: any) {
      console.error("PayTR checkout error:", error)
      toast({
        title: "Ödeme Hatası",
        description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
        variant: "destructive",
      })
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setShowIframe(open)
    if (!open) {
      setIframeToken(null)
    }
  }

  return (
    <>
      <Button
        onClick={handleCheckout}
        disabled={loading}
        className={className}
        variant={variant}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Hazırlanıyor...
          </>
        ) : (
          <>
            {children || (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Ödemeye Geç
              </>
            )}
          </>
        )}
      </Button>

      <Dialog open={showIframe} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Güvenli Ödeme</DialogTitle>
            <DialogDescription>
              {planName} - {price} TL
            </DialogDescription>
          </DialogHeader>

          <div className="w-full h-[600px] overflow-hidden">
            {iframeToken && (
              <iframe
                src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                id="paytr-iframe"
                frameBorder="0"
                scrolling="yes"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="PayTR Ödeme"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
