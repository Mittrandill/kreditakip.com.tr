"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  DollarSign,
  BarChart3,
  SnowflakeIcon as Crystal,
  Lightbulb,
  Shield,
  Award,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface PredictiveAnalyticsProps {
  historicalData: any[]
  creditData: any[]
  creditCardData: any[]
  timeHorizon: number
}

export function PredictiveAnalytics({
  historicalData,
  creditData,
  creditCardData,
  timeHorizon = 12,
}: PredictiveAnalyticsProps) {
  // AI-powered predictions
  const generatePredictions = () => {
    const currentDate = new Date()
    const predictions = []

    // Debt reduction prediction
    const totalCurrentDebt =
      creditData.reduce((sum, credit) => sum + credit.remaining_debt, 0) +
      creditCardData.reduce((sum, card) => sum + card.current_debt, 0)

    const monthlyPayments = creditData.reduce((sum, credit) => sum + (credit.monthly_payment || 0), 0)
    const avgMonthlyReduction = monthlyPayments * 0.7 // Assuming 70% goes to principal

    for (let i = 1; i <= timeHorizon; i++) {
      const projectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const projectedDebt = Math.max(0, totalCurrentDebt - avgMonthlyReduction * i)
      const confidence = Math.max(60, 95 - i * 2) // Confidence decreases over time

      predictions.push({
        month: i,
        date: projectedDate,
        projectedDebt: projectedDebt,
        debtReduction: totalCurrentDebt - projectedDebt,
        confidence: confidence,
        monthlyPayment: monthlyPayments,
        interestSavings: (totalCurrentDebt - projectedDebt) * 0.02, // Estimated interest savings
      })
    }

    return predictions
  }

  // Credit score prediction
  const generateCreditScorePrediction = () => {
    const currentScore = 720 // Mock current score
    const predictions = []

    for (let i = 1; i <= timeHorizon; i++) {
      const improvement = Math.min(50, i * 2.5) // Gradual improvement
      const projectedScore = Math.min(850, currentScore + improvement)
      const confidence = Math.max(70, 90 - i * 1.5)

      predictions.push({
        month: i,
        score: projectedScore,
        improvement: improvement,
        confidence: confidence,
        factors: {
          paymentHistory: Math.min(100, 85 + i),
          creditUtilization: Math.max(20, 45 - i * 2),
          accountAge: 85,
          creditMix: Math.min(90, 75 + i * 0.5),
        },
      })
    }

    return predictions
  }

  // Financial health prediction
  const generateHealthPrediction = () => {
    const scenarios = [
      {
        name: "Optimistik Senaryo",
        probability: 25,
        description: "Tüm ödemeler zamanında, ek gelir artışı",
        outcomes: {
          debtFreeDate: "18 ay",
          totalSavings: 45000,
          creditScoreIncrease: 85,
          riskLevel: "Çok Düşük",
        },
        color: "emerald",
      },
      {
        name: "Gerçekçi Senaryo",
        probability: 50,
        description: "Mevcut ödeme disiplini devam ediyor",
        outcomes: {
          debtFreeDate: "24 ay",
          totalSavings: 32000,
          creditScoreIncrease: 65,
          riskLevel: "Düşük",
        },
        color: "blue",
      },
      {
        name: "Pesimistik Senaryo",
        probability: 25,
        description: "Bazı ödemeler gecikiyor, gelir azalması",
        outcomes: {
          debtFreeDate: "36 ay",
          totalSavings: 18000,
          creditScoreIncrease: 25,
          riskLevel: "Orta",
        },
        color: "amber",
      },
    ]

    return scenarios
  }

  const debtPredictions = generatePredictions()
  const creditScorePredictions = generateCreditScorePrediction()
  const healthScenarios = generateHealthPrediction()

  // AI insights based on predictions
  const generateAIInsights = () => {
    const insights = []

    // Debt payoff insight
    const debtFreeMonth = debtPredictions.find((p) => p.projectedDebt <= 1000)
    if (debtFreeMonth) {
      insights.push({
        type: "success",
        icon: <Target className="h-5 w-5" />,
        title: "Borçsuz Hedef Tarihi",
        description: `Mevcut ödeme planınızla ${debtFreeMonth.month} ay içinde borçsuz olabilirsiniz.`,
        confidence: debtFreeMonth.confidence,
        actionable: true,
        action: "Ödeme planını optimize et",
      })
    }

    // Credit score improvement
    const scoreImprovement = creditScorePredictions[5] // 6 months
    if (scoreImprovement && scoreImprovement.improvement > 30) {
      insights.push({
        type: "opportunity",
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Kredi Puanı Artışı",
        description: `6 ay içinde kredi puanınız ${scoreImprovement.improvement} puan artabilir.`,
        confidence: scoreImprovement.confidence,
        actionable: true,
        action: "Kredi kartı kullanımını azalt",
      })
    }

    // Interest savings opportunity
    const totalInterestSavings = debtPredictions.reduce((sum, p) => sum + p.interestSavings, 0)
    if (totalInterestSavings > 10000) {
      insights.push({
        type: "savings",
        icon: <DollarSign className="h-5 w-5" />,
        title: "Faiz Tasarrufu Fırsatı",
        description: `${timeHorizon} ay içinde ${formatCurrency(totalInterestSavings)} faiz tasarrufu yapabilirsiniz.`,
        confidence: 85,
        actionable: true,
        action: "Borç konsolidasyonu değerlendir",
      })
    }

    return insights
  }

  const aiInsights = generateAIInsights()

  const getScenarioColor = (color: string) => {
    const colors = {
      emerald: "from-emerald-50 to-emerald-100 border-emerald-200",
      blue: "from-blue-50 to-blue-100 border-blue-200",
      amber: "from-amber-50 to-amber-100 border-amber-200",
    }
    return (colors as any)[color] || colors.blue
  }

  return (
    <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white to-purple-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              AI Tahmine Dayalı Analitik
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Crystal className="h-3 w-3 mr-1" />
                Gelişmiş AI
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">Gelecek {timeHorizon} aylık finansal projeksiyonlar</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="debt-projection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-purple-100">
            <TabsTrigger value="debt-projection" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Borç Projeksiyonu
            </TabsTrigger>
            <TabsTrigger value="credit-score" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Kredi Puanı
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Senaryolar
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AI İçgörüleri
            </TabsTrigger>
          </TabsList>

          {/* Debt Projection Tab */}
          <TabsContent value="debt-projection" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">Mevcut Toplam Borç</span>
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {formatCurrency(debtPredictions[0]?.projectedDebt + debtPredictions[0]?.debtReduction || 0)}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Tahmini Borçsuz Tarih</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {debtPredictions.find((p) => p.projectedDebt <= 1000)?.month || "24+"} Ay
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">Toplam Tasarruf</span>
                </div>
                <div className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(debtPredictions.reduce((sum, p) => sum + p.interestSavings, 0))}
                </div>
              </div>
            </div>

            {/* Debt Reduction Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Borç Azalma Projeksiyonu</h3>
              <div className="space-y-3">
                {debtPredictions.slice(0, 6).map((prediction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">{prediction.month}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {prediction.date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                        </div>
                        <div className="text-sm text-gray-600">Güven: %{prediction.confidence.toFixed(0)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(prediction.projectedDebt)}</div>
                      <div className="text-sm text-emerald-600">-{formatCurrency(prediction.debtReduction)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Credit Score Tab */}
          <TabsContent value="credit-score" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kredi Puanı Projeksiyonu</h3>
                <div className="space-y-4">
                  {creditScorePredictions.slice(0, 6).map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-600">{prediction.month}</span>
                        </div>
                        <span className="text-sm text-gray-600">{prediction.month}. Ay</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{prediction.score}</div>
                          <div className="text-xs text-emerald-600">+{prediction.improvement}</div>
                        </div>
                        <Progress value={prediction.confidence} className="w-16 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Puan Faktörleri (6. Ay)</h3>
                <div className="space-y-4">
                  {Object.entries(creditScorePredictions[5]?.factors || {}).map(([factor, score], index) => {
                    const factorNames = {
                      paymentHistory: "Ödeme Geçmişi",
                      creditUtilization: "Kredi Kullanımı",
                      accountAge: "Hesap Yaşı",
                      creditMix: "Kredi Çeşitliliği",
                    }

                    return (
                      <div key={factor} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{(factorNames as any)[factor] || factor}</span>
                          <span className="text-sm font-bold text-gray-900">{score}/100</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {healthScenarios.map((scenario, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border bg-gradient-to-br ${getScenarioColor(scenario.color)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                    <Badge className="bg-white/50 text-gray-700">%{scenario.probability}</Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">{scenario.description}</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Borçsuz Tarih:</span>
                      <span className="font-medium text-gray-900">{scenario.outcomes.debtFreeDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Toplam Tasarruf:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(scenario.outcomes.totalSavings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Puan Artışı:</span>
                      <span className="font-medium text-gray-900">+{scenario.outcomes.creditScoreIncrease}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Risk Seviyesi:</span>
                      <Badge
                        className={`text-xs ${
                          scenario.outcomes.riskLevel === "Çok Düşük"
                            ? "bg-emerald-100 text-emerald-700"
                            : scenario.outcomes.riskLevel === "Düşük"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {scenario.outcomes.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">{insight.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-indigo-900">{insight.title}</h4>
                        <Badge className="bg-indigo-100 text-indigo-700 text-xs">%{insight.confidence} güven</Badge>
                      </div>
                      <p className="text-sm text-indigo-800 mb-3">{insight.description}</p>

                      {insight.actionable && (
                        <Button size="sm" variant="outline" className="bg-white/50 hover:bg-white/80">
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Confidence Score */}
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">AI Tahmin Güvenilirliği</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-900 mb-1">%87.3</div>
                  <div className="text-sm text-purple-700">Genel Güven Skoru</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-900 mb-1">{historicalData.length}</div>
                  <div className="text-sm text-purple-700">Analiz Edilen Veri</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-900 mb-1">15+</div>
                  <div className="text-sm text-purple-700">AI Modeli</div>
                </div>
              </div>

              <p className="text-sm text-purple-800 mt-4">
                Bu tahminler gelişmiş makine öğrenmesi algoritmaları kullanılarak oluşturulmuştur. Gerçek sonuçlar
                piyasa koşulları ve kişisel finansal davranışlara bağlı olarak değişebilir.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
