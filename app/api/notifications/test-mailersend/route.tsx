import { type NextRequest, NextResponse } from "next/server"
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!process.env.MAILERSEND_API_KEY) {
      return NextResponse.json({ error: "MAILERSEND_API_KEY not configured" }, { status: 500 })
    }

    // Test e-postası template'i
    const testEmailHtml = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MailerSend Test</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            margin-bottom: 16px;
          }
          .success-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            background-color: #10b981;
            color: white;
            margin-bottom: 16px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 16px;
          }
          .message {
            font-size: 16px;
            color: #374151;
            margin: 24px 0;
            line-height: 1.7;
            text-align: center;
          }
          .info-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💳 Kredi Takip</div>
            <div class="success-badge">Test Başarılı</div>
            <h1 class="title">MailerSend Test E-postası</h1>
          </div>

          <div class="message">
            Merhaba ${name || "Test Kullanıcısı"},
            <br><br>
            Bu e-posta MailerSend entegrasyonunun düzgün çalıştığını test etmek için gönderilmiştir.
            <br><br>
            Eğer bu e-postayı alıyorsanız, sistem başarıyla çalışıyor demektir! 🎉
          </div>

          <div class="info-box">
            <strong>Test Bilgileri:</strong><br>
            • Gönderim Zamanı: ${new Date().toLocaleString("tr-TR")}<br>
            • E-posta Adresi: ${email}<br>
            • API: MailerSend<br>
            • Durum: Aktif ✅
          </div>

          <div class="footer">
            <p>Bu test e-postası Kredi Takip sistemi tarafından gönderilmiştir.</p>
            <p><a href="https://kreditakip.com.tr" style="color: #3b82f6;">kreditakip.com.tr</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    const sentFrom = new Sender("test@kreditakip.com.tr", "Kredi Takip Test")
    const recipients = [new Recipient(email, name || "Test User")]

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("MailerSend Test - Kredi Takip")
      .setHtml(testEmailHtml)

    console.log("[v0] Sending test email to:", email)
    const response = await mailerSend.email.send(emailParams)
    console.log("[v0] MailerSend response:", response.statusCode, response.headers)

    if (response.statusCode === 202) {
      return NextResponse.json({
        success: true,
        message: "Test e-postası başarıyla gönderildi!",
        statusCode: response.statusCode,
        messageId: response.headers?.["x-message-id"] || "unknown",
        email: email,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "E-posta gönderilemedi",
          statusCode: response.statusCode,
          error: response.body || "Unknown error",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("[v0] MailerSend test error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Test sırasında hata oluştu",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
