import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { PaddleClient, paddleClient } from "@/lib/paddle-client"
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

    console.log("[Paddle Webhook] Received webhook")
    console.log("[Paddle Webhook] Signature present:", !!signature)

    // Verify webhook signature
    if (!signature) {
      console.error("[Paddle Webhook] Missing signature")
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    if (!PaddleClient.verifyWebhookSignature(body, signature, PADDLE_PUBLIC_KEY)) {
      console.error("[Paddle Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    console.log("[Paddle Webhook] Signature verified successfully")

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

      case "subscription.activated":
        await handleSubscriptionActivated(supabase, eventData)
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
    currency,
  } = data

  // Extract user and plan info from custom_data or passthrough
  let userId = custom_data?.user_id
  let planId = custom_data?.plan_id

  // Try to get from passthrough if not in custom_data
  if (!userId || !planId) {
    const passthrough = PaddleClient.parsePassthrough(data.passthrough)
    if (passthrough) {
      userId = userId || passthrough.userId
      planId = planId || passthrough.planId
    }
  }

  if (!userId || !planId) {
    console.error("[Paddle] Missing user_id or plan_id", { custom_data, passthrough: data.passthrough })
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
    email: data.customer?.email || data.customer_email,
    name: data.customer?.name,
    country: data.customer?.country,
    updated_at: new Date().toISOString(),
  })

  // Calculate subscription end date based on billing period
  let endDate = new Date(current_period_end)
  if (plan.billing_period === "lifetime") {
    endDate = new Date("2099-12-31")
  }

  // Create or update subscription record
  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    plan_type: planId === "free" ? "free" : "premium",
    status: status === "trialing" ? "trialing" : "active",
    paddle_subscription_id: paddleSubscriptionId,
    paddle_customer_id: paddleCustomerId,
    paddle_plan_id: items[0]?.price?.id,
    start_date: current_period_start,
    expires_at: endDate.toISOString(),
    end_date: endDate.toISOString(),
    updated_at: new Date().toISOString(),
    status_updated_at: new Date().toISOString(),
    cancel_url: management_urls?.cancel,
    update_url: management_urls?.update_payment,
    paddle_subscription_data: data,
    deleted_at: null, // Ensure subscription is active
  }

  // Check if this is an upgrade from existing subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", userId)
    .neq("paddle_subscription_id", paddleSubscriptionId)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  if (existingSubscription) {
    // Deactivate old subscription
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSubscription.id)
  }

  // Create new subscription
  const { error: insertError } = await supabase
    .from("subscriptions")
    .upsert(subscriptionData)

  if (insertError) {
    console.error("[Paddle] Error creating subscription:", insertError)
    return
  }

  // Update pending subscription status if exists
  const pendingSubscriptionId = custom_data?.pending_subscription_id
  if (pendingSubscriptionId) {
    await supabase
      .from("pending_subscriptions")
      .update({
        status: "completed",
        subscription_reference: paddleSubscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingSubscriptionId)
  }

  // Initialize usage tracking
  const { data: newSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", paddleSubscriptionId)
    .single()

  if (newSubscription) {
    // Initialize OCR usage with saved_credits_limit
    const ocrLimit = planId === "free" ? 1 : (planId.includes("premium") ? 999999 : 10)
    const savedCreditsLimit = planId === "free" ? 1 : (planId.includes("premium") ? 999999 : 10)

    await supabase
      .from("subscription_usage")
      .upsert({
        user_id: userId,
        subscription_id: newSubscription.id,
        feature_type: "ocr_analysis",
        usage_count: 0,
        limit_count: ocrLimit,
        saved_credits_limit: savedCreditsLimit,
        reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

    // Initialize risk analysis usage
    await supabase
      .from("subscription_usage")
      .upsert({
        user_id: userId,
        subscription_id: newSubscription.id,
        feature_type: "risk_analysis",
        usage_count: 0,
        limit_count: planId === "free" ? 0 : (planId.includes("premium") ? 999999 : 5),
        reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
  }

  console.log(`[Paddle] Subscription created for user ${userId}, plan: ${planId}`)
}

async function handleSubscriptionActivated(
  supabase: any,
  data: any
) {
  const {
    id: paddleSubscriptionId,
    status,
    current_period_start,
    current_period_end,
  } = data

  // Update subscription status to active
  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      status_updated_at: new Date().toISOString(),
      paddle_subscription_data: data,
    })
    .eq("paddle_subscription_id", paddleSubscriptionId)

  console.log(`[Paddle] Subscription ${paddleSubscriptionId} activated`)
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

  if (current_period_start) updateData.start_date = current_period_start
  if (current_period_end) updateData.expires_at = current_period_end
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
  const {
    subscription_id,
    currency,
    total,
    items,
    billing_period,
    next_billed_at
  } = data

  // Update subscription
  const updateData: any = {
    status: "active",
    requires_payment_action: false,
    updated_at: new Date().toISOString(),
    status_updated_at: new Date().toISOString(),
    grace_period_started_at: null,
    grace_period_ends_at: null,
    suspended_at: null,
  }

  if (next_billed_at) {
    updateData.expires_at = next_billed_at
    updateData.end_date = next_billed_at
  }

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("paddle_subscription_id", subscription_id)

  // Get subscription and user details
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_plans(name, billing_period, price),
      users!inner(email, first_name, last_name)
    `)
    .eq("paddle_subscription_id", subscription_id)
    .single()

  if (subscription?.users?.email) {
    // Create invoice record
    await supabase.from("invoices").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      invoice_number: `INV-${Date.now()}-${subscription_id.slice(-8)}`,
      invoice_date: new Date().toISOString().split('T')[0],
      amount: total / 100, // Convert from cents
      currency: currency.toUpperCase(),
      status: "paid",
      payment_date: new Date().toISOString(),
      payment_provider: "paddle",
      paddle_transaction_id: data.id,
      description: `${subscription.subscription_plans?.name} Plan - ${billing_period?.frequency} ${billing_period?.interval}`,
    })

    // Create payment transaction record
    await supabase.from("payment_transactions").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: (total / 100).toString(),
      currency: currency.toUpperCase(),
      status: "completed",
      payment_method: "paddle",
      paddle_transaction_id: data.id,
      plan_id: subscription.plan_id,
    })

    // Send payment success email
    await sendEmail({
      to: subscription.users.email,
      subject: "Abonelik Ödemeniz Başarılı",
      template: "payment-success",
      data: {
        customerName: subscription.users.first_name || "Değerli Müşterimiz",
        planName: subscription.subscription_plans?.name || "Premium Plan",
        amount: (total / 100).toFixed(2),
        currency: currency.toUpperCase(),
        billingPeriod: billing_period?.frequency === 1 ?
          (billing_period?.interval === "month" ? "Aylık" : "Yıllık") :
          `${billing_period?.frequency} ${billing_period?.interval}`,
        nextBillingDate: next_billed_at ?
          new Date(next_billed_at).toLocaleDateString("tr-TR") :
          null,
      },
    })
  }

  console.log(`[Paddle] Payment succeeded for subscription ${subscription_id}`)
}

async function handlePaymentFailed(
  supabase: any,
  data: any
) {
  const {
    subscription_id,
    currency,
    total,
    attempt_number,
    next_payment_date
  } = data

  // Update subscription status to past_due and start grace period
  const updateData: any = {
    status: "past_due",
    updated_at: new Date().toISOString(),
    status_updated_at: new Date().toISOString(),
    requires_payment_action: true,
  }

  // Start grace period if not already started
  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("grace_period_started_at, grace_period_ends_at")
    .eq("paddle_subscription_id", subscription_id)
    .single()

  if (!currentSubscription?.grace_period_started_at) {
    updateData.grace_period_started_at = new Date().toISOString()
    updateData.grace_period_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  }

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("paddle_subscription_id", subscription_id)

  // Get subscription and user details
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_plans(name, billing_period, price),
      users!inner(email, first_name, last_name),
      paddle_customers(email)
    `)
    .eq("paddle_subscription_id", subscription_id)
    .single()

  if (subscription?.users?.email) {
    // Create failed payment transaction record
    await supabase.from("payment_transactions").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: (total / 100).toString(),
      currency: currency.toUpperCase(),
      status: "failed",
      payment_method: "paddle",
      paddle_transaction_id: data.id,
      plan_id: subscription.plan_id,
      error_message: `Payment failed on attempt ${attempt_number}`,
    })

    // Send payment failed email
    await sendEmail({
      to: subscription.users.email,
      subject: "Abonelik Ödemeniz Başarısız",
      template: "payment-failed",
      data: {
        customerName: subscription.users.first_name || "Değerli Müşterimiz",
        planName: subscription.subscription_plans?.name || "Premium Plan",
        amount: (total / 100).toFixed(2),
        currency: currency.toUpperCase(),
        attemptNumber: attempt_number,
        nextPaymentDate: next_payment_date ?
          new Date(next_payment_date).toLocaleDateString("tr-TR") :
          updateData.grace_period_ends_at ?
          new Date(updateData.grace_period_ends_at).toLocaleDateString("tr-TR") :
          null,
        gracePeriodEnds: updateData.grace_period_ends_at ?
          new Date(updateData.grace_period_ends_at).toLocaleDateString("tr-TR") :
          null,
        updateUrl: subscription.update_url,
      },
    })
  }

  console.log(`[Paddle] Payment failed for subscription ${subscription_id}, attempt ${attempt_number}`)
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