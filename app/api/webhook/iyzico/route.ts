import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { rateLimit, getClientIp, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
const iyzicoSecretKey = process.env.IYZICO_SECRET_KEY!

/**
 * Verifies İyzico webhook signature to prevent forgery attacks
 */
function verifyWebhookSignature(
  payload: any,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    console.error("[iyzico-webhook] Missing signature header")
    return false
  }

  try {
    // İyzico typically uses HMAC-SHA256 for webhook signatures
    // The signature is usually computed from the raw payload
    const payloadString = JSON.stringify(payload)
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadString)
      .digest("hex")

    // Use timing-safe comparison to prevent timing attacks
    // Convert to Uint8Array for timingSafeEqual
    return crypto.timingSafeEqual(
      new Uint8Array(Buffer.from(signature)),
      new Uint8Array(Buffer.from(expectedSignature))
    )
  } catch (error) {
    console.error("[iyzico-webhook] Signature verification error:", error)
    return false
  }
}

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
    // Rate limiting - prevent webhook spam attacks
    const ip = getClientIp(request.headers)
    const rateLimitResult = rateLimit({
      identifier: `webhook-iyzico:${ip}`,
      ...RateLimits.WEBHOOK
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many webhook requests. Please slow down.",
          retryAfter: rateLimitResult.reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset.toString()
          }
        }
      )
    }

    // Get webhook payload
    const payload = await request.json()

    // SECURITY: Verify webhook signature to prevent forgery
    const signature = request.headers.get("x-iyzico-signature")

    if (!verifyWebhookSignature(payload, signature, iyzicoSecretKey)) {
      console.error("[iyzico-webhook] Invalid webhook signature - possible forgery attempt")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // IDEMPOTENCY CHECK: Prevent processing the same webhook multiple times
    const idempotencyKey = payload.conversationId || payload.paymentId ||
                          `${payload.subscriptionReferenceCode}-${payload.iyziEventType}-${Date.now()}`

    // Check if webhook was already processed
    const { data: existingWebhook } = await supabase
      .from("webhook_logs")
      .select("id, status")
      .eq("subscription_reference", payload.subscriptionReferenceCode)
      .eq("event_type", payload.iyziEventType || "unknown")
      .or(`payload->>conversationId.eq.${payload.conversationId},payload->>paymentId.eq.${payload.paymentId}`)
      .eq("status", "processed")
      .maybeSingle()

    if (existingWebhook) {
      console.log("[iyzico-webhook] Webhook already processed (idempotent):", idempotencyKey)
      return NextResponse.json({
        success: true,
        message: "Webhook already processed",
        idempotent: true
      })
    }

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
