"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Zap, Shield, TrendingUp, Check, X, Sparkles, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PremiumPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscription/status")
      if (response.ok) {
        const data = await response.json()
        setIsPremium(data.isPremium)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Payment initialization failed")
      }

      const data = await response.json()

      if (data.checkoutFormContent) {
        const paymentContainer = document.createElement("div")
        paymentContainer.innerHTML = data.checkoutFormContent
        document.body.appendChild(paymentContainer)

        const script = paymentContainer.querySelector("script")
        if (script) {
          const newScript = document.createElement("script")
          newScript.textContent = script.textContent
          document.body.appendChild(newScript)
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Ödeme başlatılırken bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[#151515] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-[#151515] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-white">Premium Üyesiniz</CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Tüm özelliklere sınırsız erişiminiz var
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <p className="font-semibold text-white">Sınırsız OCR Analizi</p>
                  </div>
                  <p className="text-white/60 text-sm">Aktif</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <p className="font-semibold text-white">Risk Analizi</p>
                  </div>
                  <p className="text-white/60 text-sm">Aktif</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <p className="font-semibold text-white">Reklamsız</p>
                  </div>
                  <p className="text-white/60 text-sm">Aktif</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <p className="font-semibold text-white">Öncelikli Destek</p>
                  </div>
                  <p className="text-white/60 text-sm">Aktif</p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/uygulama/ana-sayfa")}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
              >
                Ana Sayfaya Dön
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#151515] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-6">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-white/80 text-sm font-medium">Premium Üyelik</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Finansal Özgürlüğünüze <span className="text-emerald-400">Yatırım Yapın</span>
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Premium üyelikle tüm özelliklere sınırsız erişim kazanın ve finansal hedeflerinize daha hızlı ulaşın
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-emerald-500/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-sm px-4 py-1">
                  En Popüler
                </Badge>
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">50% İndirim</Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-white">Premium Üyelik</CardTitle>
              <CardDescription className="text-white/70 text-lg">Tüm özelliklere sınırsız erişim</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">199₺</span>
                <span className="text-white/60 text-lg">/ay</span>
                <span className="text-white/40 line-through text-lg ml-2">399₺</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white">Sınırsız OCR Analizi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white">Detaylı Risk Analizi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white">Reklamsız Deneyim</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white">Öncelikli Müşteri Desteği</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white">Gelişmiş Raporlama</span>
                </div>
              </div>

              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-6 text-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Premium'a Geç
                  </>
                )}
              </Button>

              <p className="text-white/50 text-sm text-center">Güvenli ödeme ile iyzico altyapısı kullanılmaktadır</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Ücretsiz vs Premium</h2>
          <Card className="bg-black/20 border-white/10">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-6 text-white/70">Özellik</th>
                      <th className="text-center p-6 text-white/70">Ücretsiz</th>
                      <th className="text-center p-6 text-white/70">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                          Premium
                        </Badge>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="p-6 text-white">OCR Analizi</td>
                      <td className="p-6 text-center text-white/60">1 adet</td>
                      <td className="p-6 text-center">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Sınırsız</Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="p-6 text-white">Risk Analizi</td>
                      <td className="p-6 text-center">
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="p-6 text-white">Kredi Yönetimi</td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="p-6 text-white">Ödeme Takibi</td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="p-6 text-white">Reklamlar</td>
                      <td className="p-6 text-center text-white/60">Var</td>
                      <td className="p-6 text-center">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Yok</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-6 text-white">Müşteri Desteği</td>
                      <td className="p-6 text-center text-white/60">Standart</td>
                      <td className="p-6 text-center">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Öncelikli</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            <Card className="bg-black/20 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Ödeme güvenli mi?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Evet, tüm ödemeler iyzico güvenli ödeme altyapısı üzerinden gerçekleştirilir. Kredi kartı bilgileriniz
                  şifrelenir ve güvenli bir şekilde saklanır.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">İstediğim zaman iptal edebilir miyim?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Evet, Premium üyeliğinizi istediğiniz zaman iptal edebilirsiniz. İptal sonrası mevcut dönem sonuna
                  kadar Premium özelliklerden yararlanmaya devam edersiniz.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Otomatik yenileme var mı?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Hayır, otomatik yenileme yoktur. Her ay manuel olarak ödeme yapmanız gerekmektedir.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
