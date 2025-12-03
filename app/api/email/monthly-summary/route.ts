import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"
import {
  paymentSummaryEmailTemplates,
  generateMonthlyPaymentSummaryData,
} from "@/lib/email/payment-summary-templates"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!

// This endpoint should be called by a cron job on the 1st of each month
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

    // Get current month and year
    const now = new Date()
    const month = now.toLocaleDateString("tr-TR", { month: "long" })
    const year = now.getFullYear().toString()
    const monthNumber = now.getMonth() + 1
    const yearNumber = now.getFullYear()

    // Get first and last day of the month
    const firstDay = new Date(yearNumber, monthNumber - 1, 1).toISOString().split("T")[0]
    const lastDay = new Date(yearNumber, monthNumber, 0).toISOString().split("T")[0]

    // Get all users who have email_monthly_summary enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, email_monthly_summary")
      .eq("email_monthly_summary", true)
      .not("email", "is", null)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No users with email_monthly_summary enabled" }, { status: 200 })
    }

    const results = []

    for (const user of users) {
      try {
        // Get all payments for this user in the current month
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
          .gte("due_date", firstDay)
          .lte("due_date", lastDay)
          .order("due_date", { ascending: true })

        if (paymentsError) {
          console.error(`Error fetching payments for user ${user.id}:`, paymentsError)
          continue
        }

        // Skip if no payments this month
        if (!payments || payments.length === 0) {
          results.push({
            userId: user.id,
            email: user.email,
            status: "skipped",
            reason: "no_payments",
          })
          continue
        }

        // Format payment data
        const paymentItems = payments.map((payment: any) => ({
          bankName: payment.credits?.banks?.name || "Bilinmeyen Banka",
          bankLogo: payment.credits?.banks?.logo_url,
          installmentNumber: payment.installment_number,
          totalInstallments: payment.total_installments,
          amount: payment.total_payment,
          dueDate: payment.due_date,
        }))

        // Generate email data
        const customerName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Değerli Kullanıcı"
        const emailData = generateMonthlyPaymentSummaryData(customerName, month, year, paymentItems)

        // Send email
        const emailResult = await sendEmail({
          to: user.email!,
          subject: paymentSummaryEmailTemplates.monthly.subject(month, year),
          html: paymentSummaryEmailTemplates.monthly.html(emailData),
        })

        results.push({
          userId: user.id,
          email: user.email,
          status: emailResult ? "sent" : "failed",
          paymentCount: payments.length,
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
      month,
      year,
      processedUsers: results.length,
      results,
    })
  } catch (error) {
    console.error("Monthly summary email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
