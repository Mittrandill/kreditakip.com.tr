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
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>İletişim Formu</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #ffffff;
                        background: linear-gradient(135deg, #151515 0%, #1a1a1a 100%);
                        min-height: 100vh;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: linear-gradient(135deg, #1a1a1a 0%, #151515 100%);
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                        padding: 40px 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    .header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    }
                    .logo-container { position: relative; z-index: 2; margin-bottom: 10px; }
                    .logo { width: 250px; height: auto; display: block; margin: 0 auto; }
                    .brand-tagline {
                        font-size: 14px;
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 500;
                        margin-top: 10px;
                        position: relative;
                        z-index: 2;
                    }
                    .welcome-badge {
                        display: inline-block;
                        background: rgba(255, 255, 255, 0.2);
                        padding: 8px 20px;
                        border-radius: 25px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-top: 15px;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        position: relative;
                        z-index: 2;
                    }
                    .content {
                        padding: 50px 40px;
                        background: #151515;
                        position: relative;
                    }
                    .content::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 1px;
                        background: linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%);
                    }
                    .title {
                        font-size: 28px;
                        font-weight: 700;
                        color: #ffffff;
                        margin-bottom: 25px;
                        text-align: center;
                        line-height: 1.3;
                    }
                    .title .highlight {
                        color: #10b981;
                        background: linear-gradient(135deg, #059669, #10b981);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    .message-details {
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
                        border: 1px solid rgba(16, 185, 129, 0.2);
                        border-radius: 15px;
                        padding: 30px;
                        margin: 35px 0;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 15px 0;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .detail-row:last-child { border-bottom: none; }
                    .detail-label {
                        font-size: 14px;
                        color: rgba(255, 255, 255, 0.7);
                        font-weight: 600;
                    }
                    .detail-value {
                        font-size: 14px;
                        color: #10b981;
                        font-weight: 500;
                    }
                    .message-content {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        padding: 20px;
                        margin-top: 20px;
                    }
                    .message-label {
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.5);
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 10px;
                    }
                    .message-text {
                        font-size: 15px;
                        color: rgba(255, 255, 255, 0.9);
                        line-height: 1.7;
                    }
                    .footer {
                        background: #0a0a0a;
                        padding: 40px 30px;
                        text-align: center;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .footer-brand {
                        font-size: 18px;
                        font-weight: 700;
                        color: #10b981;
                        margin-bottom: 10px;
                    }
                    .footer-note {
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.5);
                        line-height: 1.5;
                    }
                    @media (max-width: 600px) {
                        .email-container { margin: 10px; border-radius: 15px; }
                        .header { padding: 30px 20px; }
                        .content { padding: 30px 25px; }
                        .logo { width: 200px; }
                        .title { font-size: 24px; }
                        .detail-row { flex-direction: column; gap: 5px; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-container">
                            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip Logo" class="logo" />
                            <div class="brand-tagline">Kredi Yönetiminin Geleceği</div>
                            <div class="welcome-badge">📧 Yeni Mesaj!</div>
                        </div>
                    </div>

                    <div class="content">
                        <h1 class="title">
                            Yeni <span class="highlight">İletişim Formu</span> Mesajı
                        </h1>

                        <div class="message-details">
                            <div class="detail-row">
                                <div class="detail-label">👤 Ad Soyad</div>
                                <div class="detail-value">${firstName} ${lastName}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">📧 E-posta</div>
                                <div class="detail-value">${email}</div>
                            </div>
                            ${phone ? `
                            <div class="detail-row">
                                <div class="detail-label">📱 Telefon</div>
                                <div class="detail-value">${phone}</div>
                            </div>
                            ` : ''}
                            <div class="detail-row">
                                <div class="detail-label">📋 Konu</div>
                                <div class="detail-value">${subject}</div>
                            </div>
                        </div>

                        <div class="message-content">
                            <div class="message-label">Mesaj İçeriği</div>
                            <div class="message-text">${message.replace(/\n/g, "<br>")}</div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="footer-brand">Kredi Takip</div>
                        <div class="footer-note">
                            Bu mesaj kreditakip.com.tr iletişim formundan gönderilmiştir.<br>
                            © ${new Date().getFullYear()} Kredi Takip - Tüm hakları saklıdır.
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
