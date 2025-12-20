import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { paddleClient } from "@/lib/paddle-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET: Get subscription management URLs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle()

    if (error || !subscription || !subscription.paddle_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      )
    }

    // Get management URLs from Paddle
    try {
      const managementUrls = await paddleClient.getSubscriptionManagementUrls(
        subscription.paddle_subscription_id
      )

      // Update database with latest URLs
      await supabase
        .from("subscriptions")
        .update({
          cancel_url: managementUrls.cancel,
          update_url: managementUrls.update_payment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      return NextResponse.json({
        success: true,
        managementUrls,
        subscription: {
          id: subscription.id,
          planId: subscription.plan_id,
          status: subscription.status,
          expiresAt: subscription.expires_at,
        },
      })
    } catch (paddleError) {
      console.error("[Subscription Manage] Error getting management URLs:", paddleError)

      // Return cached URLs if available
      if (subscription.cancel_url || subscription.update_url) {
        return NextResponse.json({
          success: true,
          managementUrls: {
            cancel: subscription.cancel_url || "",
            update_payment: subscription.update_url || "",
            manage: "",
          },
          subscription: {
            id: subscription.id,
            planId: subscription.plan_id,
            status: subscription.status,
            expiresAt: subscription.expires_at,
          },
          cached: true,
        })
      }

      return NextResponse.json(
        { error: "Failed to get management URLs" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Subscription Manage] Unexpected error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Update subscription (pause, resume, cancel)
export async function POST(request: NextRequest) {
  try {
    const { userId, action, subscriptionId, options } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
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

    // Get subscription
    let subId = subscriptionId
    if (!subId) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id, paddle_subscription_id")
        .eq("user_id", userId)
        .in("status", ["active", "trialing", "paused"])
        .single()

      subId = subscription?.paddle_subscription_id
    }

    if (!subId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      )
    }

    // Perform action based on request
    let updatedSubscription
    let updateData: any = {}

    switch (action) {
      case "cancel":
        updatedSubscription = await paddleClient.cancelSubscription(subId, {
          effective_from: options?.effectiveFrom || "next_billing_period",
        })
        updateData = {
          status: "canceled",
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        break

      case "pause":
        const pauseMode = options?.mode || "fixed"
        const resumeDate = options?.resumeDate

        updatedSubscription = await paddleClient.updateSubscription(subId, {
          pause: {
            mode: pauseMode,
            ...(pauseMode === "fixed" && resumeDate && { resumes_at: resumeDate }),
          },
        })
        updateData = {
          status: "paused",
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        break

      case "resume":
        updatedSubscription = await paddleClient.updateSubscription(subId, {
          resume: true,
        })
        updateData = {
          status: "active",
          paused_at: null,
          updated_at: new Date().toISOString(),
        }
        break

      case "change_plan":
        if (!options?.newPriceId) {
          return NextResponse.json(
            { error: "New price ID is required for plan change" },
            { status: 400 }
          )
        }

        updatedSubscription = await paddleClient.updateSubscription(subId, {
          items: [
            {
              price_id: options.newPriceId,
              quantity: 1,
            },
          ],
        })
        updateData = {
          paddle_plan_id: options.newPriceId,
          status: "active",
          updated_at: new Date().toISOString(),
          next_billing_plan: options.planId,
        }
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    // Update subscription in database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("paddle_subscription_id", subId)

    if (updateError) {
      console.error("[Subscription Manage] Error updating subscription:", updateError)
    }

    // Send notification email if needed
    if (action === "canceled") {
      const { data: userSubscription } = await supabase
        .from("subscriptions")
        .select(`
          *,
          users!inner(email)
        `)
        .eq("paddle_subscription_id", subId)
        .single()

      if (userSubscription?.users?.email) {
        // Cancellation email is handled by webhook
      }
    }

    return NextResponse.json({
      success: true,
      action,
      subscription: updatedSubscription,
    })
  } catch (error: any) {
    console.error("[Subscription Manage] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}