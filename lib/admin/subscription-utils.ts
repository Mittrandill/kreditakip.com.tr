import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Plan tipine göre abonelik limitlerini döndürür
 */
export function getSubscriptionLimits(planType: string) {
  const limits = {
    free: {
      ocr_limit: -1, // unlimited for statistics
      risk_analysis_limit: 0,
      saved_credits_limit: 1,
    },
    pro: {
      ocr_limit: 10,
      risk_analysis_limit: 5,
      saved_credits_limit: 10,
    },
    premium: {
      ocr_limit: 999999,
      risk_analysis_limit: 999999,
      saved_credits_limit: 999999,
    },
  }

  return limits[planType as keyof typeof limits] || limits.free
}

/**
 * Plan ID'den plan tipini çıkarır
 * Örn: "pro-monthly" → "pro"
 */
export function getPlanTypeFromPlanId(planId: string): string {
  if (planId.startsWith("premium")) return "premium"
  if (planId.startsWith("pro")) return "pro"
  return "free"
}

/**
 * Subscription usage kayıtları oluşturur (OCR ve Risk Analysis için)
 */
export async function createSubscriptionUsage(
  supabase: SupabaseClient,
  userId: string,
  planType: string,
  subscriptionId: string
) {
  const limits = getSubscriptionLimits(planType)
  const resetAt = new Date()
  resetAt.setDate(resetAt.getDate() + 30) // 30 günlük reset period

  // OCR usage
  const { error: ocrError } = await supabase.from("subscription_usage").insert({
    user_id: userId,
    subscription_id: subscriptionId,
    feature_type: "ocr_analysis",
    usage_count: 0,
    usage_limit: limits.ocr_limit,
    reset_at: resetAt.toISOString(),
  })

  if (ocrError) {
    console.error("Error creating OCR usage:", ocrError)
    throw ocrError
  }

  // Risk Analysis usage
  const { error: riskError } = await supabase.from("subscription_usage").insert({
    user_id: userId,
    subscription_id: subscriptionId,
    feature_type: "risk_analysis",
    usage_count: 0,
    usage_limit: limits.risk_analysis_limit,
    reset_at: resetAt.toISOString(),
  })

  if (riskError) {
    console.error("Error creating Risk Analysis usage:", riskError)
    throw riskError
  }

  // Saved Credits usage
  const { error: savedError } = await supabase.from("subscription_usage").insert({
    user_id: userId,
    subscription_id: subscriptionId,
    feature_type: "saved_credits",
    usage_count: 0,
    usage_limit: limits.saved_credits_limit,
    reset_at: resetAt.toISOString(),
  })

  if (savedError) {
    console.error("Error creating Saved Credits usage:", savedError)
    throw savedError
  }
}

/**
 * Abonelik verilerini validate eder
 */
export function validateSubscriptionData(data: {
  userId?: string
  planId?: string
  expiresAt?: string
  status?: string
}): { valid: boolean; error?: string } {
  // User ID kontrolü
  if (data.userId && (!data.userId || data.userId.trim().length === 0)) {
    return { valid: false, error: "Kullanıcı ID gerekli" }
  }

  // Plan ID kontrolü
  if (data.planId && (!data.planId || data.planId.trim().length === 0)) {
    return { valid: false, error: "Plan ID gerekli" }
  }

  // Tarih kontrolü
  if (data.expiresAt) {
    const expiresDate = new Date(data.expiresAt)
    const now = new Date()

    if (isNaN(expiresDate.getTime())) {
      return { valid: false, error: "Geçersiz tarih formatı" }
    }

    // Geçmiş tarih kontrolü - sadece uyarı, hata değil (expired subscription'ları uzatmak için gerekli)
    if (expiresDate < now) {
      console.warn("Warning: Expires date is in the past")
    }
  }

  // Status kontrolü
  if (data.status) {
    const validStatuses = [
      "active",
      "cancelled",
      "canceled",
      "expired",
      "suspended",
      "past_due",
      "paused",
      "trialing",
    ]
    if (!validStatuses.includes(data.status)) {
      return { valid: false, error: `Geçersiz durum: ${data.status}` }
    }
  }

  return { valid: true }
}

/**
 * Kullanıcının mevcut aktif aboneliğini soft-delete yapar
 */
export async function softDeleteActiveSubscription(
  supabase: SupabaseClient,
  userId: string
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      deleted_at: new Date().toISOString(),
      status: "cancelled",
    })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("status", "active")

  if (error) {
    console.error("Error soft-deleting active subscription:", error)
    throw error
  }
}
