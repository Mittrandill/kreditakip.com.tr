"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface UsageData {
  subscription: {
    plan_type: "free" | "premium"
    status: string
  }
  usage: {
    ocr_analysis: {
      used_count: number
      limit_count: number
    }
    risk_analysis: {
      used_count: number
      limit_count: number
    }
  }
  isPremium: boolean
}

export function UsageIndicator() {
  const router = useRouter()
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      const response = await fetch("/api/subscription/status")
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error("Error fetching usage data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !usageData) return null

  if (usageData.isPremium) {
    return (
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Premium Üye</p>
                <p className="text-sm text-white/60">Sınırsız erişim</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">Aktif</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ocrUsage = usageData.usage.ocr_analysis
  const ocrPercentage = (ocrUsage.used_count / ocrUsage.limit_count) * 100

  return (
    <Card className="bg-black/20 border-white/10">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Ücretsiz Plan</p>
            <p className="text-sm text-white/60">
              {ocrUsage.used_count} / {ocrUsage.limit_count} analiz kullanıldı
            </p>
          </div>
          <Button
            onClick={() => router.push("/uygulama/premium")}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
          >
            <Crown className="w-4 h-4 mr-2" />
            Yükselt
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">OCR Analizi</span>
            <span className="text-white font-medium">
              {ocrUsage.used_count}/{ocrUsage.limit_count}
            </span>
          </div>
          <Progress value={ocrPercentage} className="h-2" />
        </div>

        {ocrUsage.used_count >= ocrUsage.limit_count && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">Limit Doldu</p>
                <p className="text-xs text-white/60 mt-1">Premium'a geçerek sınırsız analiz yapabilirsiniz</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
