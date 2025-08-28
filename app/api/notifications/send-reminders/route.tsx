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
  let urgencyColor = "#10b981"
  let urgencyBg = "#10b981"
  let urgencyText = "Bilgilendirme"
  let iconEmoji = "ℹ️"

  switch (type) {
    case "3_days_before":
      subject = `Ödeme Hatırlatması - 3 Gün Kaldı`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi 3 gün sonra (${dueDate}) dolacak.`
      urgencyColor = "#f59e0b"
      urgencyBg = "#f59e0b"
      urgencyText = "3 Gün Kaldı"
      iconEmoji = "⏰"
      break

    case "1_day_before":
      subject = `Ödeme Hatırlatması - Yarın Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi yarın (${dueDate}) dolacak.`
      urgencyColor = "#f97316"
      urgencyBg = "#f97316"
      urgencyText = "Yarın Vade"
      iconEmoji = "⚡"
      break

    case "due_date":
      subject = `Ödeme Hatırlatması - Bugün Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi bugün (${dueDate}) doluyor.`
      urgencyColor = "#dc2626"
      urgencyBg = "#dc2626"
      urgencyText = "Bugün Vade"
      iconEmoji = "🚨"
      break

    case "overdue":
      subject = `Gecikmiş Ödeme Bildirimi`
      title = "Gecikmiş Ödeme"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi (${dueDate}) geçmiş durumda.`
      urgencyColor = "#dc2626"
      urgencyBg = "#dc2626"
      urgencyText = "Vade Geçti"
      iconEmoji = "❌"
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
            color: #1f2937;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px 0;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
          }
          
          /* Professional Header */
          .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 32px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981, #0d9488, #06b6d4);
          }
          
          .logo-section {
            margin-bottom: 24px;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            margin: 0 auto 16px;
            display: block;
          }
          
          .brand-name {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
          }
          
          .brand-tagline {
            font-size: 14px;
            color: #94a3b8;
            font-weight: 400;
          }
          
          /* Urgency Badge */
          .urgency-section {
            margin: 24px 0;
          }
          
          .urgency-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            color: white;
            background: ${urgencyBg};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 16px;
            letter-spacing: -0.5px;
          }
          
          /* Main Content */
          .main-content {
            padding: 40px 32px;
          }
          
          .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 32px;
            font-weight: 500;
          }
          
          /* Premium Payment Card */
          .payment-card {
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 32px;
            margin: 32px 0;
            position: relative;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .payment-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, ${urgencyColor}, ${urgencyColor}dd);
            border-radius: 16px 16px 0 0;
          }
          
          .bank-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .bank-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #10b981, #0d9488);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          
          .bank-info h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
          }
          
          .bank-info p {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          
          /* Payment Details Grid */
          .payment-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 24px 0;
          }
          
          .detail-item {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }
          
          .detail-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .detail-value {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
          }
          
          /* Amount Highlight */
          .amount-section {
            text-align: center;
            margin: 32px 0;
            padding: 32px;
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            border-radius: 16px;
            border: 2px solid #10b981;
            position: relative;
          }
          
          .amount-section::before {
            content: '💰';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            background: #ffffff;
            padding: 8px;
            border-radius: 50%;
            font-size: 20px;
            border: 2px solid #10b981;
          }
          
          .amount {
            font-size: 36px;
            font-weight: 800;
            color: #059669;
            margin-bottom: 8px;
            letter-spacing: -1px;
          }
          
          .amount-label {
            font-size: 16px;
            color: #065f46;
            font-weight: 600;
          }
          
          /* Message Section */
          .message-section {
            background: #f8fafc;
            border-left: 6px solid ${urgencyColor};
            border-radius: 0 12px 12px 0;
            padding: 24px;
            margin: 32px 0;
          }
          
          .message-icon {
            font-size: 24px;
            margin-bottom: 12px;
          }
          
          .message {
            font-size: 16px;
            color: #374151;
            line-height: 1.7;
            margin-bottom: 16px;
          }
          
          .message-tip {
            font-size: 14px;
            color: #6b7280;
            font-style: italic;
            padding: 12px;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          
          /* CTA Button */
          .cta-section {
            text-align: center;
            margin: 40px 0;
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
            transition: all 0.3s ease;
            border: none;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
          }
          
          /* Professional Footer */
          .footer {
            background: #f8fafc;
            padding: 32px;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer-content {
            text-align: center;
          }
          
          .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 16px;
            line-height: 1.6;
          }
          
          .footer-links {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          
          .footer-links a {
            color: #10b981;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: color 0.2s;
          }
          
          .footer-links a:hover {
            color: #059669;
          }
          
          .footer-brand {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 12px;
            font-weight: 500;
          }
          
          /* Mobile Responsive */
          @media (max-width: 600px) {
            body {
              padding: 10px 0;
            }
            
            .email-container {
              margin: 0 10px;
              border-radius: 12px;
            }
            
            .header, .main-content, .footer {
              padding: 24px 20px;
            }
            
            .title {
              font-size: 24px;
            }
            
            .payment-details {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            
            .amount {
              font-size: 28px;
            }
            
            .footer-links {
              flex-direction: column;
              gap: 12px;
            }
            
            .bank-header {
              flex-direction: column;
              text-align: center;
              gap: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-section">
              <img src="https://kreditakip.com.tr/logo-email.png" alt="Kredi Takip" class="logo" />
              <div class="brand-name">kreditakip.com.tr</div>
              <div class="brand-tagline">Finansal özgürlüğünüze giden yol</div>
            </div>
            
            <div class="urgency-section">
              <div class="urgency-badge">
                <span>${iconEmoji}</span>
                <span>${urgencyText}</span>
              </div>
              <h1 class="title">${title}</h1>
            </div>
          </div>

          <div class="main-content">
            <div class="greeting">
              Merhaba <strong>${firstName || "Değerli Müşterimiz"}</strong>,
            </div>

            <div class="payment-card">
              <div class="bank-header">
                <div class="bank-icon">🏦</div>
                <div class="bank-info">
                  <h3>${bankName}</h3>
                  <p>Kredi Taksit Ödemesi</p>
                </div>
              </div>
              
              <div class="payment-details">
                <div class="detail-item">
                  <div class="detail-label">Taksit No</div>
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

            <div class="message-section">
              <div class="message-icon">${iconEmoji}</div>
              <div class="message">
                ${message}
              </div>
              <div class="message-tip">
                ${
                  type === "overdue"
                    ? "⚠️ Lütfen en kısa sürede ödemenizi yaparak gecikme faizinden kaçının."
                    : "💡 Zamanında ödeme yaparak kredi notunuzu koruyun ve finansal sağlığınızı güçlendirin."
                }
              </div>
            </div>

            <div class="cta-section">
              <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">
                📊 Ödeme Planını Görüntüle
              </a>
            </div>
          </div>

          <div class="footer">
            <div class="footer-content">
              <p class="footer-text">
                Bu e-posta <strong>kreditakip.com.tr</strong> sistemi tarafından otomatik olarak gönderilmiştir.<br>
                Bildirim tercihlerinizi uygulamadan değiştirebilirsiniz.
              </p>
              
              <div class="footer-links">
                <a href="https://kreditakip.com.tr/uygulama/ayarlar">⚙️ Bildirim Ayarları</a>
                <a href="https://kreditakip.com.tr/uygulama">🏠 Uygulamaya Git</a>
                <a href="https://kreditakip.com.tr/iletisim">📞 Destek</a>
                <a href="https://kreditakip.com.tr/gizlilik-politikasi">🔒 Gizlilik</a>
              </div>
              
              <div class="footer-brand">
                © 2024 kreditakip.com.tr - Tüm hakları saklıdır.
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
