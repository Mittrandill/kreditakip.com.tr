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
  paddleProductId?: string
  paddlePriceId?: string
}

// Fallback plans in case API fails (same as database defaults)
export const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Ücretsiz kullan, basit özelliklere eriş",
    price: 0,
    period: "monthly",
    periodLabel: "Ücretsiz",
    features: [
      "Temel OCR özellikleri",
      "Manuel kredi takibi",
      "Basit raporlar",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    description: "Aylık 199 TL ile profesyonel özelliklere erişin",
    price: 199,
    period: "monthly",
    periodLabel: "Aylık",
    paddleProductId: "pro_01kcrgadnmnknkz1c32yd50t5t",
    paddlePriceId: "pri_01kcrgqgnatmmafk81qb9skdv2",
    features: [
      "10 adet OCR kredi döküm analizi",
      "5 adet AI Finansal Sağlık Analizi",
      "Gelişmiş raporlar",
      "Reklamsız deneyim",
      "Öncelikli destek",
    ],
  },
  {
    id: "pro-yearly",
    name: "Pro",
    description: "Yıllık öde, %20 tasarruf et",
    price: 1910, // 199 * 12 * 0.8 = 1910.4
    originalPrice: 2388, // 199 * 12
    period: "yearly",
    periodLabel: "Yıllık",
    discount: "%20 İndirim",
    paddleProductId: "pro_01kcrgadnmnknkz1c32yd50t5t",
    paddlePriceId: "pri_01kcrgrk0481d1wgrxw1gspqfq",
    features: [
      "10 adet OCR kredi döküm analizi (aylık)",
      "5 adet AI Finansal Sağlık Analizi (aylık)",
      "Gelişmiş raporlar",
      "Reklamsız deneyim",
      "Öncelikli destek",
      "Yıllık fatura kolaylığı",
    ],
  },
  {
    id: "premium-monthly",
    name: "Premium",
    description: "Aylık 399 TL ile sınırsız özelliklere erişin",
    price: 399,
    period: "monthly",
    periodLabel: "Aylık",
    popular: true,
    paddleProductId: "pro_01kcrga40mwkf0t80drbe06rbd",
    paddlePriceId: "pri_01kcrgn0119qmdrgdy92phf840",
    features: [
      "Sınırsız OCR kredi döküm analizi",
      "Sınırsız AI Finansal Sağlık Analizi",
      "Gelişmiş raporlar",
      "Reklamsız deneyim",
      "Öncelikli destek",
      "Premium badge",
    ],
  },
  {
    id: "premium-yearly",
    name: "Premium",
    description: "Yıllık öde, %20 tasarruf et",
    price: 3830, // 399 * 12 * 0.8 = 3830.4
    originalPrice: 4788, // 399 * 12
    period: "yearly",
    periodLabel: "Yıllık",
    discount: "%20 İndirim",
    popular: true,
    paddleProductId: "pro_01kcrga40mwkf0t80drbe06rbd",
    paddlePriceId: "pri_01kcrgdk1qex8pbyc2g47fv5dg",
    features: [
      "Sınırsız OCR kredi döküm analizi",
      "Sınırsız AI Finansal Sağlık Analizi",
      "Gelişmiş raporlar",
      "Reklamsız deneyim",
      "Öncelikli destek",
      "Premium badge",
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
