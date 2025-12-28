import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PayTRClient } from "@/lib/paytr-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/paytr/renewal-callback
 *
 * PayTR webhook handler for subscription renewals
 * IMPORTANT: Must return "OK" for PayTR to mark webhook as processed
 */
export async function POST(request: NextRequest) {
  try {
    // Parse callback data
    const body = await request.text()
    const params = new URLSearchParams(body)
    const callbackData = PayTRClient.parseCallback(params)

    console.log("[PayTR Renewal Callback] Received:", {
      order_id: callbackData.merchant_oid,
      status: callbackData.status,
      amount: callbackData.total_amount,
    })

    // Verify signature
    const paytrClient = new PayTRClient()
    if (!paytrClient.verifyCallback(callbackData)) {
      console.error("[PayTR Renewal Callback] Invalid signature")
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
      event_type: callbackData.status === "success" ? "renewal_success" : "renewal_failed",
      event_data: callbackData,
      processed: false,
    })

    // Handle renewal result
    if (callbackData.status === "success") {
      await handleRenewalSuccess(supabase, callbackData)
    } else {
      await handleRenewalFailure(supabase, callbackData)
    }

    // Mark webhook as processed
    await supabase
      .from("paytr_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("order_id", callbackData.merchant_oid)

    return new Response("OK", { status: 200 })
  } catch (error: any) {
    console.error("[PayTR Renewal Callback] Error:", error)
    return new Response("OK", { status: 200 })
  }
}

/**
 * Handle successful renewal payment
 */
async function handleRenewalSuccess(supabase: any, data: any) {
  try {
    // Get pending renewal
    const { data: pending, error: pendingError } = await supabase
      .from("pending_subscriptions")
      .select("*")
      .eq("token", data.merchant_oid)
      .maybeSingle()

    if (pendingError || !pending) {
      console.error("[PayTR] Pending renewal not found:", data.merchant_oid)
      return
    }

    const renewalForSubId = pending.metadata?.renewal_for_subscription_id

    if (!renewalForSubId) {
      console.error("[PayTR] Renewal subscription ID not found in metadata")
      return
    }

    // Get existing subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans(*)
      `)
      .eq("id", renewalForSubId)
      .single()

    if (subError || !subscription) {
      console.error("[PayTR] Subscription not found:", renewalForSubId)
      return
    }

    const plan = subscription.subscription_plans

    // Calculate new expiry date
    const currentExpiry = new Date(subscription.expires_at)
    const now = new Date()

    // If subscription already expired, start from now
    // Otherwise extend from current expiry
    const baseDate = currentExpiry > now ? currentExpiry : now
    const newExpiry = new Date(baseDate)

    if (plan.billing_period === "monthly") {
      newExpiry.setMonth(newExpiry.getMonth() + 1)
    } else if (plan.billing_period === "yearly") {
      newExpiry.setFullYear(newExpiry.getFullYear() + 1)
    }

    // Calculate next renewal reminder (7 days before expiry)
    const nextReminderDate = new Date(newExpiry)
    nextReminderDate.setDate(nextReminderDate.getDate() - 7)

    // Update subscription
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        expires_at: newExpiry.toISOString(),
        status: "active",
        paytr_order_id: data.merchant_oid,
        paytr_payment_date: new Date().toISOString(),
        last_renewal_date: new Date().toISOString(),
        next_renewal_reminder_date: nextReminderDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)

    if (updateError) {
      console.error("[PayTR] Failed to update subscription:", updateError)
      return
    }

    console.log("[PayTR] Subscription renewed:", subscription.id)

    // Create invoice for renewal
    await supabase.from("invoices").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      invoice_number: `INV-${Date.now()}-${data.merchant_oid.slice(-6)}`,
      invoice_date: new Date().toISOString().split("T")[0],
      amount: parseFloat(data.total_amount) / 100,
      currency: "TRY",
      status: "paid",
      payment_date: new Date().toISOString(),
      payment_provider: "paytr",
      paytr_order_id: data.merchant_oid,
      paytr_transaction_id: data.merchant_oid,
      description: `${plan.name} - Yenileme`,
    })

    // Create payment transaction
    await supabase.from("payment_transactions").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: (parseFloat(data.total_amount) / 100).toString(),
      currency: "TRY",
      status: "completed",
      payment_method: "paytr",
      payment_provider: "paytr",
      paytr_order_id: data.merchant_oid,
      paytr_transaction_id: data.merchant_oid,
      paytr_payment_type: data.payment_type,
      plan_id: subscription.plan_id,
    })

    // Update pending renewal
    await supabase
      .from("pending_subscriptions")
      .update({
        status: "completed",
        subscription_reference: subscription.id,
      })
      .eq("id", pending.id)

    console.log("[PayTR] Renewal processed successfully")
  } catch (error: any) {
    console.error("[PayTR] Error handling renewal success:", error)
  }
}

/**
 * Handle failed renewal payment
 */
async function handleRenewalFailure(supabase: any, data: any) {
  try {
    console.log("[PayTR] Renewal failed:", {
      order_id: data.merchant_oid,
      reason_code: data.failed_reason_code,
      reason_msg: data.failed_reason_msg,
    })

    // Update pending renewal
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
    console.error("[PayTR] Error handling renewal failure:", error)
  }
}
