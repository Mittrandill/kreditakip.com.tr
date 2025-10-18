// Subscription Plan Definitions

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number // Discount için
  period: "monthly" | "yearly"
  periodLabel: string
  features: string[]
  popular?: boolean
  discount?: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "premium-monthly",
    name: "Aylık Premium",
    description: "Aylık ödeme ile premium özelliklere erişin",
    price: 199,
    period: "monthly",
    periodLabel: "Aylık",
    features: [
      "Sınırsız OCR analizi",
      "Detaylı risk analizi",
      "Gelişmiş raporlar",
      "Şifre yönetimi",
      "Reklamsız deneyim",
      "Öncelikli destek",
    ],
  },
  {
    id: "premium-yearly",
    name: "Yıllık Premium",
    description: "Yıllık öde, 2 ay bedava kazan!",
    price: 1990, // 12 ay için 10 ay ücreti
    originalPrice: 2388, // 199 * 12
    period: "yearly",
    periodLabel: "Yıllık",
    discount: "%17 İndirim",
    popular: true,
    features: [
      "Sınırsız OCR analizi",
      "Detaylı risk analizi",
      "Gelişmiş raporlar",
      "Şifre yönetimi",
      "Reklamsız deneyim",
      "Öncelikli destek",
      "2 ay bedava",
      "Yıllık fatura kolaylığı",
    ],
  },
]

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)
}

export function calculateSavings(yearlyPrice: number, monthlyPrice: number): number {
  return monthlyPrice * 12 - yearlyPrice
}
