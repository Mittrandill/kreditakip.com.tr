"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Zap,
  Star,
  Shield,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface PerformanceMetricsProps {
  totalDebt: number
  monthlyPayment: number
  paymentHistory: any[]
  creditUtilization: number
}

export function PerformanceMetrics({
  totalDebt,
  monthlyPayment,
  paymentHistory,
  creditUtilization,
}: PerformanceMetricsProps) {
  // Calculate performance metrics
  const calculateMetrics = () => {
    const paidPayments = paymentHistory.filter((p) => p.status === "paid")
    const onTimePayments = paidPayments.filter(
      (p) => p.payment_date && new Date(p.payment_date) <= new Date(p.due_date),
    )

    const paymentPerformance = paidPayments.length > 0 ? (onTimePayments.length / paidPayments.length) * 100 : 100
    const avgPaymentAmount =
      paidPayments.length > 0 ? paidPayments.reduce((sum, p) => sum + p.total_payment, 0) / paidPayments.length : 0

    // Calculate debt-to-income ratio (estimated)
    const estimatedMonthlyIncome = monthlyPayment * 3.5 // Rough estimate
    const debtToIncomeRatio = estimatedMonthlyIncome > 0 ? (monthlyPayment / estimatedMonthlyIncome) * 100 : 0

    // Calculate credit score impact factors
    const creditScoreFactors = {
      paymentHistory: Math.min(paymentPerformance, 100),
      creditUtilization: Math.max(0, 100 - creditUtilization),
      accountAge: 85, // Mock data
      creditMix: 78, // Mock data
      newCredit: 92, // Mock data
    }

    const overallCreditScore = Object.values(creditScoreFactors).reduce((sum, score) => sum + score, 0) / 5

    return {
      paymentPerformance,
      avgPaymentAmount,
      debtToIncomeRatio,
      creditScoreFactors,
      overallCreditScore,
      totalPayments: paidPayments.length,
      onTimePayments: onTimePayments.length,
    }
  }

  const metrics = calculateMetrics()

  const performanceKPIs = [
    {
      title: "Ödeme Performansı",
      value: metrics.paymentPerformance,
      format: "percentage",
      target: 95,
      icon: <CheckCircle className="h-5 w-5" />,
      color: metrics.paymentPerformance >= 95 ? "emerald" : metrics.paymentPerformance >= 80 ? "amber" : "red",
      trend: { value: 2.3, isPositive: true },
      description: "Zamanında ödeme oranı",
    },
    {
      title: "Kredi Kullanım Oranı",
      value: creditUtilization,
      format: "percentage",
      target: 30,
      icon: <Percent className="h-5 w-5" />,
      color: creditUtilization <= 30 ? "emerald" : creditUtilization <= 70 ? "amber" : "red",
      trend: { value: -5.1, isPositive: true },
      description: "İdeal oran %30'un altında",
    },
    {
      title: "Borç/Gelir Oranı",
      value: metrics.debtToIncomeRatio,
      format: "percentage",
      target: 40,
      icon: <DollarSign className="h-5 w-5" />,
      color: metrics.debtToIncomeRatio <= 40 ? "emerald" : metrics.debtToIncomeRatio <= 60 ? "amber" : "red",
      trend: { value: -1.8, isPositive: true },
      description: "Aylık gelire oranla borç yükü",
    },
    {
      title: "Genel Kredi Puanı",
      value: metrics.overallCreditScore,
      format: "score",
      target: 80,
      icon: <Star className="h-5 w-5" />,
      color: metrics.overallCreditScore >= 80 ? "emerald" : metrics.overallCreditScore >= 60 ? "amber" : "red",
      trend: { value: 4.2, isPositive: true },
      description: "AI hesaplanan kredi puanı",
    },
  ]

  const getKPIColor = (color: string) => {
    const colors = {
      emerald: "from-emerald-50 to-emerald-100 border-emerald-200",
      amber: "from-amber-50 to-amber-100 border-amber-200",
      red: "from-red-50 to-red-100 border-red-200",
    }
    return (colors as any)[color] || colors.amber
  }

  const getKPIIconColor = (color: string) => {
    const colors = {
      emerald: "text-emerald-600 bg-emerald-100",
      amber: "text-amber-600 bg-amber-100",
      red: "text-red-600 bg-red-100",
    }
    return (colors as any)[color] || colors.amber
  }

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "percentage":
        return `%${value.toFixed(1)}`
      case "currency":
        return formatCurrency(value)
      case "score":
        return `${value.toFixed(0)}/100`
      default:
        return value.toString()
    }
  }

  return (
    <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white to-blue-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Performans Metrikleri
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Activity className="h-3 w-3 mr-1" />
                Canlı
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">Finansal performansınızın detaylı analizi</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceKPIs.map((kpi, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border bg-gradient-to-br ${getKPIColor(kpi.color)} hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${getKPIIconColor(kpi.color)}`}>{kpi.icon}</div>
                <div className="flex items-center gap-1">
                  {kpi.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${kpi.trend.isPositive ? "text-emerald-600" : "text-red-600"}`}>
                    {kpi.trend.isPositive ? "+" : ""}
                    {kpi.trend.value.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm">{kpi.title}</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{formatValue(kpi.value, kpi.format)}</span>
                  <span className="text-xs text-gray-500">/ {formatValue(kpi.target, kpi.format)}</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress value={Math.min((kpi.value / kpi.target) * 100, 100)} className="h-2" />
                  <p className="text-xs text-gray-600">{kpi.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credit Score Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Kredi Puanı Faktörleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics.creditScoreFactors).map(([factor, score], index) => {
                const factorNames = {
                  paymentHistory: "Ödeme Geçmişi",
                  creditUtilization: "Kredi Kullanımı",
                  accountAge: "Hesap Yaşı",
                  creditMix: "Kredi Çeşitliliği",
                  newCredit: "Yeni Krediler",
                }

                return (
                  <div key={factor} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{(factorNames as any)[factor] || factor}</span>
                      <span className="text-sm font-bold text-gray-900">{score.toFixed(0)}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Performans Hedefleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium text-gray-900">Ödeme Performansı</span>
                  </div>
                  <Badge
                    className={`${
                      metrics.paymentPerformance >= 95
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {metrics.paymentPerformance >= 95 ? "Hedef Aşıldı" : "İyileştirilebilir"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <Percent className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium text-gray-900">Kredi Kullanımı</span>
                  </div>
                  <Badge
                    className={`${
                      creditUtilization <= 30 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {creditUtilization <= 30 ? "Optimal" : "Azaltılmalı"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium text-gray-900">Borç/Gelir Oranı</span>
                  </div>
                  <Badge
                    className={`${
                      metrics.debtToIncomeRatio <= 40 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {metrics.debtToIncomeRatio <= 40 ? "Sağlıklı" : "Yüksek Risk"}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {metrics.overallCreditScore.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">Genel Performans Skoru</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(metrics.overallCreditScore / 20)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Performans Özeti</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Toplam Ödeme:</span>
                  <div className="text-blue-900 font-bold">{metrics.totalPayments}</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Zamanında Ödeme:</span>
                  <div className="text-blue-900 font-bold">{metrics.onTimePayments}</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Ortalama Tutar:</span>
                  <div className="text-blue-900 font-bold">{formatCurrency(metrics.avgPaymentAmount)}</div>
                </div>
              </div>
              <p className="text-blue-800 mt-3">
                Finansal performansınız genel olarak{" "}
                {metrics.overallCreditScore >= 80
                  ? "mükemmel"
                  : metrics.overallCreditScore >= 60
                    ? "iyi"
                    : "geliştirilmesi gereken"}{" "}
                seviyede.
                {metrics.paymentPerformance >= 95
                  ? " Ödeme disiplininiz örnek teşkil ediyor."
                  : " Ödeme performansınızı artırarak kredi puanınızı yükseltebilirsiniz."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Zap className="h-4 w-4" />
            Performansı Artır
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <PieChart className="h-4 w-4" />
            Detaylı Analiz
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Calendar className="h-4 w-4" />
            Hedef Belirle
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
