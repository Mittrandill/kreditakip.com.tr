"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Zap, Shield, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdSidebar() {
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

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-emerald-500/20">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-white text-lg">Premium'a Geçin</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">Sınırsız OCR analizi</p>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">Detaylı risk analizi</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">Reklamsız deneyim</p>
          </div>
        </div>

        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-white">199₺</span>
            <span className="text-white/60 text-sm">/ay</span>
          </div>
          <p className="text-white/60 text-xs">İlk ay %50 indirimli</p>
        </div>

        <Button
          onClick={() => router.push("/uygulama/premium")}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600"
        >
          Hemen Başla
        </Button>
      </CardContent>
    </Card>
  )
}
