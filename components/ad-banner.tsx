"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/use-subscription"

interface AdBannerProps {
  position?: "top" | "bottom" | "sidebar"
  className?: string
}

export function AdBanner({ position = "top", className = "" }: AdBannerProps) {
  const { isPremium, loading } = useSubscription()
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()

  // Don't show ads for premium users
  if (loading || isPremium) {
    return null
  }

  if (isDismissed) {
    return null
  }

  const handleUpgrade = () => {
    router.push("/uygulama/premium")
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <Card
      className={`relative overflow-hidden border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 ${className}`}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-full transition-colors z-10"
        aria-label="Reklamı kapat"
      >
        <X className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      </button>

      <div className="p-4 flex items-center gap-4">
        <div className="flex-shrink-0 p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
          <Crown className="h-8 w-8 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100 mb-1">
            Reklamsız Deneyim İçin Premium'a Geçin
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Sınırsız analiz, risk değerlendirmesi ve reklamsız kullanım. Sadece 199₺/ay
          </p>
        </div>

        <Button
          onClick={handleUpgrade}
          className="flex-shrink-0 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
        >
          <Crown className="h-4 w-4 mr-2" />
          Premium'a Geç
        </Button>
      </div>
    </Card>
  )
}

export function AdSidebar({ className = "" }: { className?: string }) {
  const { isPremium, loading } = useSubscription()
  const router = useRouter()

  if (loading || isPremium) {
    return null
  }

  const handleUpgrade = () => {
    router.push("/uygulama/premium")
  }

  return (
    <Card
      className={`overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 ${className}`}
    >
      <div className="p-6 text-center space-y-4">
        <div className="mx-auto p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full w-fit">
          <Crown className="h-12 w-12 text-white" />
        </div>

        <div>
          <h3 className="font-bold text-xl text-purple-900 dark:text-purple-100 mb-2">Premium Üyelik</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">Tüm özelliklere sınırsız erişim</p>
        </div>

        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></div>
            <span>Sınırsız OCR analizi</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></div>
            <span>Detaylı risk analizi</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></div>
            <span>Reklamsız deneyim</span>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
            199₺<span className="text-base font-normal text-purple-700 dark:text-purple-300">/ay</span>
          </p>
        </div>

        <Button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          size="lg"
        >
          <Crown className="h-5 w-5 mr-2" />
          Hemen Başla
        </Button>
      </div>
    </Card>
  )
}
