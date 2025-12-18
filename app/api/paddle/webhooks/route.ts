import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { PaddleClient } from "@/lib/paddle-client"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Paddle secret key for signature verification (Paddle Billing v2)
const PADDLE_WEBHOOK_SECRET_KEY = process.env.PADDLE_WEBHOOK_SECRET_KEY || ""

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and signature
    const body = await request.text()
    const headersList = headers()
    // Paddle Billing uses 'paddle-signature', falling back to 'paddle_signature' just in case
    const signature = headersList.get("paddle-signature") || headersList.get("paddle_signature") || ""

    // Verify webhook signature
    if (!signature) {
      console.error("[Paddle Webhook] Missing signature")
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    if (!PaddleClient.verifyWebhookSignature(body, signature, PADDLE_WEBHOOK_SECRET_KEY)) {
      console.error("[Paddle Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Parse the event data
    const event = JSON.parse(body)
    const eventType = event.event_type
    const eventData = event.data

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

      case "subscription.payment_succeeded": // Deprecated in v2 but kept for compatibility
      case "transaction.completed": // Standard v2 payment success event
        if (eventData.subscription_id) {
            await handlePaymentSucceeded(supabase, eventData)
        }
        break;

      case "subscription.payment_failed":
      case "transaction.failed":
        if (eventData.subscription_id) {
             await handlePaymentFailed(supabase, eventData)
        }
        break

      case "subscription.paused":
        await handleSubscriptionPaused(supabase, eventData)
        break

      case "subscription.resumed":
        await handleSubscriptionResumed(supabase, eventData)
        break

      default:
        // Unhandled event type
        break
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
    current_billing_period,
    custom_data,
    currency_code,
  } = data

  const currentPeriodStart = current_billing_period?.starts_at
  const currentPeriodEnd = current_billing_period?.ends_at

  // Extract user and plan info
  let userId = custom_data?.userId || custom_data?.user_id
  let planId = custom_data?.planId || custom_data?.plan_id

  // If custom_data is missing, try to find user by customer_id in our DB
  if (!userId) {
    const { data: customer } = await supabase
        .from("paddle_customers")
        .select("user_id")
        .eq("paddle_customer_id", paddleCustomerId)
        .single()
    
    if (customer) {
        userId = customer.user_id
    }
  }

  // If planId is missing, try to infer from price_id
  if (!planId && items && items.length > 0) {
      const priceId = items[0].price?.id
      if (priceId) {
          const { data: plan } = await supabase
              .from("subscription_plans")
              .select("id")
              .eq("paddle_price_id", priceId)
              .single()
          if (plan) planId = plan.id
      }
  }

  if (!userId || !planId) {
    console.error("[Paddle] Missing user_id or plan_id for subscription creation", { paddleSubscriptionId, userId, planId })
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

  // Create/update Paddle customer record if needed
  // We assume user is already linked via paddle_customers if we found userId above, 
  // or will be linked now if custom_data had userId.
  if (userId && paddleCustomerId) {
      await supabase.from("paddle_customers").upsert({
        user_id: userId,
        paddle_customer_id: paddleCustomerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
  }

  // Calculate subscription end date based on billing period
  let endDate = new Date(currentPeriodEnd)
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
    paddle_plan_id: items[0]?.price?.id, // Storing price ID
    start_date: currentPeriodStart,
    expires_at: endDate.toISOString(),
    end_date: endDate.toISOString(),
    updated_at: new Date().toISOString(),
    status_updated_at: new Date().toISOString(),
    paddle_subscription_data: data,
    deleted_at: null, // Ensure subscription is active
  }

  // Deactivate old subscription if exists
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", userId)
    .neq("paddle_subscription_id", paddleSubscriptionId)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  if (existingSubscription) {
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
    // Initialize OCR usage
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
}

async function handleSubscriptionActivated(
  supabase: any,
  data: any
) {
  const {
    id: paddleSubscriptionId,
    status,
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
}

async function handleSubscriptionUpdated(
  supabase: any,
  data: any
) {
  const {
    id: paddleSubscriptionId,
    status,
    current_billing_period,
    paused_at,
    canceled_at,
    items,
  } = data

  const currentPeriodStart = current_billing_period?.starts_at
  const currentPeriodEnd = current_billing_period?.ends_at

  const updateData: any = {
    status_updated_at: new Date().toISOString(),
    paddle_subscription_data: data,
  }

  if (currentPeriodStart) updateData.start_date = currentPeriodStart
  if (currentPeriodEnd) updateData.expires_at = currentPeriodEnd
  if (paused_at) updateData.paused_at = paused_at
  if (canceled_at) updateData.canceled_at = canceled_at
  
  // If items changed, update plan_id reference? 
  // Ideally handled, but simple logic for now:
  if (items && items.length > 0) {
      updateData.paddle_plan_id = items[0].price?.id
  }

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
      canceled_at: canceled_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      paddle_subscription_data: data,
    })
    .eq("paddle_subscription_id", paddleSubscriptionId)
}

async function handlePaymentSucceeded(
  supabase: any,
  data: any
) {
  // Handles 'transaction.completed' (Paddle v2) or 'subscription.payment_succeeded' (Classic/legacy)
  const {
    subscription_id,
    currency_code,
    details, // details.totals.total (string)
    items,
    billing_period,
    id: transactionId
  } = data

  if (!subscription_id) return

  // Paddle Billing v2: details.totals.total is a string representing minor units (e.g. "1000" for $10.00)
  const totalStr = details?.totals?.total || "0"
  const totalAmount = parseInt(totalStr) / 100

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
      invoice_number: `INV-${Date.now()}-${subscription_id.slice(-6)}`,
      invoice_date: new Date().toISOString().split('T')[0],
      amount: totalAmount,
      currency: currency_code?.toUpperCase(),
      status: "paid",
      payment_date: new Date().toISOString(),
      payment_provider: "paddle",
      paddle_transaction_id: transactionId,
      description: `${subscription.subscription_plans?.name || 'Abonelik'} - Yenileme`,
    })

    // Create payment transaction record
    await supabase.from("payment_transactions").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: totalAmount.toString(),
      currency: currency_code?.toUpperCase(),
      status: "completed",
      payment_method: "paddle",
      paddle_transaction_id: transactionId,
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
        amount: totalAmount.toFixed(2),
        currency: currency_code?.toUpperCase(),
        billingPeriod: billing_period?.frequency === 1 ?
          (billing_period?.interval === "month" ? "Aylık" : "Yıllık") :
          "Dönemlik",
        nextBillingDate: null, 
      },
    })
  }
}

async function handlePaymentFailed(
  supabase: any,
  data: any
) {
  const {
    subscription_id,
    currency_code,
    details,
    id: transactionId
  } = data

  if (!subscription_id) return

  const totalStr = details?.totals?.total || "0"
  const totalAmount = parseInt(totalStr) / 100

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
      users!inner(email, first_name, last_name)
    `)
    .eq("paddle_subscription_id", subscription_id)
    .single()

  if (subscription?.users?.email) {
    // Create failed payment transaction record
    await supabase.from("payment_transactions").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: totalAmount.toString(),
      currency: currency_code?.toUpperCase(),
      status: "failed",
      payment_method: "paddle",
      paddle_transaction_id: transactionId,
      plan_id: subscription.plan_id,
      error_message: `Payment failed`,
    })

    // Send payment failed email
    await sendEmail({
      to: subscription.users.email,
      subject: "Abonelik Ödemeniz Başarısız",
      template: "payment-failed",
      data: {
        customerName: subscription.users.first_name || "Değerli Müşterimiz",
        planName: subscription.subscription_plans?.name || "Premium Plan",
        amount: totalAmount.toFixed(2),
        currency: currency_code?.toUpperCase(),
        attemptNumber: 1,
        nextPaymentDate: updateData.grace_period_ends_at ?
          new Date(updateData.grace_period_ends_at).toLocaleDateString("tr-TR") :
          null,
        gracePeriodEnds: updateData.grace_period_ends_at ?
          new Date(updateData.grace_period_ends_at).toLocaleDateString("tr-TR") :
          null,
        updateUrl: subscription.update_url,
      },
    })
  }
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
}
