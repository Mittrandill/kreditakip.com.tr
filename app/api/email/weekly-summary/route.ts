import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"
import {
  paymentSummaryEmailTemplates,
  generateWeeklyPaymentSummaryData,
} from "@/lib/email/payment-summary-templates"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

// This endpoint should be called by a cron job every Monday
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (cron job)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get current week (Monday to Sunday)
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Monday of this week (assuming this runs on Monday)
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)

    // Calculate Sunday of this week
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const weekStart = monday.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
    const weekEnd = sunday.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })

    const weekStartDate = monday.toISOString().split("T")[0]
    const weekEndDate = sunday.toISOString().split("T")[0]

    // Get all users who have email_weekly_summary enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, email_weekly_summary")
      .eq("email_weekly_summary", true)
      .not("email", "is", null)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No users with email_weekly_summary enabled" }, { status: 200 })
    }

    const results = []

    for (const user of users) {
      try {
        // Get all payments for this user in the current week
        const { data: payments, error: paymentsError } = await supabase
          .from("payment_plans")
          .select(
            `
            id,
            installment_number,
            total_installments,
            total_payment,
            due_date,
            credits!inner (
              id,
              user_id,
              banks (
                name,
                logo_url
              )
            )
          `
          )
          .eq("credits.user_id", user.id)
          .eq("status", "pending")
          .gte("due_date", weekStartDate)
          .lte("due_date", weekEndDate)
          .order("due_date", { ascending: true })

        if (paymentsError) {
          console.error(`Error fetching payments for user ${user.id}:`, paymentsError)
          continue
        }

        // Format payment data (even if empty, we still send the email)
        const paymentItems = payments?.map((payment: any) => ({
          bankName: payment.credits?.banks?.name || "Bilinmeyen Banka",
          bankLogo: payment.credits?.banks?.logo_url,
          installmentNumber: payment.installment_number,
          totalInstallments: payment.total_installments,
          amount: payment.total_payment,
          dueDate: payment.due_date,
        })) || []

        // Generate email data
        const customerName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Değerli Kullanıcı"
        const emailData = generateWeeklyPaymentSummaryData(customerName, weekStart, weekEnd, paymentItems)

        // Send email
        const emailResult = await sendEmail({
          to: user.email!,
          subject: paymentSummaryEmailTemplates.weekly.subject(weekStart, weekEnd),
          html: paymentSummaryEmailTemplates.weekly.html(emailData),
        })

        results.push({
          userId: user.id,
          email: user.email,
          status: emailResult ? "sent" : "failed",
          paymentCount: paymentItems.length,
        })
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      weekStart,
      weekEnd,
      processedUsers: results.length,
      results,
    })
  } catch (error) {
    console.error("Weekly summary email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
