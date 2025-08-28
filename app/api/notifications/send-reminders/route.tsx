import { type NextRequest, NextResponse } from "next/server"
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"
import { supabase } from "@/lib/supabase"
import { getNotificationPreferences } from "@/lib/api/notification-preferences"
import { getAllPayments } from "@/lib/api/payments"

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

function createEmailTemplate(
  firstName: string,
  bankName: string,
  installmentNumber: number,
  amount: string,
  dueDate: string,
  type: string,
) {
  let subject = ""
  let title = ""
  let message = ""
  let urgencyColor = "#10b981" // emerald-500
  let urgencyBg = "linear-gradient(135deg, #10b981, #0d9488)" // emerald to teal
  let urgencyText = "Bilgilendirme"

  switch (type) {
    case "3_days_before":
      subject = `Ödeme Hatırlatması - 3 Gün Kaldı`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi 3 gün sonra (${dueDate}) dolacak.`
      urgencyColor = "#f59e0b" // amber-500
      urgencyBg = "linear-gradient(135deg, #f59e0b, #d97706)"
      urgencyText = "3 Gün Kaldı"
      break

    case "1_day_before":
      subject = `Ödeme Hatırlatması - Yarın Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi yarın (${dueDate}) dolacak.`
      urgencyColor = "#f97316" // orange-500
      urgencyBg = "linear-gradient(135deg, #f97316, #ea580c)"
      urgencyText = "Yarın Vade"
      break

    case "due_date":
      subject = `Ödeme Hatırlatması - Bugün Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi bugün (${dueDate}) doluyor.`
      urgencyColor = "#dc2626" // red-600
      urgencyBg = "linear-gradient(135deg, #dc2626, #b91c1c)"
      urgencyText = "Bugün Vade"
      break

    case "overdue":
      subject = `Gecikmiş Ödeme Bildirimi`
      title = "Gecikmiş Ödeme"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi (${dueDate}) geçmiş durumda.`
      urgencyColor = "#dc2626" // red-600
      urgencyBg = "linear-gradient(135deg, #dc2626, #b91c1c)"
      urgencyText = "Vade Geçti"
      break
  }

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: #151515;
            margin: 0;
            padding: 0;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #151515;
            position: relative;
            overflow: hidden;
          }
          
          /* Background gradient effects like landing page */
          .email-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            height: 400px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
            z-index: 0;
          }
          
          .content-wrapper {
            position: relative;
            z-index: 1;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            margin: 20px;
            backdrop-filter: blur(20px);
            overflow: hidden;
          }
          
          /* Header with logo */
          .header {
            text-align: center;
            padding: 32px 32px 24px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(13, 148, 136, 0.1));
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
          }
          
          .logo-container {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }
          
          .logo {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #10b981, #0d9488);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            color: white;
          }
          
          .brand-name {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: -0.5px;
          }
          
          .urgency-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: white;
            background: ${urgencyBg};
            margin-bottom: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          
          .title {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          
          /* Main content */
          .main-content {
            padding: 32px;
          }
          
          .greeting {
            font-size: 18px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 24px;
          }
          
          /* Payment card with glassmorphism effect */
          .payment-card {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }
          
          .payment-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${urgencyBg};
          }
          
          .bank-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .bank-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #10b981, #0d9488);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
          }
          
          .bank-name {
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
          }
          
          .payment-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 20px 0;
          }
          
          .detail-item {
            text-align: center;
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .detail-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
          }
          
          .amount-section {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          
          .amount {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 4px;
          }
          
          .amount-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
          }
          
          /* Message section */
          .message {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.8);
            margin: 24px 0;
            line-height: 1.7;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            border-left: 4px solid ${urgencyColor};
          }
          
          /* CTA Button */
          .cta-section {
            text-align: center;
            margin: 32px 0;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #0d9488);
            color: white;
            padding: 16px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            transition: transform 0.2s;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
          }
          
          /* Footer */
          .footer {
            margin-top: 32px;
            padding: 24px 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            background: rgba(0, 0, 0, 0.2);
          }
          
          .footer-text {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-bottom: 16px;
          }
          
          .footer-links {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-top: 16px;
          }
          
          .footer-links a {
            color: #10b981;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.2s;
          }
          
          .footer-links a:hover {
            color: #0d9488;
          }
          
          .footer-brand {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
          }
          
          /* Mobile responsiveness */
          @media (max-width: 600px) {
            .content-wrapper {
              margin: 10px;
              border-radius: 16px;
            }
            
            .header, .main-content, .footer {
              padding: 20px;
            }
            
            .title {
              font-size: 24px;
            }
            
            .payment-details {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            
            .amount {
              font-size: 24px;
            }
            
            .footer-links {
              flex-direction: column;
              gap: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="content-wrapper">
            <!-- Header -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">💳</div>
                <div class="brand-name">kreditakip.com.tr</div>
              </div>
              <div class="urgency-badge">
                ${urgencyText}
              </div>
              <h1 class="title">${title}</h1>
            </div>

            <!-- Main Content -->
            <div class="main-content">
              <div class="greeting">
                Merhaba ${firstName || "Değerli Müşterimiz"},
              </div>

              <!-- Payment Card -->
              <div class="payment-card">
                <div class="bank-header">
                  <div class="bank-icon">🏦</div>
                  <div class="bank-name">${bankName}</div>
                </div>
                
                <div class="payment-details">
                  <div class="detail-item">
                    <div class="detail-label">Taksit Numarası</div>
                    <div class="detail-value">#${installmentNumber}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Vade Tarihi</div>
                    <div class="detail-value">${dueDate}</div>
                  </div>
                </div>
                
                <div class="amount-section">
                  <div class="amount">${amount} ₺</div>
                  <div class="amount-label">Ödeme Tutarı</div>
                </div>
              </div>

              <!-- Message -->
              <div class="message">
                ${message}
                <br><br>
                ${
                  type === "overdue"
                    ? "⚠️ Lütfen en kısa sürede ödemenizi yaparak gecikme faizinden kaçının."
                    : "💡 Lütfen ödemenizi zamanında yapmayı unutmayın."
                }
              </div>

              <!-- CTA Button -->
              <div class="cta-section">
                <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">
                  📊 Ödeme Planını Görüntüle
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                Bu e-posta kreditakip.com.tr sistemi tarafından otomatik olarak gönderilmiştir.
              </p>
              <p class="footer-text">
                Bildirim tercihlerinizi değiştirmek için uygulamaya giriş yapın.
              </p>
              
              <div class="footer-links">
                <a href="https://kreditakip.com.tr/uygulama/ayarlar">⚙️ Ayarlar</a>
                <a href="https://kreditakip.com.tr/iletisim">📞 İletişim</a>
                <a href="https://kreditakip.com.tr/gizlilik-politikasi">🔒 Gizlilik</a>
              </div>
              
              <div class="footer-brand">
                © 2024 kreditakip.com.tr - Finansal özgürlüğünüze giden yol
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, testMode, testEmail } = await request.json()

    if (testMode && testEmail) {
      if (!process.env.MAILERSEND_API_KEY) {
        console.error("MAILERSEND_API_KEY environment variable is not set")
        return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
      }

      // Mock data for testing
      const mockBankName = "Test Bankası A.Ş."
      const mockAmount = "1.250"
      const mockDueDate = new Date().toLocaleDateString("tr-TR")
      const mockInstallmentNumber = 5
      const mockFirstName = "Test Kullanıcısı"

      try {
        const emailTemplate = createEmailTemplate(
          mockFirstName,
          mockBankName,
          mockInstallmentNumber,
          mockAmount,
          mockDueDate,
          type,
        )

        const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
        const recipients = [new Recipient(testEmail, mockFirstName)]

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(`[TEST] ${emailTemplate.subject}`)
          .setHtml(emailTemplate.html)

        const response = await mailerSend.email.send(emailParams)

        if (response.statusCode !== 202) {
          console.error(`MailerSend test error:`, response)
          return NextResponse.json(
            {
              success: false,
              error: `HTTP ${response.statusCode}`,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: "Test e-postası başarıyla gönderildi",
          messageId: response.headers?.["x-message-id"] || "unknown",
        })
      } catch (error) {
        console.error("Error sending test email:", error)
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 },
        )
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!process.env.MAILERSEND_API_KEY) {
      console.error("MAILERSEND_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Kullanıcının bildirim tercihlerini al
    const preferences = await getNotificationPreferences(userId)
    if (!preferences || !preferences.email_enabled) {
      return NextResponse.json({ message: "Email notifications disabled for user" }, { status: 200 })
    }

    // Kullanıcının e-posta adresini al
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single()

    if (profileError || !profile?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 })
    }

    // Kullanıcının ödemelerini al
    const payments = await getAllPayments(userId, 1, 1) // 1 ay geçmiş + 1 ay gelecek

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    let emailsSent = 0
    const results = []

    // Bildirim tipine göre filtreleme
    let paymentsToNotify = []

    switch (type) {
      case "3_days_before":
        if (preferences.email_3_days_before) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate.toDateString() === threeDaysLater.toDateString() && p.status === "pending"
          })
        }
        break

      case "1_day_before":
        if (preferences.email_1_day_before) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate.toDateString() === tomorrow.toDateString() && p.status === "pending"
          })
        }
        break

      case "due_date":
        if (preferences.email_on_due_date) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate.toDateString() === today.toDateString() && p.status === "pending"
          })
        }
        break

      case "overdue":
        if (preferences.email_overdue) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate < today && p.status === "pending"
          })
        }
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // Her ödeme için e-posta gönder
    for (const payment of paymentsToNotify) {
      const bankName = payment.credits.banks.name
      const amount = payment.total_payment.toLocaleString("tr-TR")
      const dueDate = new Date(payment.due_date).toLocaleDateString("tr-TR")
      const installmentNumber = payment.installment_number

      try {
        const emailTemplate = createEmailTemplate(
          profile.first_name || "",
          bankName,
          installmentNumber,
          amount,
          dueDate,
          type,
        )

        const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
        const recipients = [new Recipient(profile.email, profile.first_name || "")]

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(emailTemplate.subject)
          .setHtml(emailTemplate.html)

        const response = await mailerSend.email.send(emailParams)

        if (response.statusCode !== 202) {
          console.error(`MailerSend error for payment ${payment.id}:`, response)
          results.push({
            paymentId: payment.id,
            bankName,
            amount,
            dueDate,
            success: false,
            error: `HTTP ${response.statusCode}`,
          })
        } else {
          results.push({
            paymentId: payment.id,
            bankName,
            amount,
            dueDate,
            success: true,
            messageId: response.headers?.["x-message-id"] || "unknown",
          })
          emailsSent++
        }
      } catch (error) {
        console.error(`Error sending email for payment ${payment.id}:`, error)
        results.push({
          paymentId: payment.id,
          bankName,
          amount,
          dueDate,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${emailsSent} e-posta gönderildi`,
      emailsSent,
      totalPayments: paymentsToNotify.length,
      results,
    })
  } catch (error) {
    console.error("Error in send-reminders:", error)
    return NextResponse.json({ error: "Bildirimler gönderilirken hata oluştu" }, { status: 500 })
  }
}
