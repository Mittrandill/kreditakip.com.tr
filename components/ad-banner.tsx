"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdBannerProps {
  position?: "top" | "bottom" | "sidebar"
  className?: string
}

export function AdBanner({ position = "top", className = "" }: AdBannerProps) {
  const router = useRouter()
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSubscription()
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
    } finally {
      setLoading(false)
    }
  }

  if (loading || isPremium) return null

  const ads = [
    {
      title: "Finansal Özgürlüğünüze Yatırım Yapın",
      description: "Premium üyelikle sınırsız analiz ve reklamsız deneyim",
      cta: "Premium'a Geç",
      action: () => router.push("/uygulama/premium"),
      bgGradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Risk Analizi ile Geleceğinizi Planlayın",
      description: "Detaylı finansal analiz ve öneriler için Premium'a geçin",
      cta: "Hemen Başla",
      action: () => router.push("/uygulama/premium"),
      bgGradient: "from-blue-500 to-indigo-500",
    },
    {
      title: "Sınırsız OCR Analizi",
      description: "İstediğiniz kadar kredi dökümü analiz edin",
      cta: "Yükselt",
      action: () => router.push("/uygulama/premium"),
      bgGradient: "from-purple-500 to-pink-500",
    },
  ]

  const randomAd = ads[Math.floor(Math.random() * ads.length)]

  return (
    <Card className={`bg-gradient-to-r ${randomAd.bgGradient} border-0 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm mb-1">{randomAd.title}</p>
              <p className="text-xs text-white/80">{randomAd.description}</p>
            </div>
          </div>
          <Button
            onClick={randomAd.action}
            size="sm"
            className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
          >
            {randomAd.cta}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
