"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, CheckCircle, Loader2, X } from "lucide-react"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      processPayment(token)
    } else {
      setProcessing(false)
    }
  }, [searchParams])

  const processPayment = async (token: string) => {
    try {
      const response = await fetch("/api/payment/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        setSuccess(false)
      }
    } catch (error) {
      console.error("Payment processing error:", error)
      setSuccess(false)
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-[#151515] flex items-center justify-center">
        <Card className="bg-black/20 border-white/10 max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Ödemeniz işleniyor...</p>
            <p className="text-white/60 text-sm mt-2">Lütfen bekleyin</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#151515] flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">Ödeme Başarılı!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="bg-black/20 rounded-lg p-6 border border-white/10">
              <Crown className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-lg mb-2">Premium Üyeliğiniz Aktif</p>
              <p className="text-white/70 text-sm">Artık tüm özelliklere sınırsız erişiminiz var</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/uygulama/ana-sayfa")}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
              >
                Ana Sayfaya Git
              </Button>
              <Button
                onClick={() => router.push("/uygulama/premium")}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Premium Sayfasını Görüntüle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#151515] flex items-center justify-center p-4">
      <Card className="bg-black/20 border-red-500/30 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Ödeme Başarısız</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-white/70">Ödemeniz işlenirken bir hata oluştu. Lütfen tekrar deneyin.</p>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/uygulama/premium")}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
            >
              Tekrar Dene
            </Button>
            <Button
              onClick={() => router.push("/uygulama/ana-sayfa")}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Ana Sayfaya Dön
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
