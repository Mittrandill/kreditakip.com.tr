import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { paddleClient } from "@/lib/paddle-client"
import { PaddleClient as PaddleClientClass } from "@/lib/paddle-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, userEmail, userName } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "Plan ID and User ID are required" },
        { status: 400 }
      )
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

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan not found or inactive" },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "grace_period"])
      .maybeSingle()

    // If upgrading/downgrading, handle plan change
    if (existingSubscription && existingSubscription.paddle_subscription_id) {
      // Get Paddle subscription details
      try {
        const paddleSub = await paddleClient.getSubscription(existingSubscription.paddle_subscription_id)

        // Create a new subscription checkout for plan change
        const checkoutOptions = {
          items: [
            {
              price_id: plan.paddle_price_id!,
              quantity: 1,
            },
          ],
          customer_email: userEmail,
          custom_data: {
            user_id: userId,
            plan_id: planId,
            upgrade_from: existingSubscription.plan_id,
            existing_subscription_id: existingSubscription.paddle_subscription_id,
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/uygulama/abonelik?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/uygulama/premium?canceled=true`,
          passthrough: PaddleClientClass.generatePassthrough(userId, planId, {
            action: "plan_change",
            existing_subscription_id: existingSubscription.paddle_subscription_id,
          }),
        }

        const checkout = await paddleClient.createCheckoutLink(checkoutOptions)

        return NextResponse.json({
          success: true,
          checkoutUrl: checkout.url,
          isUpgrade: true,
          existingPlanId: existingSubscription.plan_id,
        })
      } catch (error) {
        console.error("[Subscription Checkout] Error getting existing Paddle subscription:", error)
        // Continue with new subscription flow
      }
    }

    // Create or update Paddle customer
    let paddleCustomer
    try {
      // Check if customer already exists
      const { data: existingPaddleCustomer } = await supabase
        .from("paddle_customers")
        .select("paddle_customer_id")
        .eq("user_id", userId)
        .single()

      if (existingPaddleCustomer) {
        paddleCustomer = await paddleClient.getCustomer(existingPaddleCustomer.paddle_customer_id)
      } else {
        // Create new customer in Paddle
        paddleCustomer = await paddleClient.createOrUpdateCustomer(
          userEmail,
          userName
        )

        // Store customer relationship
        await supabase.from("paddle_customers").insert({
          user_id: userId,
          paddle_customer_id: paddleCustomer.id,
          email: userEmail,
          name: userName,
        })
      }
    } catch (error) {
      console.error("[Subscription Checkout] Error managing Paddle customer:", error)
      return NextResponse.json(
        { error: "Failed to create or update customer" },
        { status: 500 }
      )
    }

    // Create pending subscription record
    const pendingSubscriptionId = crypto.randomUUID()
    const { error: pendingError } = await supabase
      .from("pending_subscriptions")
      .insert({
        id: pendingSubscriptionId,
        user_id: userId,
        plan_id: planId,
        token: crypto.randomUUID(),
        status: "pending",
        metadata: {
          paddle_customer_id: paddleCustomer.id,
          plan_name: plan.name,
          plan_price: plan.price,
          billing_period: plan.billing_period,
        },
      })

    if (pendingError) {
      console.error("[Subscription Checkout] Error creating pending subscription:", pendingError)
    }

    // Create Paddle checkout
    try {
      const checkoutOptions = {
        items: [
          {
            price_id: plan.paddle_price_id!,
            quantity: 1,
          },
        ],
        customer_email: userEmail,
        custom_data: {
          user_id: userId,
          plan_id: planId,
          pending_subscription_id: pendingSubscriptionId,
          customer_name: userName,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/uygulama/abonelik?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/uygulama/premium?canceled=true`,
        passthrough: PaddleClientClass.generatePassthrough(userId, planId, {
          action: "new_subscription",
          pending_subscription_id: pendingSubscriptionId,
        }),
      }

      const checkout = await paddleClient.createCheckoutLink(checkoutOptions)

      // Store checkout ID
      await supabase
        .from("pending_subscriptions")
        .update({
          subscription_reference: checkout.id,
        })
        .eq("id", pendingSubscriptionId)

      return NextResponse.json({
        success: true,
        checkoutUrl: checkout.url,
        checkoutId: checkout.id,
        pendingSubscriptionId,
        planName: plan.name,
        planPrice: plan.price,
        billingPeriod: plan.billing_period,
      })
    } catch (error) {
      console.error("[Subscription Checkout] Error creating Paddle checkout:", error)
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Subscription Checkout] Unexpected error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}