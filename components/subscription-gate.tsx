"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Zap, Shield, TrendingUp, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface SubscriptionGateProps {
  feature: string
  onClose?: () => void
}

export function SubscriptionGate({ feature, onClose }: SubscriptionGateProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleUpgrade = () => {
    router.push("/uygulama/premium")
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 to-gray-800 border-emerald-500/20">
        <CardHeader className="relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">Premium</Badge>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Premium Özellik</CardTitle>
          <CardDescription className="text-white/70 text-lg">
            {feature === "risk_analysis"
              ? "Risk analizi özelliği Premium üyelere özeldir"
              : "Bu özellik Premium üyelere özeldir"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-black/20 rounded-lg p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Premium ile Sınırsız Erişim</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Sınırsız OCR Analizi</p>
                  <p className="text-white/60 text-sm">İstediğiniz kadar kredi dökümü analiz edin</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Detaylı Risk Analizi</p>
                  <p className="text-white/60 text-sm">Finansal durumunuzu kapsamlı şekilde analiz edin</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Reklamsız Deneyim</p>
                  <p className="text-white/60 text-sm">Kesintisiz, reklamsız kullanım</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg p-6 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-white">199₺</p>
                <p className="text-white/60 text-sm">Aylık</p>
              </div>
              <Badge className="bg-emerald-500 text-white">%50 İndirim</Badge>
            </div>
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
            >
              Premium'a Geç
            </Button>
          </div>

          <p className="text-white/50 text-sm text-center">
            İstediğiniz zaman iptal edebilirsiniz. Otomatik yenileme yoktur.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
