"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Loader2,
  CreditCard,
  Shield,
  CheckCircle,
  Lock,
  Sparkles,
  ArrowRight,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface ModernPaddleCheckoutProps {
  planId: string
  planName: string
  priceId: string
  price: number
  period: "monthly" | "yearly"
  features: string[]
  userEmail?: string
  userId?: string
  onSuccess?: () => void
  onClose?: () => void
  discount?: string
  originalPrice?: number
}

declare global {
  interface Window {
    Paddle?: any
  }
}

export default function ModernPaddleCheckout({
  planId,
  planName,
  priceId,
  price,
  period,
  features,
  userEmail,
  userId,
  onSuccess,
  onClose,
  discount,
  originalPrice,
}: ModernPaddleCheckoutProps) {
  const [isPaddleReady, setIsPaddleReady] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'preview' | 'processing' | 'success'>('preview')
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
              if (event.name === "checkout.completed") {
                setCheckoutStep('success')
                setTimeout(() => {
                  onSuccess?.()
                  setShowModal(false)
                  setCheckoutStep('preview')
                }, 2000)
              }

              if (event.name === "checkout.closed") {
                setShowModal(false)
                setCheckoutStep('preview')
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

    document.head.appendChild(script)
  }, [toast, onSuccess, onClose])

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

    setShowModal(true)
  }

  const proceedToPayment = () => {
    setIsOpening(true)
    setCheckoutStep('processing')

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
      setCheckoutStep('preview')
    } finally {
      setIsOpening(false)
    }
  }

  const savings = originalPrice ? originalPrice - price : 0

  return (
    <>
      <Button
        onClick={handleOpenCheckout}
        disabled={!isPaddleReady}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
        size="lg"
      >
        {!isPaddleReady ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Yükleniyor...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Hemen Başla
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      <Dialog open={showModal} onOpenChange={(open) => {
        if (!open && checkoutStep !== 'processing') {
          setShowModal(false)
          setCheckoutStep('preview')
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {checkoutStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-2xl font-bold">
                      Siparişi Onayla
                    </DialogTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Güvenli Ödeme
                    </Badge>
                  </div>
                  <DialogDescription>
                    {planName} planına abone olmak üzeresiniz
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                  {/* Plan Details */}
                  <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{planName}</h3>
                          <p className="text-sm text-gray-600">
                            {period === 'yearly' ? 'Yıllık Abonelik' : 'Aylık Abonelik'}
                          </p>
                        </div>
                        <div className="text-right">
                          {originalPrice && originalPrice > price && (
                            <div className="text-sm text-gray-500 line-through">
                              ₺{originalPrice.toLocaleString('tr-TR')}
                            </div>
                          )}
                          <div className="text-3xl font-bold text-emerald-600">
                            ₺{price.toLocaleString('tr-TR')}
                          </div>
                          {discount && (
                            <Badge className="mt-1 bg-orange-500 text-white">
                              {discount}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {savings > 0 && (
                        <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-4">
                          <p className="text-sm font-semibold text-orange-800">
                            🎉 Yıllık planla ₺{savings.toLocaleString('tr-TR')} tasarruf ediyorsunuz!
                          </p>
                        </div>
                      )}

                      {/* Features */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Plan Özellikleri:</p>
                        {features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Details */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-gray-600">Ara Toplam</span>
                          <span className="font-semibold">
                            ₺{price.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-300">
                          <span className="font-bold text-lg">Toplam</span>
                          <span className="font-bold text-2xl text-emerald-600">
                            ₺{price.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
                          <Lock className="h-4 w-4" />
                          <span>Paddle tarafından güvenli ödeme işlemi</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="flex-1"
                      disabled={isOpening}
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={proceedToPayment}
                      disabled={isOpening}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
                    >
                      {isOpening ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Açılıyor...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Ödemeye Geç
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <Shield className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                      <p className="text-xs text-gray-600">256-bit SSL</p>
                    </div>
                    <div className="text-center">
                      <Lock className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                      <p className="text-xs text-gray-600">Güvenli Ödeme</p>
                    </div>
                    <div className="text-center">
                      <CheckCircle className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                      <p className="text-xs text-gray-600">PCI Uyumlu</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {checkoutStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ödeme Başarılı!
                </h3>
                <p className="text-gray-600">
                  Aboneliğiniz aktif edildi. Yönlendiriliyorsunuz...
                </p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto mt-6 text-emerald-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
