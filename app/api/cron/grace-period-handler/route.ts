import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  sendGracePeriodStartNotification,
  sendGracePeriodEndingNotification,
} from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Grace Period Handler Cron - Runs daily at 11:00 UTC (14:00 TR)
 *
 * Responsibilities:
 * A. Start grace period for expired subscriptions
 * B. Send reminder emails (day 0 and day 6)
 * C. Suspend subscriptions after grace period ends
 */
export async function GET(request: NextRequest) {
  try {
    // Cron secret validation
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[grace-period-handler] Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[grace-period-handler] Starting grace period management...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const now = new Date()
    const results = {
      grace_periods_started: 0,
      day_0_reminders: 0,
      day_6_reminders: 0,
      subscriptions_suspended: 0,
      errors: [] as string[],
    }

    // A. START GRACE PERIOD for expired subscriptions
    const { data: expiredSubs, error: fetchError1 } = await supabase
      .from("subscriptions")
      .select("*, subscription_plans(*), profiles(id, email, first_name, last_name)")
      .eq("status", "active")
      .in("plan_type", ["premium", "pro"])
      .lte("expires_at", now.toISOString())
      .is("grace_period_started_at", null)

    if (fetchError1) {
      console.error("[grace-period-handler] Error fetching expired subs:", fetchError1)
    } else if (expiredSubs && expiredSubs.length > 0) {
      console.log(`[grace-period-handler] Starting grace period for ${expiredSubs.length} subscriptions`)

      for (const sub of expiredSubs) {
        try {
          const gracePeriodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 days

          // Update subscription
          await supabase
            .from("subscriptions")
            .update({
              grace_period_started_at: now.toISOString(),
              grace_period_ends_at: gracePeriodEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", sub.id)

          results.grace_periods_started++

          // Send day 0 reminder email
          if (sub.profiles?.email && sub.subscription_plans) {
            await sendGracePeriodStartNotification({
              userName: `${sub.profiles.first_name || ""} ${sub.profiles.last_name || ""}`.trim() || sub.profiles.email,
              userEmail: sub.profiles.email,
              planName: sub.subscription_plans.name,
              expiresAt: sub.expires_at,
              gracePeriodEndsAt: gracePeriodEnd.toISOString(),
              daysRemaining: 7,
            })
            results.day_0_reminders++
          }
        } catch (error: any) {
          console.error(`[grace-period-handler] Error starting grace period for ${sub.id}:`, error)
          results.errors.push(`Subscription ${sub.id}: ${error.message}`)
        }
      }
    }

    // B. SEND DAY 6 REMINDERS (24 hours before grace period ends)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { data: endingSubs, error: fetchError2 } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans(*),
        profiles(id, email, first_name, last_name),
        pending_renewal_payments(*)
      `)
      .eq("status", "active")
      .not("grace_period_ends_at", "is", null)
      .gte("grace_period_ends_at", tomorrow.toISOString())
      .lte("grace_period_ends_at", dayAfterTomorrow.toISOString())

    if (fetchError2) {
      console.error("[grace-period-handler] Error fetching ending subs:", fetchError2)
    } else if (endingSubs && endingSubs.length > 0) {
      console.log(`[grace-period-handler] Sending day 6 reminders to ${endingSubs.length} users`)

      for (const sub of endingSubs) {
        try {
          if (sub.profiles?.email && sub.subscription_plans) {
            // Get pending payment URL if exists
            const pendingPayments = sub.pending_renewal_payments || []
            const pendingPayment = pendingPayments.find((p: any) => p.status === "pending")
            const paymentUrl = pendingPayment?.payment_url || null

            await sendGracePeriodEndingNotification({
              userName: `${sub.profiles.first_name || ""} ${sub.profiles.last_name || ""}`.trim() || sub.profiles.email,
              userEmail: sub.profiles.email,
              planName: sub.subscription_plans.name,
              gracePeriodEndsAt: sub.grace_period_ends_at,
              hoursRemaining: 24,
              paymentUrl,
            })
            results.day_6_reminders++
          }
        } catch (error: any) {
          console.error(`[grace-period-handler] Error sending day 6 reminder for ${sub.id}:`, error)
          results.errors.push(`Day 6 reminder ${sub.id}: ${error.message}`)
        }
      }
    }

    // C. SUSPEND subscriptions where grace period has ended
    const { data: expiredGrace, error: fetchError3 } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .not("grace_period_ends_at", "is", null)
      .lte("grace_period_ends_at", now.toISOString())

    if (fetchError3) {
      console.error("[grace-period-handler] Error fetching expired grace:", fetchError3)
    } else if (expiredGrace && expiredGrace.length > 0) {
      console.log(`[grace-period-handler] Suspending ${expiredGrace.length} subscriptions`)

      for (const sub of expiredGrace) {
        try {
          // Update subscription to suspended
          await supabase
            .from("subscriptions")
            .update({
              status: "suspended",
              suspended_at: now.toISOString(),
              requires_payment_action: false,
              updated_at: now.toISOString(),
            })
            .eq("id", sub.id)

          // Reset usage limits to free tier
          await supabase
            .from("usage_tracking")
            .update({
              limit_count: 0,
              updated_at: now.toISOString(),
            })
            .eq("user_id", sub.user_id)
            .eq("feature_type", "risk_analysis")

          // Expire pending renewals
          await supabase
            .from("pending_renewal_payments")
            .update({
              status: "expired",
              error_message: "Grace period expired without payment",
            })
            .eq("subscription_id", sub.id)
            .eq("status", "pending")

          results.subscriptions_suspended++
        } catch (error: any) {
          console.error(`[grace-period-handler] Error suspending ${sub.id}:`, error)
          results.errors.push(`Suspend ${sub.id}: ${error.message}`)
        }
      }
    }

    console.log("[grace-period-handler] Completed:", results)

    return NextResponse.json({
      success: true,
      message: "Grace period management completed",
      results,
    })
  } catch (error: any) {
    console.error("[grace-period-handler] Fatal error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
