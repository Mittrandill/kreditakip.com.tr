import { type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyShopierOSB, decodeShopierPayload, getPlanIdFromProductId } from "@/lib/shopier-client"
import { sendSubscriptionWelcomeNotification, sendNewSubscriptionNotification } from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const PLAN_LIMITS: Record<string, { ocr: number; risk: number }> = {
  "pro-monthly":     { ocr: 10,     risk: 5 },
  "pro-yearly":      { ocr: 10,     risk: 5 },
  "premium-monthly": { ocr: 999999, risk: 999999 },
  "premium-yearly":  { ocr: 999999, risk: 999999 },
}

const PLAN_LABELS: Record<string, string> = {
  "pro-monthly":     "Pro Aylık",
  "pro-yearly":      "Pro Yıllık",
  "premium-monthly": "Premium Aylık",
  "premium-yearly":  "Premium Yıllık",
}

function getPlanType(planId: string): "pro" | "premium" {
  return planId.startsWith("premium") ? "premium" : "pro"
}

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Log every incoming request so we can confirm Shopier is actually hitting us
async function logRequest(supabase: any, request: NextRequest, method: string, rawBody: string) {
  try {
    await supabase.from("shopier_osb_log").insert({
      method,
      content_type: request.headers.get("content-type"),
      raw_body: rawBody?.slice(0, 5000) ?? null,
      query_string: request.nextUrl.search || null,
      user_agent: request.headers.get("user-agent"),
      source_ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    })
  } catch (e) {
    console.error("[Shopier OSB] Failed to write debug log:", e)
  }
}

// Shopier may probe the URL with a GET; log it so we see any contact at all.
export async function GET(request: NextRequest) {
  const supabase: any = makeClient()
  await logRequest(supabase, request, "GET", "")
  return new Response("success", { status: 200 })
}

/**
 * POST /api/shopier/osb
 *
 * Shopier Otomatik Sipariş Bildirimi (OSB) handler.
 * Shopier sends form-encoded body: res=<base64>&hash=<hmac-sha256>
 * Hash: HMAC-SHA256(res + OSB_USERNAME, key=OSB_PASSWORD)
 * Must respond with HTTP 200 body "success".
 */
export async function POST(request: NextRequest) {
  const supabase: any = makeClient()

  // Shopier sends multipart/form-data (NOT urlencoded). request.formData()
  // handles both multipart and urlencoded; fall back to raw text otherwise.
  let res: string | null = null
  let receivedHash: string | null = null
  let rawText = ""
  const contentType = request.headers.get("content-type") || ""

  try {
    if (contentType.includes("multipart/form-data") || contentType.includes("x-www-form-urlencoded")) {
      const fd = await request.formData()
      res = fd.get("res")?.toString() ?? null
      receivedHash = fd.get("hash")?.toString() ?? null
      rawText = `res=${res ?? ""}&hash=${receivedHash ?? ""}`
    } else {
      rawText = await request.text()
      const params = new URLSearchParams(rawText)
      res = params.get("res")
      receivedHash = params.get("hash")
    }
  } catch (e) {
    console.error("[Shopier OSB] Failed to parse body:", e)
  }

  await logRequest(supabase, request, "POST", rawText)

  if (!res || !receivedHash) {
    console.error("[Shopier OSB] Missing res or hash field")
    return new Response("success", { status: 200 })
  }

  // Signature verification — on failure, record for diagnosis instead of
  // silently dropping (this is how a real paid order can vanish if the
  // OSB username/password env vars are wrong).
  const sigValid = verifyShopierOSB(res, receivedHash)

  // Decode payload (attempt even if signature failed, for diagnostics)
  let payload: ReturnType<typeof decodeShopierPayload> | null = null
  try {
    payload = decodeShopierPayload(res)
  } catch {
    console.error("[Shopier OSB] Failed to decode payload")
  }

  if (!sigValid) {
    console.error("[Shopier OSB] INVALID SIGNATURE — check SHOPIER_OSB_USERNAME/PASSWORD env vars")
    await supabase.from("shopier_unmatched_orders").insert({
      order_id: payload ? String(payload.orderid) : "unknown",
      buyer_email: payload?.email ?? "unknown",
      product_id: payload ? String(payload.productid) : "unknown",
      plan_id: null,
      amount: payload ? parseFloat(payload.price) : null,
      raw_payload: payload,
      raw_body: res,
      reason: "invalid_signature",
    }).catch((e: any) => console.error("[Shopier OSB] Failed to log invalid-sig order:", e))
    return new Response("success", { status: 200 })
  }

  if (!payload) {
    return new Response("success", { status: 200 })
  }

  // istest: 0 = live, 1 = test
  // For test notifications respond "success" (so Shopier OSB test passes) but skip DB work
  if (payload.istest == 1) {
    console.log("[Shopier OSB] Test notification received — responding success, skipping DB")
    return new Response("success", { status: 200 })
  }

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
  const planId = getPlanIdFromProductId(String(productid))
  if (!planId) {
    // Don't lose the payment — record it so admin can match manually.
    // Shopier's OSB productid may differ from the product URL slug, so log
    // the full payload here to discover the real productid → plan mapping.
    console.error("[Shopier OSB] Unknown product ID:", productid, "full payload:", JSON.stringify(payload))
    await supabase.from("shopier_unmatched_orders").insert({
      order_id: String(orderid),
      buyer_email: email,
      product_id: String(productid),
      plan_id: null,
      amount: parseFloat(price),
      raw_payload: payload,
      reason: "unknown_product",
    })
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
    await supabase.from("shopier_unmatched_orders").insert({
      order_id: String(orderid),
      buyer_email: email,
      product_id: String(productid),
      plan_id: planId,
      amount: parseFloat(price),
      raw_payload: payload,
      reason: "user_not_found",
    })
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
    invoice_number: `INV-${Date.now()}-${String(orderid).slice(-6)}`,
    invoice_date: new Date().toISOString().split("T")[0],
    amount: parseFloat(price),
    currency: "TRY",
    status: "preparing",
    payment_id: String(orderid),
    payment_provider: "shopier",
    shopier_order_id: String(orderid),
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
    shopier_order_id: String(orderid),
    plan_id: planId,
  })

  console.log("[Shopier OSB] Subscription activated:", { userId, planId, orderid })

  // Send notification emails (non-blocking — failure must not break activation)
  try {
    const planLabel = PLAN_LABELS[planId] ?? planId
    // Buyer name comes from Shopier (attacker-controllable); trim + length-cap.
    // HTML-escaping happens in the email template layer (see esc() there).
    const buyerName = [payload.buyername, payload.buyersurname]
      .filter(Boolean)
      .join(" ")
      .trim()
      .slice(0, 100)
    const emailData = {
      userName: buyerName,
      userEmail: email,
      planName: planLabel,
      amount: parseFloat(price),
      currency: "TRY",
      startDate: startDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }
    // Customer welcome/activation email
    await sendSubscriptionWelcomeNotification(emailData)
    // Admin notification
    await sendNewSubscriptionNotification(emailData)
  } catch (mailErr) {
    console.error("[Shopier OSB] Failed to send notification emails:", mailErr)
  }
}
