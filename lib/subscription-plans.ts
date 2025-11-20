// Subscription Plan Definitions - Now fetched from database

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
  currency?: string
  billingInterval?: number
}

// Fallback plans in case API fails (same as database defaults)
export const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: "premium-monthly",
    name: "Aylık Premium",
    description: "Aylık ödeme ile premium özelliklere erişin",
    price: 199,
    period: "monthly",
    periodLabel: "Aylık",
    features: [
      "Sınırsız OCR analizi",
      "AI Finansal Sağlık Özeti",
      "Gelişmiş raporlar",
      "Reklamsız deneyim",
      "Öncelikli destek",
    ],
  },
  {
    id: "premium-yearly",
    name: "Yıllık Premium",
    description: "Yıllık öde, 2 ay bedava kazan!",
    price: 1990,
    originalPrice: 2388,
    period: "yearly",
    periodLabel: "Yıllık",
    discount: "%17 İndirim",
    popular: true,
    features: [
      "Sınırsız OCR analizi",
      "AI Finansal Sağlık Özeti",
      "Gelişmiş raporlar",
      "Reklamsız deneyim",
      "Öncelikli destek",
      "2 ay bedava",
      "Yıllık fatura kolaylığı",
    ],
  },
]

// Cache for plans
let plansCache: SubscriptionPlan[] | null = null
let plansCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Fetch plans from API
export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  // Return cached data if available and fresh
  if (plansCache && Date.now() - plansCacheTime < CACHE_DURATION) {
    return plansCache
  }

  try {
    const response = await fetch("/api/subscription/plans", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch plans")
    }

    const data = await response.json()

    if (data.success && data.plans) {
      plansCache = data.plans
      plansCacheTime = Date.now()
      return data.plans
    }

    // Fallback to hardcoded plans
    return FALLBACK_PLANS
  } catch (error) {
    console.error("Error fetching plans:", error)
    // Return fallback plans on error
    return FALLBACK_PLANS
  }
}

// Synchronous version for backwards compatibility (uses cache or fallback)
export const SUBSCRIPTION_PLANS = FALLBACK_PLANS

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return plansCache?.find((plan) => plan.id === planId) || FALLBACK_PLANS.find((plan) => plan.id === planId)
}

export function calculateSavings(yearlyPrice: number, monthlyPrice: number): number {
  return monthlyPrice * 12 - yearlyPrice
}

// Clear cache function (useful for admin updates)
export function clearPlansCache(): void {
  plansCache = null
  plansCacheTime = 0
}
