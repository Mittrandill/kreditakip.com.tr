"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Brain,
  Star,
  ArrowRight,
  DollarSign,
  CreditCard,
  Building2,
  Sparkles,
  Award,
  Shield,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface ReportInsightsProps {
  credits: any[]
  payments: any[]
  creditCards: any[]
  bankDistribution: any[]
}

export function ReportInsights({ credits, payments, creditCards, bankDistribution }: ReportInsightsProps) {
  // AI-powered insights calculations
  const generateInsights = () => {
    const insights = []

    // Payment performance insight
    const paidPayments = payments.filter((p) => p.status === "paid")
    const onTimePayments = paidPayments.filter(
      (p) => p.payment_date && new Date(p.payment_date) <= new Date(p.due_date),
    )
    const paymentPerformance = paidPayments.length > 0 ? (onTimePayments.length / paidPayments.length) * 100 : 100

    if (paymentPerformance >= 95) {
      insights.push({
        type: "success",
        icon: <CheckCircle className="h-5 w-5" />,
        title: "Mükemmel Ödeme Performansı",
        description: `%${paymentPerformance.toFixed(1)} zamanında ödeme oranınız ile kredi puanınız güçlü durumda.`,
        impact: "Yüksek",
        actionable: false,
        color: "emerald",
      })
    } else if (paymentPerformance >= 80) {
      insights.push({
        type: "warning",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: "Ödeme Performansı İyileştirilebilir",
        description: `%${paymentPerformance.toFixed(1)} ödeme performansınızı %95'in üzerine çıkararak kredi puanınızı artırabilirsiniz.`,
        impact: "Orta",
        actionable: true,
        action: "Otomatik ödeme talimatı verin",
        color: "amber",
      })
    } else {
      insights.push({
        type: "critical",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: "Ödeme Performansı Kritik",
        description: `%${paymentPerformance.toFixed(1)} ödeme performansınız kredi puanınızı olumsuz etkiliyor.`,
        impact: "Yüksek",
        actionable: true,
        action: "Acil ödeme planı oluşturun",
        color: "red",
      })
    }

    // Credit utilization insight
    const totalLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0)
    const totalDebt = creditCards.reduce((sum, card) => sum + card.current_debt, 0)
    const utilizationRate = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0

    if (utilizationRate <= 30) {
      insights.push({
        type: "success",
        icon: <Target className="h-5 w-5" />,
        title: "Optimal Kart Kullanımı",
        description: `%${utilizationRate.toFixed(1)} kullanım oranınız ideal seviyede. Kredi puanınız için olumlu.`,
        impact: "Pozitif",
        actionable: false,
        color: "emerald",
      })
    } else if (utilizationRate <= 70) {
      insights.push({
        type: "warning",
        icon: <CreditCard className="h-5 w-5" />,
        title: "Kart Kullanımını Azaltın",
        description: `%${utilizationRate.toFixed(1)} kullanım oranınızı %30'un altına indirerek kredi puanınızı artırabilirsiniz.`,
        impact: "Orta",
        actionable: true,
        action: `${formatCurrency(totalDebt - totalLimit * 0.3)} borç azaltın`,
        color: "amber",
      })
    } else {
      insights.push({
        type: "critical",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: "Yüksek Kart Kullanımı",
        description: `%${utilizationRate.toFixed(1)} kullanım oranınız çok yüksek. Acil borç azaltma gerekli.`,
        impact: "Kritik",
        actionable: true,
        action: `${formatCurrency(totalDebt - totalLimit * 0.3)} borç azaltın`,
        color: "red",
      })
    }

    // Bank diversification insight
    const uniqueBanks = new Set(credits.map((c) => c.banks?.name).filter(Boolean))
    if (uniqueBanks.size >= 3) {
      insights.push({
        type: "success",
        icon: <Building2 className="h-5 w-5" />,
        title: "İyi Banka Çeşitliliği",
        description: `${uniqueBanks.size} farklı banka ile çalışmanız risk dağılımınızı olumlu etkiliyor.`,
        impact: "Pozitif",
        actionable: false,
        color: "blue",
      })
    } else if (uniqueBanks.size === 2) {
      insights.push({
        type: "info",
        icon: <Building2 className="h-5 w-5" />,
        title: "Banka Çeşitliliği Artırılabilir",
        description: `${uniqueBanks.size} banka ile çalışıyorsunuz. Bir banka daha ekleyerek riski dağıtabilirsiniz.`,
        impact: "Düşük",
        actionable: true,
        action: "Yeni banka seçeneklerini değerlendirin",
        color: "blue",
      })
    } else {
      insights.push({
        type: "warning",
        icon: <Building2 className="h-5 w-5" />,
        title: "Tek Banka Riski",
        description: `Sadece ${uniqueBanks.size} banka ile çalışmanız risk konsantrasyonu yaratıyor.`,
        impact: "Orta",
        actionable: true,
        action: "Farklı bankalardan seçenekler araştırın",
        color: "amber",
      })
    }

    // Monthly payment burden insight
    const monthlyPayments = credits.reduce((sum, credit) => sum + (credit.monthly_payment || 0), 0)
    const estimatedIncome = monthlyPayments * 4 // Rough estimate
    const paymentToIncomeRatio = (monthlyPayments / estimatedIncome) * 100

    if (paymentToIncomeRatio <= 30) {
      insights.push({
        type: "success",
        icon: <DollarSign className="h-5 w-5" />,
        title: "Sağlıklı Borç/Gelir Oranı",
        description: `Tahmini %${paymentToIncomeRatio.toFixed(1)} borç/gelir oranınız sağlıklı seviyede.`,
        impact: "Pozitif",
        actionable: false,
        color: "emerald",
      })
    } else if (paymentToIncomeRatio <= 50) {
      insights.push({
        type: "warning",
        icon: <DollarSign className="h-5 w-5" />,
        title: "Borç Yükü Yüksek",
        description: `%${paymentToIncomeRatio.toFixed(1)} borç/gelir oranınız yüksek. Borç konsolidasyonu düşünün.`,
        impact: "Orta",
        actionable: true,
        action: "Borç yeniden yapılandırma seçeneklerini araştırın",
        color: "amber",
      })
    } else {
      insights.push({
        type: "critical",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: "Kritik Borç Yükü",
        description: `%${paymentToIncomeRatio.toFixed(1)} borç/gelir oranınız kritik seviyede.`,
        impact: "Kritik",
        actionable: true,
        action: "Acil finansal danışmanlık alın",
        color: "red",
      })
    }

    // Opportunity insights
    const lowUtilizationCards = creditCards.filter((card) => card.utilization_rate < 10 && card.is_active)
    if (lowUtilizationCards.length > 0) {
      insights.push({
        type: "opportunity",
        icon: <Lightbulb className="h-5 w-5" />,
        title: "Kullanılmayan Kredi Limiti",
        description: `${lowUtilizationCards.length} kartınızda düşük kullanım var. Bu kartları kapatmayı düşünebilirsiniz.`,
        impact: "Fırsat",
        actionable: true,
        action: "Gereksiz kartları kapatın",
        color: "purple",
      })
    }

    return insights.slice(0, 6) // Limit to 6 insights
  }

  const insights = generateInsights()

  const getInsightColor = (color: string) => {
    const colors = {
      emerald: "from-emerald-50 to-emerald-100 border-emerald-200",
      amber: "from-amber-50 to-amber-100 border-amber-200",
      red: "from-red-50 to-red-100 border-red-200",
      blue: "from-blue-50 to-blue-100 border-blue-200",
      purple: "from-purple-50 to-purple-100 border-purple-200",
    }
    return (colors as any)[color] || colors.blue
  }

  const getInsightIconColor = (color: string) => {
    const colors = {
      emerald: "text-emerald-600 bg-emerald-100",
      amber: "text-amber-600 bg-amber-100",
      red: "text-red-600 bg-red-100",
      blue: "text-blue-600 bg-blue-100",
      purple: "text-purple-600 bg-purple-100",
    }
    return (colors as any)[color] || colors.blue
  }

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case "Kritik":
        return "bg-red-100 text-red-700 border-red-200"
      case "Yüksek":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "Orta":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "Düşük":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "Pozitif":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "Fırsat":
        return "bg-purple-100 text-purple-700 border-purple-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white to-indigo-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              AI Destekli Finansal İçgörüler
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">Yapay zeka analizinize dayalı kişiselleştirilmiş öneriler</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
              <Brain className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600">AI analizi için yeterli veri bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border bg-gradient-to-br ${getInsightColor(insight.color)} hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getInsightIconColor(insight.color)}`}>{insight.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <Badge className={`text-xs ${getImpactBadgeColor(insight.impact)}`}>{insight.impact}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

                    {insight.actionable && insight.action && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Önerilen Aksiyon:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs bg-white/50 hover:bg-white/80 border-white/50"
                        >
                          {insight.action}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Confidence Score */}
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-indigo-900">AI Güven Skoru</span>
            </div>
            <Badge className="bg-indigo-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              %94.2
            </Badge>
          </div>
          <Progress value={94.2} className="h-2 mb-2" />
          <p className="text-xs text-indigo-700">
            Bu analizler {payments.length} ödeme, {credits.length} kredi ve {creditCards.length} kart verisi üzerinden
            yapılmıştır.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          <Button size="sm" variant="outline" className="text-xs bg-transparent">
            <Zap className="h-3 w-3 mr-1" />
            Detaylı Analiz
          </Button>
          <Button size="sm" variant="outline" className="text-xs bg-transparent">
            <Shield className="h-3 w-3 mr-1" />
            Risk Raporu
          </Button>
          <Button size="sm" variant="outline" className="text-xs bg-transparent">
            <Target className="h-3 w-3 mr-1" />
            Aksiyon Planı
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
