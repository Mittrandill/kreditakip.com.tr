import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendUpcomingRenewalNotification } from "@/lib/email/subscription-notification"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

/**
 * Yenileme Bildirimi Cron Job
 *
 * Bu endpoint her gün çalışır ve:
 * 1. Süresi 3 gün sonra dolacak aktif abonelikleri bulur
 * 2. Kullanıcılara "aboneliğiniz yenilenecek" email'i gönderir
 * 3. İptal linkiyle birlikte bilgilendirme yapar
 *
 * Vercel Cron: Her gün 10:00 UTC'de çalışır (13:00 TR)
 */
export async function GET(request: NextRequest) {
  try {
    // Cron secret doğrulama - try both Authorization and X-Cron-Secret headers
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

    // Tam olarak 3 gün sonra dolacak abonelikleri bul
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const threeDaysLaterStart = new Date(threeDaysLater.setHours(0, 0, 0, 0))
    const threeDaysLaterEnd = new Date(threeDaysLater.setHours(23, 59, 59, 999))

    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans (*),
        profiles (id, email, first_name, last_name)
      `)
      .eq("status", "active")
      .in("plan_type", ["premium", "pro"])
      .gte("expires_at", threeDaysLaterStart.toISOString())
      .lte("expires_at", threeDaysLaterEnd.toISOString())

    if (fetchError) {
      console.error("[renewal-notification] Error fetching subscriptions:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions to notify",
        processed: 0
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

        // Kullanıcının kayıtlı kartını bul
        const { data: savedCard } = await supabase
          .from("paytr_saved_cards")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .eq("is_default", true)
          .single()

        if (!savedCard) {
          results.skipped++
          continue
        }

        results.processed++

        // Email gönder
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
        const emailResult = await sendUpcomingRenewalNotification({
          userName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
          userEmail: profile.email,
          planName: plan.name,
          amount: plan.price,
          currency: plan.currency || "TRY",
          renewalDate: subscription.expires_at,
          last4: savedCard.last_4,
          cancelUrl: `${baseUrl}/uygulama/ayarlar?action=cancel-subscription`,
        })

        if (emailResult.success) {
          results.notified++
        } else {
          console.error(`[renewal-notification] Failed to send email to ${profile.email}:`, emailResult.error)
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
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST metodu da destekle (GitHub Actions için)
export async function POST(request: NextRequest) {
  return GET(request)
}
