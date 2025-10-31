import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Contact form API called")

    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    console.log("[v0] Mailjet API Key exists:", !!MAILJET_API_KEY)
    console.log("[v0] Mailjet Secret Key exists:", !!MAILJET_SECRET_KEY)

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[v0] HATA: Mailjet API anahtarları eksik!")
      return NextResponse.json(
        {
          error: "E-posta servisi yapılandırılmamış. Lütfen sistem yöneticisiyle iletişime geçin.",
          details: "MAILJET_API_KEY veya MAILJET_SECRET_KEY environment variable'ları eksik",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    console.log("[v0] Request body received")

    const { firstName, lastName, email, phone, subject, message } = body

    // Validation
    if (!firstName || !lastName || !email || !subject || !message) {
      console.log("[v0] Validation failed: missing required fields")
      return NextResponse.json({ error: "Lütfen tüm zorunlu alanları doldurun" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("[v0] Validation failed: invalid email format")
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin" }, { status: 400 })
    }

    console.log("[v0] Preparing to send email via Mailjet REST API...")

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip - İletişim Formu",
          },
          To: [
            {
              Email: "info@kreditakip.com.tr",
              Name: "Kredi Takip Destek",
            },
          ],
          Subject: `İletişim Formu: ${subject}`,
          HTMLPart: `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .field { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #10b981; }
                .label { font-weight: bold; color: #10b981; margin-bottom: 5px; }
                .value { color: #1e293b; }
                .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📧 Yeni İletişim Formu Mesajı</h1>
                </div>
                <div class="content">
                  <div class="field">
                    <div class="label">Ad Soyad:</div>
                    <div class="value">${firstName} ${lastName}</div>
                  </div>
                  <div class="field">
                    <div class="label">E-posta:</div>
                    <div class="value">${email}</div>
                  </div>
                  ${
                    phone
                      ? `
                  <div class="field">
                    <div class="label">Telefon:</div>
                    <div class="value">${phone}</div>
                  </div>
                  `
                      : ""
                  }
                  <div class="field">
                    <div class="label">Konu:</div>
                    <div class="value">${subject}</div>
                  </div>
                  <div class="field">
                    <div class="label">Mesaj:</div>
                    <div class="value">${message.replace(/\n/g, "<br>")}</div>
                  </div>
                  <div class="footer">
                    <p>Bu mesaj kreditakip.com.tr iletişim formundan gönderilmiştir.</p>
                    <p>© ${new Date().getFullYear()} Kredi Takip - Tüm hakları saklıdır</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
          TextPart: `
            Yeni İletişim Formu Mesajı
            
            Ad Soyad: ${firstName} ${lastName}
            E-posta: ${email}
            ${phone ? `Telefon: ${phone}` : ""}
            Konu: ${subject}
            
            Mesaj:
            ${message}
          `,
        },
      ],
    }

    // Create Basic Auth header
    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    console.log("[v0] Sending email to Mailjet API...")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    console.log("[v0] Mailjet response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Mailjet API error:", errorText)
      throw new Error(`Mailjet API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Email sent successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
    })
  } catch (error: any) {
    console.error("[v0] Contact form error:", error)
    console.error("[v0] Error message:", error.message)

    let errorMessage = "Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."

    if (error.message?.includes("401")) {
      errorMessage = "E-posta servisi kimlik doğrulama hatası. Lütfen sistem yöneticisiyle iletişime geçin."
    } else if (error.message?.includes("400")) {
      errorMessage = "E-posta gönderimi başarısız. Lütfen bilgilerinizi kontrol edin."
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
      },
      { status: 500 },
    )
  }
}
