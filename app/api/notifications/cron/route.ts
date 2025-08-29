import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Cron job started at:", new Date().toISOString())

    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log("[v0] Cron job unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.CRON_SECRET) {
      console.error("[v0] CRON_SECRET environment variable not set")
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
    }

    if (!process.env.MAILERSEND_API_KEY) {
      console.error("[v0] MAILERSEND_API_KEY environment variable not set")
      return NextResponse.json({ error: "MAILERSEND_API_KEY not configured" }, { status: 500 })
    }

    // Get base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"

    // Aktif kullanıcıları al (e-posta bildirimleri açık olanlar)
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
      notifications: {
        "3_days_before": 0,
        "1_day_before": 0,
        due_date: 0,
        overdue: 0,
      },
      errors: [],
    }

    // Her kullanıcı için bildirimleri kontrol et ve gönder
    for (const user of users) {
      try {
        // 3 gün önceden bildirim
        if (user.email_3_days_before) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "3_days_before" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["3_days_before"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send 3_days_before notification for user ${user.user_id}:`, await response.text())
          }
        }

        // 1 gün önceden bildirim
        if (user.email_1_day_before) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "1_day_before" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["1_day_before"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send 1_day_before notification for user ${user.user_id}:`, await response.text())
          }
        }

        // Vade günü bildirim
        if (user.email_on_due_date) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "due_date" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["due_date"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send due_date notification for user ${user.user_id}:`, await response.text())
          }
        }

        // Gecikme bildirim
        if (user.email_overdue) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.user_id, type: "overdue" }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications["overdue"] += result.emailsSent || 0
          } else {
            console.error(`Failed to send overdue notification for user ${user.user_id}:`, await response.text())
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error)
        results.errors.push({
          userId: user.user_id,
          error: error.message,
        })
      }
    }

    const totalSent = Object.values(results.notifications).reduce((sum, count) => sum + count, 0)

    console.log(`[v0] Cron job completed successfully:`, {
      totalUsers: results.totalUsers,
      totalEmailsSent: totalSent,
      breakdown: results.notifications,
      errors: results.errors.length,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Cron job completed. ${totalSent} emails sent to ${results.totalUsers} users.`,
      results,
    })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
