"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Crown, X } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useSubscription } from "@/hooks/use-subscription"

export function FloatingUpgradeBanner() {
  const { subscription, loading, isPremium } = useSubscription()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't show on premium page or if already premium
    if (pathname === "/uygulama/premium" || isPremium || loading) {
      setIsVisible(false)
      return
    }

    // Check if user has dismissed the banner in this session
    const dismissed = sessionStorage.getItem("upgrade-banner-dismissed")
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    // Show banner after 5 seconds for free users
    const timer = setTimeout(() => {
      if (!isPremium && !loading) {
        setIsVisible(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [isPremium, loading, pathname])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    sessionStorage.setItem("upgrade-banner-dismissed", "true")
  }

  const handleUpgrade = () => {
    router.push("/uygulama/premium")
  }

  if (!isVisible || isDismissed || isPremium || loading) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-2xl p-4 text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="p-2 bg-white/20 rounded-lg">
            <Crown className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Premium'a Geçin</h3>
            <p className="text-sm text-emerald-100 mb-3">
              Sınırsız analiz, risk değerlendirmesi ve reklamsız deneyim için Premium üyeliğe geçin
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
              >
                Sadece 199₺/ay
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                className="border-white text-white hover:bg-white/10 hover:text-white hover:border-white bg-transparent"
              >
                Daha Sonra
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
