import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import {
  paymentSummaryEmailTemplates,
  generateMonthlyPaymentSummaryData,
  generateWeeklyPaymentSummaryData,
} from "@/lib/email/payment-summary-templates"

export const dynamic = "force-dynamic"

// Test endpoint to preview email templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "monthly" // monthly or weekly
    const email = searchParams.get("email") // Test email address

    // Sample payment data
    const samplePayments = [
      {
        bankName: "Ziraat Bankası",
        bankLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Ziraat-Bankasi-logo.svg/200px-Ziraat-Bankasi-logo.svg.png",
        installmentNumber: 5,
        totalInstallments: 12,
        amount: 2500,
        dueDate: "2024-12-15",
      },
      {
        bankName: "İş Bankası",
        bankLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Turkiye_Is_Bankasi_logo.svg/200px-Turkiye_Is_Bankasi_logo.svg.png",
        installmentNumber: 8,
        totalInstallments: 24,
        amount: 1800,
        dueDate: "2024-12-20",
      },
      {
        bankName: "Garanti BBVA",
        bankLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Garanti_BBVA_logo.svg/200px-Garanti_BBVA_logo.svg.png",
        installmentNumber: 3,
        totalInstallments: 6,
        amount: 3200,
        dueDate: "2024-12-25",
      },
    ]

    let htmlContent = ""
    let subject = ""

    if (type === "monthly") {
      const data = generateMonthlyPaymentSummaryData(
        "Test Kullanıcı",
        "Aralık",
        "2024",
        samplePayments
      )
      htmlContent = paymentSummaryEmailTemplates.monthly.html(data)
      subject = paymentSummaryEmailTemplates.monthly.subject("Aralık", "2024")
    } else {
      const data = generateWeeklyPaymentSummaryData(
        "Test Kullanıcı",
        "2 Aralık",
        "8 Aralık",
        samplePayments
      )
      htmlContent = paymentSummaryEmailTemplates.weekly.html(data)
      subject = paymentSummaryEmailTemplates.weekly.subject("2 Aralık", "8 Aralık")
    }

    // If email provided, send the test email
    if (email) {
      await sendEmail({
        to: email,
        subject: `[TEST] ${subject}`,
        html: htmlContent,
      })

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
        type,
      })
    }

    // Otherwise, return HTML for preview
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      { error: "Failed to generate test email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
