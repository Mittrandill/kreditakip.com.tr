import { type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyShopierOSB, decodeShopierPayload, getPlanIdFromProductId } from "@/lib/shopier-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const PLAN_LIMITS: Record<string, { ocr: number; risk: number }> = {
  "pro-monthly":  { ocr: 10,     risk: 5 },
  "pro-yearly":   { ocr: 10,     risk: 5 },
  "premium-monthly": { ocr: 999999, risk: 999999 },
  "premium-yearly":  { ocr: 999999, risk: 999999 },
}

function getPlanType(planId: string): "pro" | "premium" {
  return planId.startsWith("premium") ? "premium" : "pro"
}

/**
 * POST /api/shopier/osb
 *
 * Shopier Otomatik Sipariş Bildirimi (OSB) handler.
 * Shopier sends: [{value: "<base64 JSON>"}, {value: "<HMAC-SHA256 hash>"}]
 * Must respond with HTTP 200 body "success".
 */
export async function POST(request: NextRequest) {
  let body: Array<{ value: string }> | null = null

  try {
    const text = await request.text()
    body = JSON.parse(text)
  } catch {
    console.error("[Shopier OSB] Failed to parse body")
    return new Response("success", { status: 200 })
  }

  if (!Array.isArray(body) || !body[0]?.value || !body[1]?.value) {
    console.error("[Shopier OSB] Invalid body structure")
    return new Response("success", { status: 200 })
  }

  const encodedPayload = body[0].value
  const receivedHash = body[1].value

  // Signature verification
  if (!verifyShopierOSB(encodedPayload, receivedHash)) {
    console.error("[Shopier OSB] Invalid signature — possible fraud attempt")
    return new Response("success", { status: 200 })
  }

  let payload
  try {
    payload = decodeShopierPayload(encodedPayload)
  } catch {
    console.error("[Shopier OSB] Failed to decode payload")
    return new Response("success", { status: 200 })
  }

  // Skip test orders in production
  if (payload.istest && process.env.NODE_ENV === "production") {
    console.log("[Shopier OSB] Test order received, skipping in production")
    return new Response("success", { status: 200 })
  }

  // Use untyped client since shopier_unmatched_orders is a new table not yet in generated types
  const supabase: any = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    await processOrder(supabase, payload)
  } catch (err) {
    console.error("[Shopier OSB] Error processing order:", err)
  }

  return new Response("success", { status: 200 })
}

async function processOrder(supabase: any, payload: ReturnType<typeof decodeShopierPayload>) {
  const { email, orderid, price, productid } = payload

  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("shopier_order_id", orderid)
    .maybeSingle()

  if (existing) {
    console.log("[Shopier OSB] Order already processed:", orderid)
    return
  }

  // Map product to plan
  const planId = getPlanIdFromProductId(productid)
  if (!planId) {
    console.error("[Shopier OSB] Unknown product ID:", productid)
    return
  }

  // Find user by email
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    console.error("[Shopier OSB] Failed to list users:", usersError)
    return
  }

  const user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error("[Shopier OSB] No user found for email:", email, "order:", orderid)
    // Log for manual handling
    await supabase.from("shopier_unmatched_orders").insert({
      order_id: orderid,
      buyer_email: email,
      product_id: productid,
      plan_id: planId,
      amount: parseFloat(price),
      raw_payload: payload,
    }).catch(() => {}) // table may not exist yet, non-fatal
    return
  }

  const userId = user.id

  // Calculate dates
  const startDate = new Date()
  const expiresAt = new Date(startDate)
  if (planId.includes("yearly")) {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  }

  const nextReminderDate = new Date(expiresAt)
  nextReminderDate.setDate(nextReminderDate.getDate() - 7)

  // Cancel existing active subscriptions
  await supabase
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString(), deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])

  // Create new subscription
  const { data: newSub, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_id: planId,
      plan_type: getPlanType(planId),
      status: "active",
      start_date: startDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_provider: "shopier",
      shopier_order_id: orderid,
      last_renewal_date: startDate.toISOString(),
      next_renewal_reminder_date: nextReminderDate.toISOString(),
    })
    .select()
    .single()

  if (subError || !newSub) {
    console.error("[Shopier OSB] Failed to create subscription:", subError)
    return
  }

  // Initialize usage tracking
  const limits = PLAN_LIMITS[planId] ?? { ocr: 1, risk: 0 }
  const resetAt = new Date()
  resetAt.setDate(resetAt.getDate() + 30)

  await supabase.from("subscription_usage").delete().eq("user_id", userId)
  await supabase.from("subscription_usage").insert([
    {
      user_id: userId,
      subscription_id: newSub.id,
      feature_type: "ocr_analysis",
      usage_count: 0,
      limit_count: limits.ocr,
      saved_credits_count: 0,
      saved_credits_limit: limits.ocr,
      reset_at: resetAt.toISOString(),
    },
    {
      user_id: userId,
      subscription_id: newSub.id,
      feature_type: "risk_analysis",
      usage_count: 0,
      limit_count: limits.risk,
      saved_credits_count: 0,
      saved_credits_limit: 0,
      reset_at: resetAt.toISOString(),
    },
  ])

  // Create invoice
  await supabase.from("invoices").insert({
    user_id: userId,
    subscription_id: newSub.id,
    invoice_number: `INV-${Date.now()}-${orderid.slice(-6)}`,
    invoice_date: new Date().toISOString().split("T")[0],
    amount: parseFloat(price),
    currency: "TRY",
    status: "preparing",
    payment_id: orderid,
    payment_provider: "shopier",
    shopier_order_id: orderid,
    description: `${planId} - Yeni Abonelik`,
  })

  // Create payment transaction
  await supabase.from("payment_transactions").insert({
    user_id: userId,
    subscription_id: newSub.id,
    amount: price,
    currency: "TRY",
    status: "completed",
    payment_method: "shopier",
    payment_provider: "shopier",
    shopier_order_id: orderid,
    plan_id: planId,
  })

  console.log("[Shopier OSB] Subscription activated:", { userId, planId, orderid })
}
