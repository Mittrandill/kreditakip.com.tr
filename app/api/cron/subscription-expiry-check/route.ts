import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Subscription Expiry Check Cron Job
 *
 * Checks for expired subscriptions and downgrades them to free
 * Runs daily via Vercel Cron or GitHub Actions
 *
 * Logic:
 * 1. Find all active premium subscriptions that expired
 * 2. Check if reminder was sent (reminder_sent_at)
 * 3. If reminder was sent more than 7 days ago, downgrade to free
 * 4. Reset usage limits to free tier
 */
async function handler(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[subscription-expiry-check] Unauthorized request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const now = new Date()

    // Get all active premium subscriptions that have expired
    // Note: We check both with and without reminder_sent_at
    const { data: expiredSubscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .eq("plan_type", "premium")
      .lt("expires_at", now.toISOString())

    if (subError) {
      console.error("[subscription-expiry-check] Error fetching subscriptions:", subError)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log("[subscription-expiry-check] No expired subscriptions to process")
      return NextResponse.json({
        success: true,
        message: "No expired subscriptions to process",
        count: 0
      })
    }

    let downgradedCount = 0
    let failedCount = 0

    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        const reminderSentAt = subscription.reminder_sent_at ? new Date(subscription.reminder_sent_at) : null
        const expiresAt = new Date(subscription.expires_at)

        // Check if 7 days have passed since reminder was sent
        // OR if subscription expired more than 7 days ago (safety check)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const shouldDowngrade =
          (reminderSentAt && reminderSentAt <= sevenDaysAgo) ||
          (expiresAt <= sevenDaysAgo)

        if (!shouldDowngrade) {
          console.log(`[subscription-expiry-check] Subscription ${subscription.id} not ready for downgrade yet`)
          continue
        }

        // Downgrade to free plan
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            plan_type: "free",
            plan_id: "free",
            updated_at: now.toISOString(),
          })
          .eq("id", subscription.id)

        if (updateError) {
          console.error(`[subscription-expiry-check] Failed to update subscription ${subscription.id}:`, updateError)
          failedCount++
          continue
        }

        // Reset usage limits to free tier
        // Free tier: OCR unlimited (-1), Risk Analysis 0
        const { error: usageError } = await supabase.from("usage_tracking").upsert(
          [
            {
              user_id: subscription.user_id,
              feature_type: "ocr_analysis",
              limit_count: -1, // unlimited for free
              used_count: 0,
              reset_at: null,
              updated_at: now.toISOString(),
            },
            {
              user_id: subscription.user_id,
              feature_type: "risk_analysis",
              limit_count: 0, // no risk analysis for free
              used_count: 0,
              reset_at: null,
              updated_at: now.toISOString(),
            },
          ],
          { onConflict: "user_id,feature_type" },
        )

        if (usageError) {
          console.error(`[subscription-expiry-check] Failed to reset usage for user ${subscription.user_id}:`, usageError)
          // Don't count as failed since subscription was updated
        }

        downgradedCount++
        console.log(`[subscription-expiry-check] Downgraded subscription ${subscription.id} to free`)
      } catch (error) {
        failedCount++
        console.error("[subscription-expiry-check] Error processing subscription:", error)
      }
    }

    console.log(`[subscription-expiry-check] Completed: ${downgradedCount} downgraded, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Downgraded ${downgradedCount} subscriptions, ${failedCount} failed`,
      downgraded: downgradedCount,
      failed: failedCount,
    })
  } catch (error: any) {
    console.error("[subscription-expiry-check] Cron job error:", error)
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
