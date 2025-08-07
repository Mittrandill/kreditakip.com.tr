import { formatCurrency } from "@/lib/format"

// Trend analizi için yardımcı fonksiyonlar
export interface TrendData {
  value: number
  date: string
  change?: number
  changePercent?: number
  direction?: 'up' | 'down' | 'stable'
}

export interface RiskScore {
  score: number // 0-100
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
  recommendations: string[]
}

export interface PredictionData {
  nextMonth: number
  confidence: number
  factors: string[]
}

// Trend analizi
export function analyzeTrend(data: { value: number; date: string }[]): TrendData[] {
  return data.map((item, index) => {
    if (index === 0) return { ...item }
    
    const previous = data[index - 1]
    const change = item.value - previous.value
    const changePercent = previous.value !== 0 ? (change / previous.value) * 100 : 0
    
    let direction: 'up' | 'down' | 'stable' = 'stable'
    if (Math.abs(changePercent) > 5) {
      direction = changePercent > 0 ? 'up' : 'down'
    }
    
    return {
      ...item,
      change,
      changePercent,
      direction
    }
  })
}

// Risk skorlama algoritması
export function calculateRiskScore(
  totalDebt: number,
  monthlyIncome: number,
  overduePayments: number,
  overdueAmount: number,
  utilizationRate: number,
  paymentHistory: { status: string }[]
): RiskScore {
  let score = 100 // Start with perfect score
  const factors: string[] = []
  const recommendations: string[] = []
  
  // Borç/gelir oranı analizi
  if (monthlyIncome > 0) {
    const debtToIncomeRatio = (totalDebt / (monthlyIncome * 12)) * 100
    if (debtToIncomeRatio > 40) {
      score -= 25
      factors.push(`Yüksek borç/gelir oranı: %${debtToIncomeRatio.toFixed(1)}`)
      recommendations.push('Borç konsolidasyonu düşünün')
    } else if (debtToIncomeRatio > 20) {
      score -= 10
      factors.push(`Orta düzey borç/gelir oranı: %${debtToIncomeRatio.toFixed(1)}`)
    }
  }
  
  // Geciken ödemeler
  if (overduePayments > 0) {
    score -= overduePayments * 15
    factors.push(`${overduePayments} adet geciken ödeme`)
    recommendations.push('Geciken ödemeleri acilen kapatın')
  }
  
  // Geciken tutar
  if (overdueAmount > 0) {
    const overdueRatio = (overdueAmount / totalDebt) * 100
    score -= Math.min(overdueRatio * 2, 30)
    factors.push(`Geciken tutar: ${formatCurrency(overdueAmount)}`)
  }
  
  // Kart kullanım oranı
  if (utilizationRate > 80) {
    score -= 20
    factors.push(`Yüksek kart kullanım oranı: %${utilizationRate.toFixed(1)}`)
    recommendations.push('Kredi kartı kullanımını %70\'in altına düşürün')
  } else if (utilizationRate > 50) {
    score -= 10
    factors.push(`Orta kart kullanım oranı: %${utilizationRate.toFixed(1)}`)
  }
  
  // Ödeme geçmişi analizi
  const recentPayments = paymentHistory.slice(-12) // Son 12 ödeme
  const latePayments = recentPayments.filter(p => p.status === 'overdue').length
  if (latePayments > 3) {
    score -= 20
    factors.push(`Son 12 ayda ${latePayments} geciken ödeme`)
    recommendations.push('Otomatik ödeme talimatı kurun')
  }
  
  // Score'u 0-100 arasında tut
  score = Math.max(0, Math.min(100, score))
  
  // Risk seviyesi belirleme
  let level: RiskScore['level']
  if (score >= 80) level = 'low'
  else if (score >= 60) level = 'medium' 
  else if (score >= 40) level = 'high'
  else level = 'critical'
  
  // Genel öneriler ekle
  if (level === 'critical') {
    recommendations.push('Finansal danışman ile görüşün')
    recommendations.push('Acil eylem planı oluşturun')
  } else if (level === 'high') {
    recommendations.push('Bütçe planlaması yapın')
    recommendations.push('Gereksiz harcamaları kısın')
  } else if (level === 'medium') {
    recommendations.push('Ödeme planınızı gözden geçirin')
  }
  
  return { score, level, factors, recommendations }
}

// Basit tahmin algoritması (gelecek ay borç tahmini)
export function predictNextMonth(
  historicalData: { month: string; amount: number }[],
  seasonalFactors?: number[]
): PredictionData {
  if (historicalData.length < 3) {
    return {
      nextMonth: historicalData[historicalData.length - 1]?.amount || 0,
      confidence: 30,
      factors: ['Yetersiz veri']
    }
  }
  
  // Son 3 ayın ortalaması ile basit trend
  const recent = historicalData.slice(-3)
  const average = recent.reduce((sum, item) => sum + item.amount, 0) / recent.length
  
  // Trend hesaplama
  const firstValue = recent[0].amount
  const lastValue = recent[recent.length - 1].amount
  const trend = (lastValue - firstValue) / recent.length
  
  // Mevsimsel faktör (varsa)
  const currentMonth = new Date().getMonth()
  const seasonalFactor = seasonalFactors?.[currentMonth] || 1
  
  // Tahmin
  const prediction = (average + trend) * seasonalFactor
  
  // Güven seviyesi hesaplama
  const variance = recent.reduce((sum, item) => sum + Math.pow(item.amount - average, 2), 0) / recent.length
  const confidence = Math.max(50, Math.min(95, 100 - (Math.sqrt(variance) / average) * 100))
  
  const factors = [
    `Son 3 ay ortalaması: ${formatCurrency(average)}`,
    `Trend: ${trend > 0 ? 'Artış' : 'Azalış'} eğilimi`,
    `Mevsimsel faktör: ${seasonalFactor > 1 ? 'Yüksek' : 'Normal'} dönem`
  ]
  
  return {
    nextMonth: Math.max(0, prediction),
    confidence: Math.round(confidence),
    factors
  }
}

// Ödeme performansı analizi
export function analyzePaymentPerformance(payments: any[]): {
  onTimeRate: number
  averageDelay: number
  improveungTrend: boolean
  recommendations: string[]
} {
  const paidPayments = payments.filter(p => p.status === 'paid')
  
  let onTimeCount = 0
  let totalDelay = 0
  const recentPerformance: boolean[] = []
  
  paidPayments.forEach((payment, index) => {
    const dueDate = new Date(payment.due_date)
    const paidDate = new Date(payment.payment_date)
    const delay = Math.max(0, Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    if (delay <= 0) {
      onTimeCount++
      recentPerformance.push(true)
    } else {
      totalDelay += delay
      recentPerformance.push(false)
    }
  })
  
  const onTimeRate = paidPayments.length > 0 ? (onTimeCount / paidPayments.length) * 100 : 0
  const averageDelay = (paidPayments.length - onTimeCount) > 0 ? totalDelay / (paidPayments.length - onTimeCount) : 0
  
  // Son 5 ödemenin trendi
  const recent5 = recentPerformance.slice(-5)
  const recent5OnTime = recent5.filter(Boolean).length
  const prev5 = recentPerformance.slice(-10, -5)
  const prev5OnTime = prev5.filter(Boolean).length
  
  const improvingTrend = recent5OnTime > prev5OnTime
  
  const recommendations: string[] = []
  if (onTimeRate < 80) {
    recommendations.push('Otomatik ödeme talimatı kurun')
    recommendations.push('Hatırlatıcı bildirimleri aktifleştirin')
  }
  if (averageDelay > 7) {
    recommendations.push('Ödeme tarihlerini gözden geçirin')
  }
  if (!improvingTrend) {
    recommendations.push('Ödeme alışkanlıklarınızı iyileştirin')
  }
  
  return {
    onTimeRate,
    averageDelay,
    improveungTrend: improvingTrend,
    recommendations
  }
}

// Banka dağılımı risk analizi
export function analyzeBankDistribution(bankDebts: { bank: string; debt: number }[]): {
  concentrationRisk: number
  diversificationScore: number
  recommendations: string[]
} {
  const totalDebt = bankDebts.reduce((sum, bank) => sum + bank.debt, 0)
  
  if (totalDebt === 0) {
    return { concentrationRisk: 0, diversificationScore: 100, recommendations: [] }
  }
  
  // Herfindahl-Hirschman Index (HHI) hesaplama
  const hhi = bankDebts.reduce((sum, bank) => {
    const share = (bank.debt / totalDebt) * 100
    return sum + (share * share)
  }, 0)
  
  const concentrationRisk = Math.min(100, hhi / 100)
  const diversificationScore = Math.max(0, 100 - concentrationRisk)
  
  const recommendations: string[] = []
  
  if (concentrationRisk > 70) {
    recommendations.push('Tek bankaya aşırı bağımlılık riski var')
    recommendations.push('Borçları farklı bankalara dağıtmayı düşünün')
  } else if (concentrationRisk > 50) {
    recommendations.push('Banka dağılımını iyileştirmeye odaklanın')
  }
  
  // En büyük borçlu banka kontrolü
  const maxDebtBank = bankDebts.reduce((max, bank) => bank.debt > max.debt ? bank : max, bankDebts[0])
  const maxDebtRatio = (maxDebtBank.debt / totalDebt) * 100
  
  if (maxDebtRatio > 60) {
    recommendations.push(`${maxDebtBank.bank} bankasındaki borcunuz toplam borcun %${maxDebtRatio.toFixed(0)}'ını oluşturuyor`)
  }
  
  return { concentrationRisk, diversificationScore, recommendations }
}