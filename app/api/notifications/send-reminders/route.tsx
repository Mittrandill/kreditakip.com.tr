import { type NextRequest, NextResponse } from "next/server"
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"
import { supabase } from "@/lib/supabase"
import { getNotificationPreferences } from "@/lib/api/notification-preferences"
import { getAllPayments } from "@/lib/api/payments"

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

// E-posta template'i
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
  let urgencyColor = "#3b82f6" // blue
  let urgencyText = "Bilgilendirme"

  switch (type) {
    case "3_days_before":
      subject = `Ödeme Hatırlatması - 3 Gün Kaldı`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi 3 gün sonra (${dueDate}) dolacak.`
      urgencyColor = "#f59e0b" // amber
      urgencyText = "3 Gün Kaldı"
      break

    case "1_day_before":
      subject = `Ödeme Hatırlatması - Yarın Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi yarın (${dueDate}) dolacak.`
      urgencyColor = "#f97316" // orange
      urgencyText = "Yarın Vade"
      break

    case "due_date":
      subject = `Ödeme Hatırlatması - Bugün Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi bugün (${dueDate}) doluyor.`
      urgencyColor = "#dc2626" // red
      urgencyText = "Bugün Vade"
      break

    case "overdue":
      subject = `Gecikmiş Ödeme Bildirimi`
      title = "Gecikmiş Ödeme"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi (${dueDate}) geçmiş durumda.`
      urgencyColor = "#dc2626" // red
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
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .urgency-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: white;
            margin-bottom: 16px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 16px;
          }
          .greeting {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 24px;
          }
          .payment-card {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
          }
          .bank-name {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .payment-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 12px 0;
          }
          .detail-label {
            font-size: 14px;
            color: #6b7280;
          }
          .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
          }
          .message {
            font-size: 16px;
            color: #374151;
            margin: 24px 0;
            line-height: 1.7;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 24px 0;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-1px);
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .footer-links {
            margin-top: 16px;
          }
          .footer-links a {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 8px;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .container {
              padding: 20px;
            }
            .payment-details {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💳 Kredi Takip</div>
            <div class="urgency-badge" style="background-color: ${urgencyColor};">
              ${urgencyText}
            </div>
            <h1 class="title">${title}</h1>
          </div>

          <div class="greeting">
            Merhaba ${firstName || "Değerli Müşterimiz"},
          </div>

          <div class="payment-card">
            <div class="bank-name">${bankName}</div>
            <div class="payment-details">
              <div>
                <div class="detail-label">Taksit Numarası</div>
                <div class="detail-value">#${installmentNumber}</div>
              </div>
              <div>
                <div class="detail-label">Vade Tarihi</div>
                <div class="detail-value">${dueDate}</div>
              </div>
            </div>
            <div class="payment-details">
              <div>
                <div class="detail-label">Ödeme Tutarı</div>
                <div class="amount">${amount} ₺</div>
              </div>
            </div>
          </div>

          <div class="message">
            ${message}
            <br><br>
            ${
              type === "overdue"
                ? "Lütfen en kısa sürede ödemenizi yaparak gecikme faizinden kaçının."
                : "Lütfen ödemenizi zamanında yapmayı unutmayın."
            }
          </div>

          <div style="text-align: center;">
            <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">
              Ödeme Planını Görüntüle
            </a>
          </div>

          <div class="footer">
            <p>Bu e-posta Kredi Takip sistemi tarafından otomatik olarak gönderilmiştir.</p>
            <p>Bildirim tercihlerinizi değiştirmek için uygulamaya giriş yapın.</p>
            
            <div class="footer-links">
              <a href="https://kreditakip.com.tr/uygulama/ayarlar">Ayarlar</a>
              <a href="https://kreditakip.com.tr/iletisim">İletişim</a>
              <a href="https://kreditakip.com.tr/gizlilik-politikasi">Gizlilik</a>
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
    const { userId, type } = await request.json()

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
