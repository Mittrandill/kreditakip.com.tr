"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, X, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function UpgradeBanner() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    checkSubscription()
    const dismissed = localStorage.getItem("upgradeBannerDismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setIsVisible(false)
      }
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/status")
      if (response.ok) {
        const data = await response.json()
        setIsPremium(data.isPremium)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("upgradeBannerDismissed", Date.now().toString())
  }

  if (!isVisible || isPremium) return null

  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-white">Premium'a Geçin</p>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm text-white/70">
                Sınırsız analiz, risk değerlendirmesi ve reklamsız deneyim için Premium'a geçin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/uygulama/premium")}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
            >
              Yükselt
            </Button>
            <button onClick={handleDismiss} className="text-white/60 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
