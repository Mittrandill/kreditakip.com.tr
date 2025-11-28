import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendManualPaymentReminder } from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Subscription Reminder Cron Job
 *
 * Sends manual payment reminders to users whose subscriptions are expiring soon
 * Runs daily via Vercel Cron or GitHub Actions
 *
 * Logic:
 * 1. Find all active subscriptions expiring in 7 days
 * 2. Send reminder email to each user
 * 3. Mark subscription with reminder_sent_at timestamp
 */
async function handler(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[subscription-reminder] Unauthorized request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all active premium subscriptions expiring in 7 days
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const eightDaysFromNow = new Date()
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8)

    const { data: expiringSubscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email
        ),
        subscription_plans:plan_id (
          name,
          price,
          currency
        )
      `)
      .eq("status", "active")
      .in("plan_type", ["premium", "pro"])
      .gte("expires_at", sevenDaysFromNow.toISOString())
      .lt("expires_at", eightDaysFromNow.toISOString())
      .is("reminder_sent_at", null)

    if (subError) {
      console.error("[subscription-reminder] Error fetching subscriptions:", subError)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      console.log("[subscription-reminder] No subscriptions expiring in 7 days")
      return NextResponse.json({
        success: true,
        message: "No reminders to send",
        count: 0
      })
    }

    let sentCount = 0
    let failedCount = 0

    // Send reminder emails
    for (const subscription of expiringSubscriptions) {
      try {
        const profile = subscription.profiles as any
        const plan = subscription.subscription_plans as any

        if (!profile || !plan) {
          console.warn("[subscription-reminder] Missing profile or plan data for subscription:", subscription.id)
          failedCount++
          continue
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kreditakip.com.tr"
        const paymentUrl = `${baseUrl}/uygulama/ayarlar?tab=subscription`

        // Send reminder email
        const emailResult = await sendManualPaymentReminder({
          userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Kullanıcı",
          userEmail: profile.email,
          planName: plan.name,
          amount: plan.price,
          currency: plan.currency || "TRY",
          expiresAt: subscription.expires_at,
          daysUntilExpiry: 7,
          paymentUrl,
        })

        if (emailResult.success) {
          // Mark reminder as sent
          await supabase
            .from("subscriptions")
            .update({
              reminder_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id)

          sentCount++
          console.log(`[subscription-reminder] Sent reminder to ${profile.email}`)
        } else {
          failedCount++
          console.error(`[subscription-reminder] Failed to send reminder to ${profile.email}:`, emailResult.error)
        }
      } catch (error) {
        failedCount++
        console.error("[subscription-reminder] Error processing subscription:", error)
      }
    }

    console.log(`[subscription-reminder] Completed: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminders, ${failedCount} failed`,
      sent: sentCount,
      failed: failedCount,
    })
  } catch (error: any) {
    console.error("[subscription-reminder] Cron job error:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}

// Support both GET (Vercel Cron) and POST (GitHub Actions)
export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
