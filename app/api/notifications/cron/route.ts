import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { timingSafeEqual } from "node:crypto"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {

    // SECURITY FIX: Remove test mode bypass and query parameter authentication
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")


    if (!cronSecret) {
      console.error("[v0] CRON_SECRET environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Only accept Bearer token in Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Use constant-time comparison to prevent timing attacks
    let isAuthenticated = false
    try {
      // Create buffers of equal length for constant-time comparison
      const tokenBuffer = Buffer.from(token)
      const secretBuffer = Buffer.from(cronSecret)

      if (tokenBuffer.length === secretBuffer.length) {
        isAuthenticated = timingSafeEqual(new Uint8Array(tokenBuffer), new Uint8Array(secretBuffer))
      }
    } catch (error) {
      console.error("[v0] Error during authentication:", error)
      isAuthenticated = false
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    if (!process.env.MAILERSEND_API_KEY) {
      console.error("[v0] MAILERSEND_API_KEY environment variable not set")
      return NextResponse.json({ error: "MAILERSEND_API_KEY not configured" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"

    const supabase = createSupabaseAdmin()
    const { data: users, error: usersError } = await supabase
      .from("notification_preferences")
      .select("user_id, email_3_days_before, email_1_day_before, email_on_due_date, email_overdue")
      .eq("email_enabled", true)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const results = {
      totalUsers: users.length,
      emailNotifications: {
        "3_days_before": 0,
        "1_day_before": 0,
        due_date: 0,
        overdue: 0,
      },
      errors: [] as Array<{ userId: string; error: string }>,
    }

    // NOT: Uygulama içi bildirimler GitHub Actions workflow tarafından oluşturuluyor
    // Bu endpoint sadece email bildirimleri için kullanılıyor

    // Email tercihine göre email bildirimleri gönder
    console.log("[cron] Sending email notifications...")
    for (const user of users) {
      try {
        if (user.email_3_days_before) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "3_days_before" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.emailNotifications["3_days_before"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send 3_days_before notification for user ${user.user_id}:`, await response.text())
          }
        }

        if (user.email_1_day_before) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "1_day_before" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.emailNotifications["1_day_before"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send 1_day_before notification for user ${user.user_id}:`, await response.text())
          }
        }

        if (user.email_on_due_date) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "due_date" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.emailNotifications["due_date"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send due_date notification for user ${user.user_id}:`, await response.text())
          }
        }

        if (user.email_overdue) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "overdue" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.emailNotifications["overdue"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send overdue notification for user ${user.user_id}:`, await response.text())
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error)
        results.errors.push({
          userId: user.user_id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const totalEmails = Object.values(results.emailNotifications).reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      message: `Cron job completed. ${totalEmails} emails sent to ${results.totalUsers} users.`,
      results,
    })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
