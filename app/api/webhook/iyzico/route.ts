import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * İyzico Webhook Handler
 * İyzico'dan gelen subscription event'lerini dinler ve işler
 *
 * Event Types:
 * - subscription_created: Yeni subscription oluşturuldu
 * - subscription_renewed: Subscription yenilendi (aylık ödeme)
 * - subscription_cancelled: Subscription iptal edildi
 * - subscription_expired: Subscription süresi doldu
 * - payment_succeeded: Ödeme başarılı
 * - payment_failed: Ödeme başarısız
 */
export async function POST(request: NextRequest) {
  try {

    // Get webhook payload
    const payload = await request.json()

      iyziEventType: payload.iyziEventType,
      status: payload.status,
      subscriptionReferenceCode: payload.subscriptionReferenceCode,
    })

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Log webhook to database
    const { error: logError } = await supabase.from("webhook_logs").insert({
      event_type: payload.iyziEventType || "unknown",
      subscription_reference: payload.subscriptionReferenceCode,
      payload: payload,
      status: "received",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (logError) {
      console.error("[iyzico-webhook] Failed to log webhook:", logError)
    }

    // Handle different event types
    const eventType = payload.iyziEventType
    const subscriptionReference = payload.subscriptionReferenceCode

    if (!subscriptionReference) {
      console.error("[iyzico-webhook] Missing subscription reference code")
      return NextResponse.json({ error: "Missing subscription reference" }, { status: 400 })
    }

    // Find subscription by reference code
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("iyzico_subscription_reference", subscriptionReference)
      .single()

    if (subError || !subscription) {
      console.error("[iyzico-webhook] Subscription not found:", subscriptionReference)
      // Don't fail - log the webhook anyway
      await supabase
        .from("webhook_logs")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("subscription_reference", subscriptionReference)
        .eq("status", "received")

      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }


    // Handle event based on type
    switch (eventType) {
      case "subscription_renewed":
      case "payment_succeeded":

        // Extend subscription expiry date
        const currentExpiry = new Date(subscription.expires_at)
        const newExpiry = new Date(currentExpiry)

        // Get plan details to determine renewal period
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", subscription.plan_id)
          .single()

        if (plan) {
          if (plan.billing_period === "yearly") {
            newExpiry.setFullYear(newExpiry.getFullYear() + 1)
          } else if (plan.billing_period === "monthly") {
            newExpiry.setMonth(newExpiry.getMonth() + 1)
          }

          // Update subscription
          await supabase
            .from("subscriptions")
            .update({
              expires_at: newExpiry.toISOString(),
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id)

          // Create payment transaction record
          await supabase.from("payment_transactions").insert({
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            plan_id: subscription.plan_id,
            amount: plan.price,
            currency: plan.currency || "TRY",
            status: "completed",
            payment_method: "iyzico_subscription",
            iyzico_payment_id: payload.paymentId || subscriptionReference,
            iyzico_conversation_id: payload.conversationId,
            created_at: new Date().toISOString(),
          })

        }
        break

      case "subscription_cancelled":

        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)

        break

      case "subscription_expired":

        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)

        // Reset usage limits to free tier
        await supabase
          .from("usage_tracking")
          .update({
            limit_count: 3,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", subscription.user_id)

        break

      case "payment_failed":

        // Log failed payment
        await supabase.from("payment_transactions").insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          plan_id: subscription.plan_id,
          amount: 0,
          currency: "TRY",
          status: "failed",
          payment_method: "iyzico_subscription",
          error_message: payload.errorMessage || "Payment failed",
          created_at: new Date().toISOString(),
        })

        // Optionally mark subscription as at risk
        // await supabase
        //   .from("subscriptions")
        //   .update({ status: "payment_failed" })
        //   .eq("id", subscription.id)

        break

      default:
    }

    // Mark webhook as processed
    await supabase
      .from("webhook_logs")
      .update({ status: "processed", updated_at: new Date().toISOString() })
      .eq("subscription_reference", subscriptionReference)
      .eq("status", "received")


    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (error: any) {
    console.error("[iyzico-webhook] Webhook processing error:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}

/**
 * GET handler to verify webhook endpoint is working
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "İyzico webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
