import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PayTRClient } from "@/lib/paytr-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/paytr/callback
 *
 * PayTR webhook handler - receives payment notifications
 * IMPORTANT: Must return "OK" for PayTR to mark webhook as processed
 */
export async function POST(request: NextRequest) {
  try {
    // Parse callback data (PayTR sends as URLSearchParams)
    const body = await request.text()
    const params = new URLSearchParams(body)
    const callbackData = PayTRClient.parseCallback(params)

    // Verify signature
    const paytrClient = new PayTRClient()
    if (!paytrClient.verifyCallback(callbackData)) {
      console.error("[PayTR Callback] ⚠️ INVALID SIGNATURE - Possible fraud attempt:", {
        order_id: callbackData.merchant_oid,
        status: callbackData.status,
        amount: callbackData.total_amount,
        received_hash: callbackData.hash,
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
      })
      // Still return OK to prevent retries
      return new Response("OK", { status: 200 })
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Log webhook event
    await supabase.from("paytr_webhook_events").insert({
      order_id: callbackData.merchant_oid,
      event_type: callbackData.status === "success" ? "payment_success" : "payment_failed",
      event_data: callbackData,
      processed: false,
    })

    // Handle payment result
    if (callbackData.status === "success") {
      await handlePaymentSuccess(supabase, callbackData)
    } else {
      await handlePaymentFailure(supabase, callbackData)
    }

    // Mark webhook as processed
    await supabase
      .from("paytr_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("order_id", callbackData.merchant_oid)

    // IMPORTANT: PayTR expects "OK" response
    return new Response("OK", { status: 200 })
  } catch (error: any) {
    console.error("[PayTR Callback] Error:", error)
    // Still return OK to prevent infinite retries
    return new Response("OK", { status: 200 })
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(supabase: any, data: any) {
  try {
    // Get pending subscription
    const { data: pending, error: pendingError } = await supabase
      .from("pending_subscriptions")
      .select("*")
      .eq("token", data.merchant_oid)
      .maybeSingle()

    if (pendingError || !pending) {
      console.error("[PayTR] Pending subscription not found:", data.merchant_oid)
      return
    }

    // Idempotency check - Aynı ödeme birden fazla işlenmesin
    if (pending.status === "completed") {
      return
    }

    // Get plan details
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", pending.plan_id)
      .single()

    if (!plan) {
      console.error("[PayTR] Plan not found:", pending.plan_id)
      return
    }

    // Verify amount matches plan price
    const expectedAmountKurus = Math.round(plan.price * 100)
    const receivedAmountKurus = parseInt(data.total_amount)

    if (Math.abs(expectedAmountKurus - receivedAmountKurus) > 1) {
      // Allow 1 kuruş tolerance for rounding
      console.error("[PayTR] Amount mismatch:", {
        expected: expectedAmountKurus,
        received: receivedAmountKurus,
      })
      // Still process but log warning
    }

    // Calculate subscription dates
    const startDate = new Date()
    const expiresAt = new Date(startDate)

    if (plan.billing_period === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else if (plan.billing_period === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      // Lifetime or other
      expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    }

    // Calculate next renewal reminder date (7 days before expiry)
    const nextReminderDate = new Date(expiresAt)
    nextReminderDate.setDate(nextReminderDate.getDate() - 7)

    // Deactivate old subscriptions (mark as deleted to prevent duplicates in view)
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        deleted_at: new Date().toISOString(),
      })
      .eq("user_id", pending.user_id)
      .in("status", ["active", "trialing"])

    // Determine plan type based on plan_id
    let planType = "free"
    if (pending.plan_id !== "free") {
      if (pending.plan_id.includes("pro-")) {
        planType = "pro"
      } else if (pending.plan_id.includes("premium-")) {
        planType = "premium"
      }
    }

    // Create new subscription
    const { data: newSub, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: pending.user_id,
        plan_id: pending.plan_id,
        plan_type: planType,
        status: "active",
        start_date: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_provider: "paytr",
        paytr_order_id: data.merchant_oid,
        paytr_transaction_id: data.merchant_oid,
        paytr_payment_date: new Date().toISOString(),
        last_renewal_date: startDate.toISOString(),
        next_renewal_reminder_date: nextReminderDate.toISOString(),
      })
      .select()
      .single()

    if (subError) {
      console.error("[PayTR] Failed to create subscription:", subError)
      return
    }

    // Initialize usage tracking
    await initializeUsageTracking(supabase, pending.user_id, newSub.id, pending.plan_id)

    // Create invoice (preparing status until admin uploads PDF)
    await supabase.from("invoices").insert({
      user_id: pending.user_id,
      subscription_id: newSub.id,
      invoice_number: `INV-${Date.now()}-${data.merchant_oid.slice(-6)}`,
      invoice_date: new Date().toISOString().split("T")[0],
      amount: parseFloat(data.total_amount) / 100,
      currency: "TRY",
      status: "preparing",
      payment_id: data.merchant_oid, // Used to match with payment transaction
      payment_provider: "paytr",
      paytr_order_id: data.merchant_oid,
      paytr_transaction_id: data.merchant_oid,
      description: `${plan.name} - Yeni Abonelik`,
    })

    // Create payment transaction
    await supabase.from("payment_transactions").insert({
      user_id: pending.user_id,
      subscription_id: newSub.id,
      amount: (parseFloat(data.total_amount) / 100).toString(),
      currency: "TRY",
      status: "completed",
      payment_method: "paytr",
      payment_provider: "paytr",
      paytr_order_id: data.merchant_oid,
      paytr_transaction_id: data.merchant_oid,
      paytr_payment_type: data.payment_type,
      plan_id: pending.plan_id,
    })

    // Update pending subscription
    await supabase
      .from("pending_subscriptions")
      .update({
        status: "completed",
        subscription_reference: newSub.id,
      })
      .eq("id", pending.id)
  } catch (error: any) {
    console.error("[PayTR] Error handling payment success:", error)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(supabase: any, data: any) {
  try {
    // Update pending subscription
    await supabase
      .from("pending_subscriptions")
      .update({
        status: "failed",
        metadata: {
          failed_reason_code: data.failed_reason_code,
          failed_reason_msg: data.failed_reason_msg,
        },
      })
      .eq("token", data.merchant_oid)

    // Could send email notification here
  } catch (error: any) {
    console.error("[PayTR] Error handling payment failure:", error)
  }
}

/**
 * Initialize usage tracking for new subscription
 */
async function initializeUsageTracking(
  supabase: any,
  userId: string,
  subscriptionId: string,
  planId: string
) {
  // Get plan limits
  const limits: Record<string, { ocr: number; risk: number }> = {
    free: { ocr: 1, risk: 0 },
    "pro-monthly": { ocr: 10, risk: 5 },
    "pro-yearly": { ocr: 10, risk: 5 },
    "premium-monthly": { ocr: 999999, risk: 999999 },
    "premium-yearly": { ocr: 999999, risk: 999999 },
  }

  const planLimits = limits[planId] || limits.free

  // Calculate reset date (30 days from now)
  const resetAt = new Date()
  resetAt.setDate(resetAt.getDate() + 30)

  // Delete old usage tracking records to ensure clean state
  await supabase
    .from("subscription_usage")
    .delete()
    .eq("user_id", userId)

  // Create new usage tracking records for the new subscription
  await supabase.from("subscription_usage").insert([
    {
      user_id: userId,
      subscription_id: subscriptionId,
      feature_type: "ocr_analysis",
      usage_count: 0,
      limit_count: planLimits.ocr,
      saved_credits_count: 0,
      saved_credits_limit: planLimits.ocr,
      reset_at: resetAt.toISOString(),
    },
    {
      user_id: userId,
      subscription_id: subscriptionId,
      feature_type: "risk_analysis",
      usage_count: 0,
      limit_count: planLimits.risk,
      saved_credits_count: 0,
      saved_credits_limit: 0,
      reset_at: resetAt.toISOString(),
    },
  ])
}
