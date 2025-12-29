"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Sparkles, ArrowRight, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSubscriptionV2 } from "@/hooks/use-subscription-v2"
import Link from "next/link"
import confetti from "canvas-confetti"
import { LoadingSpinner } from "@/components/loading-screen"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { subscription, loading } = useSubscriptionV2()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Confetti efekti
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
      })
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
      })
    }, 250)

    // İçeriği göster
    setTimeout(() => setShowContent(true), 500)

    return () => clearInterval(interval)
  }, [])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50 dark:bg-black/20">
      <div className="min-h-screen flex items-center justify-center p-4 py-12">
        <div
          className={`max-w-2xl w-full space-y-8 transition-all duration-1000 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-full">
              <CheckCircle2 className="h-24 w-24 text-white" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Tebrikler! 🎉
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-white/70">
            {subscription?.planType === "pro"
              ? "Pro"
              : subscription?.planType === "premium"
              ? "Premium"
              : ""} üyeliğiniz başarıyla aktif edildi
          </p>
        </div>

        {/* Subscription Details */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Abonelik Detayları
            </CardTitle>
            <CardDescription>
              {subscription?.planType === "pro" ? "Pro" : "Premium"} üyelik bilgileriniz
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-white/60">Plan</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {subscription?.planId === "pro-monthly"
                    ? "Pro Aylık"
                    : subscription?.planId === "pro-yearly"
                      ? "Pro Yıllık"
                      : subscription?.planId === "premium-monthly"
                        ? "Premium Aylık"
                        : subscription?.planId === "premium-yearly"
                          ? "Premium Yıllık"
                          : "Free"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-white/60">Durum</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">Aktif</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-white/60">Başlangıç</p>
                <p className="font-medium">
                  {subscription?.startDate
                    ? new Date(subscription.startDate).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-white/60">Bitiş</p>
                <p className="font-medium">
                  {subscription?.expiresAt
                    ? new Date(subscription.expiresAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>
                  {subscription?.planType === "pro"
                    ? "Artık Pro özelliklere erişiminiz var! 10 OCR analizi, 5 AI Finansal Sağlık Özeti ve daha fazlası sizleri bekliyor."
                    : "Artık tüm premium özelliklere sınırsız erişiminiz var! Sınırsız OCR analizi, AI Finansal Sağlık Özeti ve daha fazlası sizleri bekliyor."}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/uygulama/ana-sayfa" className="block">
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all" size="lg">
              Ana Sayfaya Dön
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <Link href="/uygulama/premium" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Üyelik Bilgilerim
            </Button>
          </Link>
        </div>

        {/* Features Preview */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Şimdi Neler Yapabilirsiniz?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Sınırsız sayıda kredi döküm analizi yapın",
                "Detaylı finansal risk analizleri oluşturun",
                "Gelişmiş raporlara ve önerilere erişin",
                "Hassas bilgilerinizi güvenle şifreleyin",
                "Reklamsız, kesintisiz bir deneyim yaşayın",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-blue-900 dark:text-blue-100">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
