import { createClient } from "@/lib/supabase/server"

export interface Subscription {
  id: string
  user_id: string
  plan_type: "free" | "premium"
  status: "active" | "cancelled" | "expired"
  started_at: string
  expires_at: string | null
  payment_method: string | null
  iyzico_subscription_id: string | null
}

export interface UsageTracking {
  id: string
  user_id: string
  feature_type: "ocr_analysis" | "risk_analysis"
  used_count: number
  limit_count: number
  reset_at: string
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching subscription:", error)
    return null
  }

  return data
}

export async function getUserUsage(userId: string, featureType: string): Promise<UsageTracking | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", userId)
    .eq("feature_type", featureType)
    .single()

  if (error) {
    console.error("Error fetching usage:", error)
    return null
  }

  return data
}

export async function canUseFeature(userId: string, featureType: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("can_use_feature", {
    p_user_id: userId,
    p_feature_type: featureType,
  })

  if (error) {
    console.error("Error checking feature access:", error)
    return false
  }

  return data
}

export async function incrementUsage(userId: string, featureType: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_feature_type: featureType,
  })

  if (error) {
    console.error("Error incrementing usage:", error)
    return false
  }

  return data
}

export async function upgradeToPremium(
  userId: string,
  iyzicoSubscriptionId: string,
  paymentMethod: string,
): Promise<boolean> {
  const supabase = await createClient()

  // Cancel existing subscriptions
  await supabase.from("subscriptions").update({ status: "cancelled" }).eq("user_id", userId).eq("status", "active")

  // Create premium subscription
  const { error } = await supabase.from("subscriptions").insert({
    user_id: userId,
    plan_type: "premium",
    status: "active",
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    payment_method: paymentMethod,
    iyzico_subscription_id: iyzicoSubscriptionId,
  })

  if (error) {
    console.error("Error upgrading to premium:", error)
    return false
  }

  // Update usage limits to unlimited (high number)
  await supabase
    .from("usage_tracking")
    .update({ limit_count: 999999 })
    .eq("user_id", userId)
    .eq("feature_type", "ocr_analysis")

  await supabase
    .from("usage_tracking")
    .update({ limit_count: 999999 })
    .eq("user_id", userId)
    .eq("feature_type", "risk_analysis")

  return true
}

export async function isPremiumUser(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  return subscription?.plan_type === "premium" && subscription?.status === "active"
}
