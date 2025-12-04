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

// Bank logo URL helper
function getBankLogoUrl(bankName) {
  const bankMappings = {
    Adabank: "adabank.png",
    "Adabank A.Ş.": "adabank.png",
    Akbank: "akbank.png",
    "Akbank T.A.Ş.": "akbank.png",
    "Aktif Yatırım Bankası": "aktif-yatirim-bankasi.png",
    "Aktif Yatırım Bankası A.Ş.": "aktif-yatirim-bankasi.png",
    "Albaraka Türk": "albaraka-turk-katilim-bankasi.png",
    "Albaraka Türk Katılım Bankası A.Ş.": "albaraka-turk-katilim-bankasi.png",
    Alternatifbank: "alternatif-bank.png",
    "Alternatifbank A.Ş.": "alternatif-bank.png",
    Anadolubank: "anadolubank.png",
    "Anadolubank A.Ş.": "anadolubank.png",
    "Bank Mellat": "bank-mellat.png",
    "Bankpozitif Kredi ve Kalkınma Bankası": "bankpozitif-kredi-ve-kalkinma-bankasi.png",
    "Birleşik Fon Bankası": "birlesik-fon-bankasi.png",
    "Burgan Bank": "burgan-bank.png",
    "Burgan Bank A.Ş.": "burgan-bank.png",
    Citibank: "citibank.png",
    "Citibank A.Ş.": "citibank.png",
    "Colendi Bank": "colendi-bank.png",
    DenizBank: "denizbank.png",
    "DenizBank A.Ş.": "denizbank.png",
    "Deutsche Bank": "deutsche-bank.png",
    "Deutsche Bank A.Ş.": "deutsche-bank.png",
    "Diler Yatırım Bankası": "diler-yatirim-bankasi.png",
    "Dünya Katılım Bankası": "dunya-katilim-bankasi.png",
    "Enpara.com": "enpara-bank.png",
    Fibabanka: "fibabanka.png",
    "Fibabanka A.Ş.": "fibabanka.png",
    "Golden Global Yatırım Bankası": "golden-global-yatirim-bankasi.png",
    "GSD Yatırım Bankası": "gsd-yatirim-bankasi.png",
    "Habib Bank Limited": "habib-bank-limited.png",
    "Hayat Finans Katılım Bankası": "hayat-finans-katilim-bankasi.png",
    HSBC: "hsbc-bank.png",
    "HSBC Bank A.Ş.": "hsbc-bank.png",
    "ICBC Turkey Bank": "icbc-turkey-bank.png",
    "İller Bankası": "iller-bankasi.png",
    ING: "ing-bank.png",
    "ING Bank A.Ş.": "ing-bank.png",
    "Intesa Sanpaolo": "intesa-sanpaolo.png",
    "İstanbul Takas ve Saklama Bankası": "istanbul-takas-ve-saklama-bankasi.png",
    "JPMorgan Chase Bank": "jpmorgan-chase-bank.png",
    "Kuveyt Türk": "kuveyt-turk-katilim-bankasi.png",
    "Kuveyt Türk Katılım Bankası A.Ş.": "kuveyt-turk-katilim-bankasi.png",
    "Merrill Lynch Yatırım Bank": "merrill-lynch-yatirim-bank.png",
    "MUFG Bank Turkey": "mufg-bank-turkey.png",
    "Nurol Yatırım Bankası": "nurol-yatirim-bankasi.png",
    Odeabank: "odeabank.png",
    "Odeabank A.Ş.": "odeabank.png",
    "PASHA Yatırım Bankası": "pasha-yatirim-bankasi.png",
    "QNB Finansbank": "qnb-finansbank.png",
    "QNB Finansbank A.Ş.": "qnb-finansbank.png",
    Rabobank: "rabobank.png",
    "Rabobank A.Ş.": "rabobank.png",
    Şekerbank: "sekerbank.png",
    "Şekerbank T.A.Ş.": "sekerbank.png",
    "Societe Generale": "societe-generale.png",
    "Standard Chartered Yatırım Bankası Türk": "standard-chartered-yatirim-bankasi-turk.png",
    TEB: "turkiye-ekonomi-bankasi.png",
    "Türk Eximbank": "turk-eximbank.png",
    "Türk Ticaret Bankası": "turk-ticaret-bankasi.png",
    "Turkish Bank": "turkish-bank.png",
    "Turkish Bank A.Ş.": "turkish-bank.png",
    "Türkiye Ekonomi Bankası A.Ş.": "turkiye-ekonomi-bankasi.png",
    "Türkiye Emlak Katılım Bankası": "turkiye-emlak-katilim-bankasi.png",
    "Türkiye Finans": "turkiye-finans-katilim-bankasi.png",
    "Türkiye Finans Katılım Bankası A.Ş.": "turkiye-finans-katilim-bankasi.png",
    Garanti: "turkiye-garanti-bankasi.png",
    "Garanti BBVA": "turkiye-garanti-bankasi.png",
    "Türkiye Garanti Bankası": "turkiye-garanti-bankasi.png",
    "Türkiye Garanti Bankası A.Ş.": "turkiye-garanti-bankasi.png",
    Halkbank: "turkiye-halk-bankasi.png",
    "Türkiye Halk Bankası A.Ş.": "turkiye-halk-bankasi.png",
    "İş Bankası": "turkiye-is-bankasi.png",
    "Türkiye İş Bankası": "turkiye-is-bankasi.png",
    "Türkiye İş Bankası A.Ş.": "turkiye-is-bankasi.png",
    "Türkiye Kalkınma ve Yatırım Bankası": "turkiye-kalkinma-ve-yatirim-bankasi.png",
    "Türkiye Sınai Kalkınma Bankası": "turkiye-sinai-kalkinma-bankasi.png",
    "Vakıf Katılım": "vakif-katilim-bankasi.png",
    "Vakıf Katılım Bankası A.Ş.": "vakif-katilim-bankasi.png",
    VakıfBank: "vakifbank.png",
    "Türkiye Vakıflar Bankası": "vakifbank.png",
    "Türkiye Vakıflar Bankası T.A.O.": "vakifbank.png",
    "Yapı Kredi": "yapi-kredi-bankasi.png",
    "Yapı Kredi Bankası": "yapi-kredi-bankasi.png",
    "Yapı ve Kredi Bankası A.Ş.": "yapi-kredi-bankasi.png",
    "Ziraat Bankası": "ziraat-bankasi.png",
    "T.C. Ziraat Bankası A.Ş.": "ziraat-bankasi.png",
    "Ziraat Katılım": "ziraat-katilim-bankasi.png",
    "Ziraat Katılım Bankası A.Ş.": "ziraat-katilim-bankasi.png"
  }

  const logoFileName = bankMappings[bankName] || "default-bank.png"
  return `https://kreditakip.com.tr/bank-icons/${logoFileName}`
}

// Email template helper
function generateWeeklyEmailTemplate(data) {
  const { customerName, weekStart, weekEnd, payments, totalAmount } = data

  return {
    subject: `Bu Hafta (${weekStart} - ${weekEnd}) - Ödeme Hatırlatıcısı`,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #ffffff; }
        .wrapper { width: 100%; background-color: #0f172a; padding: 20px 0; }
        .container { max-width: 600px; margin: 0 auto; }
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
        .warning-box { background: linear-gradient(145deg, #334155 0%, #475569 100%); border: 1px solid #475569; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .warning-box p { margin: 0; color: #fbbf24; font-size: 14px; }
    </style>
</head>
<body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="logo">
            <h1>📆 Haftalık Ödeme Hatırlatıcısı</h1>
            <p>${weekStart} - ${weekEnd}</p>
        </div>
        <div class="content">
            <p class="greeting">Merhaba <strong>${customerName}</strong>,</p>

            ${payments.length > 0 ? `
            <p class="info-text">Bu hafta yapmanız gereken <strong>${payments.length} ödeme</strong> bulunmaktadır. Ödemelerinizi zamanında yaparak gecikme faizlerinden kaçınabilirsiniz.</p>

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
                                <img src="${getBankLogoUrl(payment.bankName)}" alt="${payment.bankName}" class="bank-logo" onerror="this.style.display='none'">
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
                            <span class="due-date">${new Date(payment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary-box">
                <h3>💰 Bu Haftanın Toplam Ödemesi</h3>
                <p class="total">${totalAmount.toLocaleString('tr-TR')} ₺</p>
            </div>

            <div class="warning-box">
                <p>⏰ <strong>Önemli:</strong> Ödemelerinizi vade tarihinde yapmayı unutmayın!</p>
            </div>
            ` : `
            <p class="info-text">🎉 Harika haber! Bu hafta yapmanız gereken ödeme bulunmamaktadır.</p>
            `}

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
    </div>
</body>
</html>
    `,
  }
}

async function sendWeeklyPaymentSummary() {
  try {
    console.log("🚀 Weekly payment summary workflow started")

    if (!process.env.MAILERSEND_API_KEY) {
      throw new Error("MAILERSEND_API_KEY not configured")
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured")
    }

    if (!process.env.SERVICE_ROLE_KEY) {
      throw new Error("SERVICE_ROLE_KEY not configured")
    }

    // Get current week (Monday to Sunday)
    const now = new Date()
    const dayOfWeek = now.getDay()

    // Calculate Monday of this week
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

    console.log(`📅 Processing week: ${weekStart} - ${weekEnd}`)

    // Get all users who have email_weekly_summary enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, email_weekly_summary")
      .eq("email_weekly_summary", true)
      .not("email", "is", null)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      throw usersError
    }

    if (!users || users.length === 0) {
      console.log("📭 No users with email_weekly_summary enabled")
      return
    }

    console.log(`👥 Found ${users.length} users with weekly summary enabled`)

    let totalSent = 0
    let totalFailed = 0

    for (const user of users) {
      try {
        // Get all payments for this user in the current week
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
          .gte("due_date", weekStartDate)
          .lte("due_date", weekEndDate)
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

        // Format payment data (even if empty, we still send the email)
        const paymentItems = payments?.map((payment) => ({
          bankName: payment.credits?.banks?.name || "Bilinmeyen Banka",
          bankLogo: payment.credits?.banks?.logo_url || null,
          installmentNumber: payment.installment_number,
          totalInstallments: totalInstallmentsMap[payment.credit_id] || 0,
          amount: payment.total_payment,
          dueDate: payment.due_date,
        })) || []

        const totalAmount = paymentItems.reduce((sum, payment) => sum + payment.amount, 0)

        // Generate email data
        const customerName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Değerli Kullanıcı"
        const emailData = {
          customerName,
          weekStart,
          weekEnd,
          payments: paymentItems,
          totalAmount,
        }

        const { subject, html } = generateWeeklyEmailTemplate(emailData)

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
          console.log(`✅ Email sent to ${user.email} (${paymentItems.length} payments)`)
        } else {
          totalFailed++
          console.error(`❌ Email failed for ${user.email}:`, response.statusCode)
        }
      } catch (error) {
        totalFailed++
        console.error(`❌ Error processing user ${user.id}:`, error)
      }
    }

    console.log("\n📊 Weekly Payment Summary - Results")
    console.log("=====================================")
    console.log(`✅ Successfully sent: ${totalSent}`)
    console.log(`❌ Failed: ${totalFailed}`)
    console.log(`📧 Total processed: ${users.length}`)
    console.log("🎉 Workflow completed successfully")
  } catch (error) {
    console.error("❌ Weekly summary workflow failed:", error)
    process.exit(1)
  }
}

sendWeeklyPaymentSummary()
