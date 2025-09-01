import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Cron job started at:", new Date().toISOString())

    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const { searchParams } = new URL(request.url)
    const secretParam = searchParams.get("secret")
    const testMode = searchParams.get("test") === "true"

    console.log("[v0] Auth header present:", !!authHeader)
    console.log("[v0] Secret param present:", !!secretParam)
    console.log("[v0] Test mode:", testMode)
    console.log("[v0] CRON_SECRET present:", !!cronSecret)
    console.log("[v0] CRON_SECRET length:", cronSecret?.length || 0)

    if (!cronSecret) {
      console.error("[v0] CRON_SECRET environment variable not set")
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
    }

    let isAuthenticated = false

    if (testMode) {
      isAuthenticated = true
      console.log("[v0] Running in TEST MODE - no authentication required")
    } else if (authHeader) {
      const expectedAuth = `Bearer ${cronSecret}`
      isAuthenticated = authHeader === expectedAuth
    } else if (secretParam) {
      isAuthenticated = secretParam === cronSecret
    }

    if (!isAuthenticated) {
      console.log("[v0] Authentication failed")
      if (authHeader) {
        console.log("[v0] Auth header mismatch")
        console.log("[v0] Expected format: Bearer [SECRET]")
        console.log("[v0] Received format:", authHeader.substring(0, 20) + "...")
      }
      if (secretParam) {
        console.log("[v0] Secret param mismatch")
      }
      return NextResponse.json(
        {
          error: "Unauthorized",
          hint: "Use ?test=true for testing without authentication",
        },
        { status: 401 },
      )
    }

    console.log("[v0] Authentication successful")

    if (!process.env.MAILERSEND_API_KEY) {
      console.error("[v0] MAILERSEND_API_KEY environment variable not set")
      return NextResponse.json({ error: "MAILERSEND_API_KEY not configured" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"

    const { data: users, error: usersError } = await supabase.from("profiles").select("id").not("email", "is", null)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    console.log(`[v0] Found ${users.length} users with email addresses`)

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

    for (const user of users) {
      try {
        const notificationTypes = ["3_days_before", "1_day_before", "due_date", "overdue"]

        for (const type of notificationTypes) {
          const response = await fetch(`${baseUrl}/api/notifications/send-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, type }),
          })

          if (response.ok) {
            const result = await response.json()
            results.notifications[type] += result.emailsSent || 0
          } else {
            console.error(`Failed to send ${type} notification for user ${user.id}:`, await response.text())
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.errors.push({
          userId: user.id,
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
      testMode,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Cron job completed. ${totalSent} emails sent to ${results.totalUsers} users.`,
      testMode,
      results,
    })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
