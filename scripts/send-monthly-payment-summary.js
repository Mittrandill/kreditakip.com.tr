const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend")
const { createClient } = require("@supabase/supabase-js")

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Email template helper
function generateMonthlyEmailTemplate(data) {
  const { customerName, month, year, payments, totalAmount } = data

  return {
    subject: `${month} ${year} - Aylık Ödeme Planı Özeti`,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; }
        .greeting { color: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0d9488 100%); padding: 48px 40px; text-align: center; border-radius: 12px 12px 0 0; }
        .logo { max-width: 203px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1); }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { background: #1e293b; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #334155; }
        .summary-box { background: linear-gradient(145deg, #334155 0%, #475569 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .summary-box h3 { margin: 0 0 10px 0; color: #ffffff; font-size: 16px; }
        .summary-box .total { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
        .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .payment-table thead { background: #334155; }
        .payment-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        .payment-table td { padding: 16px 12px; border-bottom: 1px solid #334155; }
        .payment-table tr:last-child td { border-bottom: none; }
        .bank-cell { display: flex; align-items: center; gap: 12px; }
        .bank-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; background: white; padding: 4px; }
        .bank-name { font-weight: 600; color: #ffffff; font-size: 14px; }
        .installment-badge { background: #334155; color: #94a3b8; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .amount { font-weight: 700; color: #ffffff; font-size: 16px; }
        .due-date { color: #94a3b8; font-size: 13px; }
        .footer { text-align: center; padding: 40px; background: #0f172a; border-top: 1px solid #334155; margin-top: 0; color: #64748b; font-size: 14px; }
        .footer-logo { width: 108px; height: auto; margin-bottom: 20px; opacity: 0.8; }
        .footer-text { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        .copyright { font-size: 11px; color: #475569; border-top: 1px solid #334155; padding-top: 20px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .info-text { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="logo">
            <h1>📅 ${month} ${year} Ödeme Planı</h1>
            <p>Bu ay yapmanız gereken ödemeler</p>
        </div>
        <div class="content">
            <p class="greeting">Merhaba <strong>${customerName}</strong>,</p>

            <p class="info-text">${month} ${year} ayında yapmanız gereken ${payments.length} ödeme bulunmaktadır. Aşağıda detaylı ödeme planınızı bulabilirsiniz:</p>

            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Banka</th>
                        <th style="text-align: center;">Taksit</th>
                        <th style="text-align: right;">Tutar</th>
                        <th style="text-align: right;">Vade Tarihi</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(payment => `
                    <tr>
                        <td>
                            <div class="bank-cell">
                                ${payment.bankLogo ? `<img src="${payment.bankLogo}" alt="${payment.bankName}" class="bank-logo" onerror="this.style.display='none'">` : ''}
                                <span class="bank-name">${payment.bankName}</span>
                            </div>
                        </td>
                        <td style="text-align: center;">
                            <span class="installment-badge">${payment.installmentNumber}/${payment.totalInstallments}</span>
                        </td>
                        <td style="text-align: right;">
                            <span class="amount">${payment.amount.toLocaleString('tr-TR')} ₺</span>
                        </td>
                        <td style="text-align: right;">
                            <span class="due-date">${new Date(payment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary-box">
                <h3>💰 Toplam Ödeme Tutarı</h3>
                <p class="total">${totalAmount.toLocaleString('tr-TR')} ₺</p>
            </div>

            <p class="info-text">💡 <strong>Hatırlatma:</strong> Ödemelerinizi zamanında yaparak gecikme faizlerinden kaçının ve kredi skorunuzu koruyun.</p>

            <center>
                <a href="https://www.kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">Ödeme Planını Görüntüle</a>
            </center>
        </div>

        <div class="footer">
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="footer-logo">

            <p class="footer-text">
                Bu e-posta otomatik olarak gönderilmiştir.<br>
                E-posta bildirimlerini almak istemiyorsanız, ayarlar sayfasından kapatabilirsiniz.
            </p>

            <div class="copyright">
                © 2025 kreditakip.com.tr • Tüm hakları saklıdır
            </div>
        </div>
    </div>
</body>
</html>
    `,
  }
}

async function sendMonthlyPaymentSummary() {
  try {
    console.log("🚀 Monthly payment summary workflow started")

    if (!process.env.MAILERSEND_API_KEY) {
      throw new Error("MAILERSEND_API_KEY not configured")
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured")
    }

    if (!process.env.SERVICE_ROLE_KEY) {
      throw new Error("SERVICE_ROLE_KEY not configured")
    }

    // Get current month and year
    const now = new Date()
    const month = now.toLocaleDateString("tr-TR", { month: "long" })
    const year = now.getFullYear().toString()
    const monthNumber = now.getMonth() + 1
    const yearNumber = now.getFullYear()

    // Get first and last day of the month
    const firstDay = new Date(yearNumber, monthNumber - 1, 1).toISOString().split("T")[0]
    const lastDay = new Date(yearNumber, monthNumber, 0).toISOString().split("T")[0]

    console.log(`📅 Processing month: ${month} ${year}`)

    // Get all users who have email_monthly_summary enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, email_monthly_summary")
      .eq("email_monthly_summary", true)
      .not("email", "is", null)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      throw usersError
    }

    if (!users || users.length === 0) {
      console.log("📭 No users with email_monthly_summary enabled")
      return
    }

    console.log(`👥 Found ${users.length} users with monthly summary enabled`)

    let totalSent = 0
    let totalFailed = 0

    for (const user of users) {
      try {
        // Get all payments for this user in the current month
        const { data: payments, error: paymentsError } = await supabase
          .from("payment_plans")
          .select(
            `
            id,
            installment_number,
            total_payment,
            due_date,
            credit_id,
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

        // Get total installments for each credit_id
        const creditIds = [...new Set(payments?.map((p) => p.credit_id) || [])]
        const totalInstallmentsMap = {}

        for (const creditId of creditIds) {
          const { count } = await supabase
            .from("payment_plans")
            .select("*", { count: "exact", head: true })
            .eq("credit_id", creditId)

          totalInstallmentsMap[creditId] = count || 0
        }

        // Format payment data
        const paymentItems = payments?.map((payment) => ({
          bankName: payment.credits?.banks?.name || "Bilinmeyen Banka",
          bankLogo: payment.credits?.banks?.logo_url || null,
          installmentNumber: payment.installment_number,
          totalInstallments: totalInstallmentsMap[payment.credit_id] || 0,
          amount: payment.total_payment,
          dueDate: payment.due_date,
        })) || []

        if (paymentItems.length === 0) {
          console.log(`⏭️ User ${user.email} has no payments this month`)
          continue
        }

        const totalAmount = paymentItems.reduce((sum, payment) => sum + payment.amount, 0)

        // Generate email data
        const customerName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Değerli Kullanıcı"
        const emailData = {
          customerName,
          month,
          year,
          payments: paymentItems,
          totalAmount,
        }

        const { subject, html } = generateMonthlyEmailTemplate(emailData)

        // Send email
        const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
        const recipients = [new Recipient(user.email, customerName)]

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(subject)
          .setHtml(html)

        const response = await mailerSend.email.send(emailParams)

        if (response.statusCode === 202) {
          totalSent++
          console.log(`✅ Email sent to ${user.email} (${paymentItems.length} payments, ${totalAmount.toLocaleString('tr-TR')} ₺)`)
        } else {
          totalFailed++
          console.error(`❌ Email failed for ${user.email}:`, response.statusCode)
        }
      } catch (error) {
        totalFailed++
        console.error(`❌ Error processing user ${user.id}:`, error)
      }
    }

    console.log("\n📊 Monthly Payment Summary - Results")
    console.log("======================================")
    console.log(`✅ Successfully sent: ${totalSent}`)
    console.log(`❌ Failed: ${totalFailed}`)
    console.log(`📧 Total processed: ${users.length}`)
    console.log("🎉 Workflow completed successfully")
  } catch (error) {
    console.error("❌ Monthly summary workflow failed:", error)
    process.exit(1)
  }
}

sendMonthlyPaymentSummary()
