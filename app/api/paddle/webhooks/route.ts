import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { PaddleClient } from "@/lib/paddle-client"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Paddle public key for signature verification
const PADDLE_PUBLIC_KEY = process.env.PADDLE_PUBLIC_KEY || ""

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and signature
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get("paddle_signature") || ""

    // Verify webhook signature
    if (!PaddleClient.verifyWebhookSignature(body, signature, PADDLE_PUBLIC_KEY)) {
      console.error("[Paddle Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Parse the event data
    const event = JSON.parse(body)
    const eventType = event.event_type
    const eventData = event.data

    console.log(`[Paddle Webhook] Processing event: ${eventType}`)

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Store webhook event for debugging
    await supabase.from("paddle_webhook_events").insert({
      event_id: event.event_id,
      event_type: eventType,
      event_data: event,
      processed: false,
    })

    // Handle different event types
    switch (eventType) {
      case "subscription.created":
        await handleSubscriptionCreated(supabase, eventData)
        break

      case "subscription.updated":
        await handleSubscriptionUpdated(supabase, eventData)
        break

      case "subscription.canceled":
        await handleSubscriptionCanceled(supabase, eventData)
        break

      case "subscription.payment_succeeded":
        await handlePaymentSucceeded(supabase, eventData)
        break

      case "subscription.payment_failed":
        await handlePaymentFailed(supabase, eventData)
        break

      case "subscription.paused":
        await handleSubscriptionPaused(supabase, eventData)
        break

      case "subscription.resumed":
        await handleSubscriptionResumed(supabase, eventData)
        break

      case "payment.succeeded":
        await handleOneTimePaymentSucceeded(supabase, eventData)
        break

      case "payment.refunded":
        await handlePaymentRefunded(supabase, eventData)
        break

      default:
        console.log(`[Paddle Webhook] Unhandled event type: ${eventType}`)
    }

    // Mark event as processed
    await supabase
      .from("paddle_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", event.event_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Paddle Webhook] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(
  supabase: any,
  data: any
) {
  const {
    id: paddleSubscriptionId,
    customer_id: paddleCustomerId,
    items,
    status,
    current_period_start,
    current_period_end,
    custom_data,
    management_urls,
  } = data

  // Extract user and plan info from custom_data
  const userId = custom_data?.user_id
  const planId = custom_data?.plan_id

  if (!userId || !planId) {
    console.error("[Paddle] Missing user_id or plan_id in custom_data")
    return
  }

  // Get plan details
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .single()

  if (!plan) {
    console.error(`[Paddle] Plan not found: ${planId}`)
    return
  }

  // Create/update Paddle customer record
  await supabase.from("paddle_customers").upsert({
    user_id: userId,
    paddle_customer_id: paddleCustomerId,
    email: data.customer_email,
    updated_at: new Date().toISOString(),
  })

  // Create subscription record
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    plan_id: planId,
    status: status === "active" ? "active" : "pending",
    paddle_subscription_id: paddleSubscriptionId,
    paddle_customer_id: paddleCustomerId,
    paddle_plan_id: items[0]?.price?.id,
    started_at: current_period_start,
    ends_at: current_period_end,
    updated_at: new Date().toISOString(),
    cancel_url: management_urls?.cancel,
    update_url: management_urls?.update_payment,
    paddle_subscription_data: data,
  })

  console.log(`[Paddle] Subscription created for user ${userId}`)
}

async function handleSubscriptionUpdated(
  supabase: any,
  data: any
) {
  const {
    id: paddleSubscriptionId,
    status,
    current_period_start,
    current_period_end,
    pause_date,
    canceled_at,
    management_urls,
  } = data

  // Update subscription in database
  const updateData: any = {
    status_updated_at: new Date().toISOString(),
    paddle_subscription_data: data,
  }

  if (current_period_start) updateData.started_at = current_period_start
  if (current_period_end) updateData.ends_at = current_period_end
  if (pause_date) updateData.paused_at = pause_date
  if (canceled_at) updateData.canceled_at = canceled_at
  if (management_urls?.cancel) updateData.cancel_url = management_urls.cancel
  if (management_urls?.update_payment) updateData.update_url = management_urls.update_payment

  // Map Paddle status to our status
  switch (status) {
    case "active":
      updateData.status = "active"
      break
    case "paused":
      updateData.status = "paused"
      break
    case "canceled":
      updateData.status = "canceled"
      break
    case "past_due":
      updateData.status = "past_due"
      break
  }

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("paddle_subscription_id", paddleSubscriptionId)

  console.log(`[Paddle] Subscription ${paddleSubscriptionId} updated to ${status}`)
}

async function handleSubscriptionCanceled(
  supabase: any,
  data: any
) {
  const { id: paddleSubscriptionId, canceled_at } = data

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: canceled_at,
      updated_at: new Date().toISOString(),
      paddle_subscription_data: data,
    })
    .eq("paddle_subscription_id", paddleSubscriptionId)

  console.log(`[Paddle] Subscription ${paddleSubscriptionId} canceled`)
}

async function handlePaymentSucceeded(
  supabase: any,
  data: any
) {
  const { subscription_id } = data

  // Update subscription end date
  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscription_id)

  // Get user details for notification
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, users(email)")
    .eq("paddle_subscription_id", subscription_id)
    .single()

  if (subscription?.users?.email) {
    // Send payment success email
    await sendEmail({
      to: subscription.users.email,
      subject: "Abonelik Ödemeniz Başarılı",
      template: "payment-success",
      data: {
        planName: subscription.plan_id,
        amount: data.amount,
        currency: data.currency,
      },
    })
  }

  console.log(`[Paddle] Payment succeeded for subscription ${subscription_id}`)
}

async function handlePaymentFailed(
  supabase: any,
  data: any
) {
  const { subscription_id } = data

  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscription_id)

  // Get user details for notification
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, users(email)")
    .eq("paddle_subscription_id", subscription_id)
    .single()

  if (subscription?.users?.email) {
    // Send payment failed email
    await sendEmail({
      to: subscription.users.email,
      subject: "Abonelik Ödemeniz Başarısız",
      template: "payment-failed",
      data: {
        planName: subscription.plan_id,
        amount: data.amount,
        currency: data.currency,
      },
    })
  }

  console.log(`[Paddle] Payment failed for subscription ${subscription_id}`)
}

async function handleSubscriptionPaused(
  supabase: any,
  data: any
) {
  const { id: paddleSubscriptionId, pause_date } = data

  await supabase
    .from("subscriptions")
    .update({
      status: "paused",
      paused_at: pause_date,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", paddleSubscriptionId)

  console.log(`[Paddle] Subscription ${paddleSubscriptionId} paused`)
}

async function handleSubscriptionResumed(
  supabase: any,
  data: any
) {
  const { id: paddleSubscriptionId } = data

  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      paused_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", paddleSubscriptionId)

  console.log(`[Paddle] Subscription ${paddleSubscriptionId} resumed`)
}

async function handleOneTimePaymentSucceeded(
  supabase: any,
  data: any
) {
  // Handle one-time payments if applicable
  console.log(`[Paddle] One-time payment succeeded: ${data.id}`)
}

async function handlePaymentRefunded(
  supabase: any,
  data: any
) {
  // Handle refunds if applicable
  console.log(`[Paddle] Payment refunded: ${data.id}`)
}