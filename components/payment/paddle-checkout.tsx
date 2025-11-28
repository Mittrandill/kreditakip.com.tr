"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, CreditCard, AlertCircle, CheckCircle, Zap } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Shield as ShieldIcon } from "lucide-react"

interface PaddleCheckoutProps {
  planId: string
  planName: string
  paddlePriceId: string
  amount: number
  billingInfo: {
    fullName: string
    email: string
    phone?: string
    address?: string
    city?: string
    country?: string
    zipCode?: string
  }
  onSuccess?: () => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    Paddle: any
  }
}

export function PaddleCheckout({
  planId,
  planName,
  paddlePriceId,
  amount,
  billingInfo,
  onSuccess,
  onError,
}: PaddleCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [isPaddleLoaded, setIsPaddleLoaded] = useState(false)

  const { toast } = useToast()
  const { user } = useAuth()

  // Load Paddle script
  useEffect(() => {
    const loadPaddle = async () => {
      if (window.Paddle) {
        setIsPaddleLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
      script.async = true

      script.onload = () => {
        if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox") {
          window.Paddle.Environment.set("sandbox")
        }
        window.Paddle.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID!,
        })
        setIsPaddleLoaded(true)
      }

      script.onerror = () => {
        console.error("[Paddle] Failed to load Paddle script")
        setError("Ödeme sistemi yüklenemedi. Lütfen sayfayı yenileyin.")
      }

      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }

    loadPaddle()
  }, [])

  const handleCheckout = async () => {
    if (!termsAccepted) {
      setError("Lütfen kullanım koşullarını ve gizlilik politikasını kabul edin")
      return
    }

    if (!isPaddleLoaded) {
      setError("Ödeme sistemi henüz yüklenmedi. Lütfen bekleyin.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create checkout in our system first to track
      const response = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          email: billingInfo.email,
          name: billingInfo.fullName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Ödeme başlatılamadı")
      }

      const { successUrl, cancelUrl } = await response.json()

      // Open Paddle checkout
      window.Paddle.Checkout.open({
        items: [
          {
            price_id: paddlePriceId,
            quantity: 1,
          },
        ],
        customer: {
          email: billingInfo.email,
          name: billingInfo.fullName,
          address: {
            country_code: billingInfo.country || "TR",
            postcode: billingInfo.zipCode,
            city: billingInfo.city,
            line_1: billingInfo.address,
          },
        },
        custom_data: {
          user_id: user?.id,
          plan_id: planId,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        display_mode: "overlay",
        allow_discount: true,
        locale: "tr",
      })

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      toast({
        title: "Ödeme Başlatıldı",
        description: "Paddle ödeme penceresi açıldı",
      })
    } catch (err: any) {
      console.error("[Paddle] Checkout error:", err)
      const errorMessage = err.message || "Ödeme başlatılırken bir hata oluştu"
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
      toast({
        title: "Ödeme Hatası",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isPaddleLoaded) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Ödeme sistemi yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Kullanım Koşulları Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <DialogTitle>Kullanım Koşulları</DialogTitle>
            </div>
            <DialogDescription>
              Lütfen kullanım koşullarını okuyup onaylayın
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Genel Hükümler</h3>
                <p className="text-muted-foreground">
                  Bu kullanım koşulları, kreditakip.com.tr platformunu kullanan tüm kullanıcılar için geçerlidir.
                  Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Hizmet Tanımı</h3>
                <p className="text-muted-foreground">
                  KrediTakip, kredi kartı ve kredi takibi yapmak için geliştirilmiş bir platformdur. Platform,
                  kullanıcıların kredi kartlarını takip etmesini, ödeme planlarını oluşturmasını ve finansal
                  durumlarını analiz etmesini sağlar.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Ödeme ve Abonelik</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Ödemeler Paddle üzerinden güvenli bir şekilde yapılır</li>
                  <li>Vergiler Paddle tarafından otomatik olarak hesaplanır</li>
                  <li>Abonelikler otomatik olarak yenilenir</li>
                  <li>İptal işlemi her zaman yapılabilir</li>
                  <li>İptal sonrası dönem sonuna kadar kullanıma devam edersiniz</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. İptal ve İade</h3>
                <p className="text-muted-foreground">
                  Aboneliğinizi herhangi bir zamanda iptal edebilirsiniz. İptal edilen abonelikler,
                  ödenen dönem sonuna kadar aktif kalır. Kullanılmış süreler için iade yapılmaz.
                </p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTermsModal(false)}
            >
              İptal
            </Button>
            <Button
              onClick={() => {
                setTermsAccepted(true)
                setShowTermsModal(false)
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Okudum ve Kabul Ediyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gizlilik Politikası Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShieldIcon className="h-5 w-5 text-emerald-600" />
              <DialogTitle>Gizlilik Politikası</DialogTitle>
            </div>
            <DialogDescription>
              Kişisel verilerinizin nasıl korunduğunu öğrenin
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Toplanan Veriler</h3>
                <p className="text-muted-foreground mb-2">
                  Hizmetlerimizi sağlamak için aşağıdaki verileri topluyoruz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Kimlik bilgileri (ad, soyad)</li>
                  <li>İletişim bilgileri (email, telefon)</li>
                  <li>Fatura bilgileri (adres)</li>
                  <li>Ödeme verileri (Paddle tarafından işlenir)</li>
                  <li>Kullanım verileri (platform kullanımı)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Veri Güvenliği</h3>
                <p className="text-muted-foreground">
                  Verileriniz Paddle'ın PCI-DSS uyumlu altyapısında güvende tutulur.
                  Ödeme bilgileri hiçbir zaman sunucularımızda saklanmaz.
                </p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPrivacyModal(false)}
            >
              Kapat
            </Button>
            <Button
              onClick={() => {
                setTermsAccepted(true)
                setShowPrivacyModal(false)
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Okudum ve Kabul Ediyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ödeme Bilgileri</CardTitle>
              <CardDescription>
                Paddle güvenli ödeme altyapısı ile ödeme yapın
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Güvenli Ödeme:</span>
              <Image
                src="/paddle-logo.png"
                alt="Paddle"
                width={80}
                height={30}
                className="object-contain"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-emerald-900 dark:text-emerald-100">
                  Paddle ile Güvenli Ödeme
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <li>• Kredi kartı bilgileriniz Paddle tarafından güvenli bir şekilde işlenir</li>
                  <li>• PCI-DSS uyumlu ödeme altyapısı</li>
                  <li>• Vergiler otomatik olarak hesaplanır</li>
                  <li>• 135+ para birimi desteği</li>
                  <li>• İptal veya para iade talepleri kolayca yapılabilir</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{planName}</span>
              <span className="font-bold text-lg">{amount}₺</span>
            </div>
          </div>

          {/* Kullanım Koşulları */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="termsAccepted"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="termsAccepted"
                  className="text-sm font-medium cursor-pointer block"
                >
                  Kullanım koşullarını kabul ediyorum (Zorunlu)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="underline hover:text-emerald-600 font-medium"
                  >
                    Kullanım Koşulları
                  </button>
                  {" ve "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="underline hover:text-emerald-600 font-medium"
                  >
                    Gizlilik Politikası
                  </button>
                  'nı okudum ve kabul ediyorum.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <div className="p-6 pt-0">
          <Button
            onClick={handleCheckout}
            className="w-full"
            disabled={isLoading || !termsAccepted}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Güvenli Ödeme Yap
              </>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>SSL Şifreleme</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Anında Aktivasyon</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>PCI-DSS Uyumlu</span>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}