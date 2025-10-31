import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Newsletter subscription API called")

    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    console.log("[v0] Newsletter - Mailjet API Key exists:", !!MAILJET_API_KEY)
    console.log("[v0] Newsletter - Mailjet Secret Key exists:", !!MAILJET_SECRET_KEY)

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[v0] Newsletter - HATA: Mailjet API anahtarları eksik!")
      return NextResponse.json(
        {
          error: "Bülten servisi yapılandırılmamış. Lütfen sistem yöneticisiyle iletişime geçin.",
          details: "MAILJET_API_KEY veya MAILJET_SECRET_KEY environment variable'ları eksik",
        },
        { status: 500 },
      )
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!)

    const body = await request.json()
    console.log("[v0] Newsletter request for email:", body.email)

    const { email } = body

    // Validation
    if (!email) {
      console.log("[v0] Newsletter - Validation failed: email missing")
      return NextResponse.json({ error: "E-posta adresi gereklidir" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("[v0] Newsletter - Validation failed: invalid email format")
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin" }, { status: 400 })
    }

    console.log("[v0] Newsletter - Checking existing subscription in database...")

    // Check if already subscribed in database
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle()

    if (existingSubscriber?.is_active) {
      console.log("[v0] Newsletter - Email already subscribed")
      return NextResponse.json({ error: "Bu e-posta adresi zaten bültenimize kayıtlı" }, { status: 400 })
    }

    console.log("[v0] Newsletter - Adding contact to Mailjet...")

    // Add to Mailjet contact list
    try {
      const contactResponse = await fetch("https://api.mailjet.com/v3/REST/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          Email: email,
          IsExcludedFromCampaigns: false,
        }),
      })

      if (!contactResponse.ok && contactResponse.status !== 400) {
        const errorText = await contactResponse.text()
        console.error("[v0] Newsletter - Mailjet contact error:", errorText)
        throw new Error(`Mailjet contact error: ${contactResponse.status}`)
      }

      console.log("[v0] Newsletter - Contact added to Mailjet successfully")
    } catch (mailjetError: any) {
      console.log("[v0] Newsletter - Mailjet contact error (continuing):", mailjetError.message)
    }

    console.log("[v0] Newsletter - Saving to database...")

    // Save to database
    if (existingSubscriber) {
      await supabase
        .from("newsletter_subscribers")
        .update({
          is_active: true,
          subscribed_at: new Date().toISOString(),
        })
        .eq("id", existingSubscriber.id)
      console.log("[v0] Newsletter - Subscription reactivated")
    } else {
      await supabase.from("newsletter_subscribers").insert({
        email,
        is_active: true,
        subscribed_at: new Date().toISOString(),
      })
      console.log("[v0] Newsletter - New subscription created")
    }

    console.log("[v0] Newsletter - Sending welcome email...")

    // Send welcome email
    const welcomeEmail = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: email,
            },
          ],
          Subject: "Kredi Takip Bültenine Hoş Geldiniz! 🎉",
          HTMLPart: `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 40px 20px; text-align: center; }
                .content { background: #ffffff; padding: 40px 20px; }
                .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .features { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .feature-item { margin: 15px 0; padding-left: 30px; position: relative; }
                .feature-item:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 20px; }
                .footer { background: #1e293b; color: #94a3b8; padding: 30px 20px; text-align: center; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Hoş Geldiniz!</h1>
                  <p>Kredi Takip bültenine abone olduğunuz için teşekkür ederiz</p>
                </div>
                <div class="content">
                  <h2>Merhaba,</h2>
                  <p>Kredi Takip ailesine katıldığınız için çok mutluyuz! Bundan sonra size özel içerikler, finans ipuçları ve platform güncellemeleri hakkında bilgi alacaksınız.</p>
                  
                  <div class="features">
                    <h3>Bültenimizde neler var?</h3>
                    <div class="feature-item">Haftalık kredi analizi raporları</div>
                    <div class="feature-item">Tasarruf ipuçları ve öneriler</div>
                    <div class="feature-item">Yeni özellik duyuruları</div>
                    <div class="feature-item">Finans dünyasından haberler</div>
                    <div class="feature-item">Özel kampanya ve fırsatlar</div>
                  </div>

                  <p style="text-align: center;">
                    <a href="https://kreditakip.com.tr/uygulama" class="button">Hemen Başlayın</a>
                  </p>

                  <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                    Artık bülten almak istemiyorsanız, e-postalarımızın altındaki bağlantıdan aboneliğinizi iptal edebilirsiniz.
                  </p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır</p>
                  <p>Bu e-posta ${email} adresine gönderilmiştir</p>
                </div>
              </div>
            </body>
            </html>
          `,
          TextPart: `
            Kredi Takip Bültenine Hoş Geldiniz!
            
            Merhaba,
            
            Kredi Takip ailesine katıldığınız için çok mutluyuz! Bundan sonra size özel içerikler, finans ipuçları ve platform güncellemeleri hakkında bilgi alacaksınız.
            
            Bültenimizde neler var?
            - Haftalık kredi analizi raporları
            - Tasarruf ipuçları ve öneriler
            - Yeni özellik duyuruları
            - Finans dünyasından haberler
            - Özel kampanya ve fırsatlar
            
            Hemen başlamak için: https://kreditakip.com.tr/uygulama
            
            © ${new Date().getFullYear()} kreditakip.com.tr
          `,
        },
      ],
    }

    const emailResponse = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(welcomeEmail),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error("[v0] Newsletter - Welcome email error:", errorText)
      throw new Error(`Welcome email error: ${emailResponse.status}`)
    }

    console.log("[v0] Newsletter - Welcome email sent successfully")

    return NextResponse.json({
      success: true,
      message: "Bültenimize başarıyla abone oldunuz! Hoş geldiniz e-postanızı kontrol edin.",
    })
  } catch (error: any) {
    console.error("[v0] Newsletter error:", error)
    console.error("[v0] Newsletter error message:", error.message)

    let errorMessage = "Abonelik sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin."

    if (error.message?.includes("401")) {
      errorMessage = "E-posta servisi kimlik doğrulama hatası. Lütfen sistem yöneticisiyle iletişime geçin."
    } else if (error.message?.includes("400")) {
      errorMessage = "Abonelik işlemi başarısız. Lütfen e-posta adresinizi kontrol edin."
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
