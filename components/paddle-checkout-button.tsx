"use client"

import { useState, useEffect, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaddleCheckoutButtonProps {
  planId: string
  planName: string
  priceId: string
  userEmail?: string
  userId?: string
  onSuccess?: () => void
  onClose?: () => void
  className?: string
  children?: ReactNode
}

declare global {
  interface Window {
    Paddle?: any
  }
}

export default function PaddleCheckoutButton({
  planId,
  planName,
  priceId,
  userEmail,
  userId,
  onSuccess,
  onClose,
  className,
  children,
}: PaddleCheckoutButtonProps) {
  const [isPaddleReady, setIsPaddleReady] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if Paddle script is already loaded
    if (window.Paddle) {
      setIsPaddleReady(true)
      return
    }

    // Load Paddle.js
    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        try {
          window.Paddle.Initialize({
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
            environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox",
            eventCallback: (event: any) => {
              // Paddle event logged

              if (event.name === "checkout.completed") {
                onSuccess?.()
              }

              if (event.name === "checkout.closed") {
                onClose?.()
              }
            },
          })
          setIsPaddleReady(true)
        } catch (error) {
          console.error("Paddle initialization error:", error)
          toast({
            title: "Hata",
            description: "Ödeme sistemi yüklenemedi. Lütfen sayfayı yenileyin.",
            variant: "destructive",
          })
        }
      }
    }
    script.onerror = () => {
      console.error("Failed to load Paddle script")
      toast({
        title: "Hata",
        description: "Ödeme sistemi yüklenemedi. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      })
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [toast, onSuccess, onClose])

  // Auto-open checkout when ready and no children provided
  useEffect(() => {
    if (isPaddleReady && !children && !isOpening) {
      setTimeout(() => {
        handleOpenCheckout()
      }, 100)
    }
  }, [isPaddleReady, children])

  const handleOpenCheckout = () => {
    if (!isPaddleReady || !window.Paddle) {
      toast({
        title: "Hata",
        description: "Ödeme sistemi henüz hazır değil. Lütfen bekleyin.",
        variant: "destructive",
      })
      return
    }

    if (!priceId) {
      toast({
        title: "Hata",
        description: "Plan fiyat bilgisi bulunamadı.",
        variant: "destructive",
      })
      return
    }

    setIsOpening(true)

    try {
      const checkoutOptions: any = {
        items: [
          {
            priceId: priceId,
            quantity: 1,
          },
        ],
        customData: {
          userId: userId || "",
          planId: planId,
        },
      }

      // Add customer email if available
      if (userEmail) {
        checkoutOptions.customer = {
          email: userEmail,
        }
      }

      window.Paddle.Checkout.open(checkoutOptions)
    } catch (error: any) {
      console.error("Paddle checkout error:", error)
      toast({
        title: "Hata",
        description: error.message || "Ödeme sayfası açılamadı.",
        variant: "destructive",
      })
    } finally {
      setIsOpening(false)
    }
  }

  if (children) {
    return (
      <div className={className} onClick={handleOpenCheckout}>
        {children}
        {!isPaddleReady && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Ödeme sistemi yükleniyor...
          </div>
        )}
      </div>
    )
  }

  return (
    <Button
      onClick={handleOpenCheckout}
      disabled={!isPaddleReady || isOpening}
      className={className}
      size="lg"
    >
      {isOpening ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Açılıyor...
        </>
      ) : !isPaddleReady ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Yükleniyor...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Ödeme Yap
        </>
      )}
    </Button>
  )
}
