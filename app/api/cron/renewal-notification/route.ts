import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendUpcomingRenewalNotification } from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Renewal Notification Cron Job (Paddle)
 *
 * This endpoint runs daily and:
 * 1. Finds active subscriptions expiring in 3 days
 * 2. Sends "your subscription will renew" emails to users
 * 3. Includes cancellation link for transparency
 *
 * Note: Paddle handles automatic renewal - we just notify users
 * Vercel Cron: Runs daily at 10:00 UTC (13:00 TR)
 */
export async function GET(request: NextRequest) {
  try {
    // Cron secret validation - try both Authorization and X-Cron-Secret headers
    const authHeader = request.headers.get("authorization")
    const customHeader = request.headers.get("x-cron-secret")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
      const isValidAuth = authHeader === `Bearer ${cronSecret}`
      const isValidCustom = customHeader === cronSecret

      if (!isValidAuth && !isValidCustom) {
        console.error("[renewal-notification] Unauthorized cron request")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Find subscriptions expiring in exactly 3 days
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const threeDaysLaterStart = new Date(threeDaysLater.setHours(0, 0, 0, 0))
    const threeDaysLaterEnd = new Date(threeDaysLater.setHours(23, 59, 59, 999))

    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans (*),
        profiles (id, email, first_name, last_name),
        paddle_customers (paddle_customer_id)
      `)
      .eq("status", "active")
      .in("plan_type", ["premium", "pro"])
      .gte("expires_at", threeDaysLaterStart.toISOString())
      .lte("expires_at", threeDaysLaterEnd.toISOString())
      .not("paddle_subscription_id", "is", null) // Only Paddle subscriptions

    if (fetchError) {
      console.error("[renewal-notification] Error fetching subscriptions:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions to notify",
        processed: 0,
      })
    }

    const results = {
      processed: 0,
      notified: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const subscription of expiringSubscriptions) {
      try {
        const userId = subscription.user_id
        const plan = subscription.subscription_plans
        const profile = subscription.profiles

        if (!plan || !profile?.email) {
          results.skipped++
          continue
        }

        // Paddle manages payment methods - no need to check saved cards
        // Send notification email
        results.processed++

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
        const emailResult = await sendUpcomingRenewalNotification({
          userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
          userEmail: profile.email,
          planName: plan.name,
          amount: plan.price,
          currency: plan.currency || "TRY",
          renewalDate: subscription.expires_at,
          // Paddle handles payment method - don't show card details
          last4: "****", // Paddle manages this
          cancelUrl: subscription.cancel_url || `${baseUrl}/uygulama/ayarlar?action=cancel-subscription`,
        })

        if (emailResult.success) {
          results.notified++
          console.log(`[renewal-notification] Notification sent to ${profile.email}`)
        } else {
          console.error(
            `[renewal-notification] Failed to send email to ${profile.email}:`,
            emailResult.error
          )
          results.failed++
          results.errors.push(`${profile.email}: ${emailResult.error}`)
        }
      } catch (error: any) {
        console.error(`[renewal-notification] Error processing subscription:`, error)
        results.failed++
        results.errors.push(error.message || "Unknown error")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification process completed",
      results,
    })
  } catch (error: any) {
    console.error("[renewal-notification] Cron job error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// Also support POST method (for GitHub Actions)
export async function POST(request: NextRequest) {
  return GET(request)
}
