import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {

    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY


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

    const { email } = body

    // Validation
    if (!email) {
      return NextResponse.json({ error: "E-posta adresi gereklidir" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin" }, { status: 400 })
    }


    // Check if already subscribed in database
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle()

    if (existingSubscriber?.is_active) {
      return NextResponse.json({ error: "Bu e-posta adresi zaten bültenimize kayıtlı" }, { status: 400 })
    }


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

    } catch (mailjetError: any) {
    }


    // Save to database
    if (existingSubscriber) {
      await supabase
        .from("newsletter_subscribers")
        .update({
          is_active: true,
          subscribed_at: new Date().toISOString(),
        })
        .eq("id", existingSubscriber.id)
    } else {
      await supabase.from("newsletter_subscribers").insert({
        email,
        is_active: true,
        subscribed_at: new Date().toISOString(),
      })
    }


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
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Kredi Takip Bültenine Hoş Geldiniz!</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }

                body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #ffffff;
                  background-color: #0f172a;
                  margin: 0;
                  padding: 0;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                }

                .wrapper {
                  width: 100%;
                  table-layout: fixed;
                  background-color: #0f172a;
                  padding: 60px 0;
                }

                .main {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #1e293b;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                  border: 1px solid #334155;
                }

                .header {
                  background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0d9488 100%);
                  padding: 48px 40px;
                  text-align: center;
                  position: relative;
                  overflow: hidden;
                }

                .header::before {
                  content: '';
                  position: absolute;
                  top: -50%;
                  right: -50%;
                  width: 200%;
                  height: 200%;
                  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                  animation: shimmer 3s ease-in-out infinite;
                }

                @keyframes shimmer {
                  0%, 100% { transform: translateX(-50%) translateY(-50%); }
                  50% { transform: translateX(-30%) translateY(-30%); }
                }

                .logo-wrapper {
                  position: relative;
                  z-index: 1;
                  margin-bottom: 20px;
                }

                .logo {
                  max-width: 150px;
                  height: auto;
                  filter: brightness(0) invert(1);
                }

                .header-title {
                  font-size: 28px;
                  font-weight: 700;
                  color: #ffffff;
                  letter-spacing: -0.5px;
                  margin: 0;
                  position: relative;
                  z-index: 1;
                }

                .header-subtitle {
                  font-size: 16px;
                  color: rgba(255, 255, 255, 0.9);
                  margin-top: 8px;
                  font-weight: 400;
                  position: relative;
                  z-index: 1;
                }

                .content {
                  padding: 48px 40px;
                  background-color: #1e293b;
                }

                .greeting {
                  font-size: 18px;
                  color: #ffffff;
                  margin-bottom: 32px;
                  font-weight: 400;
                }

                .message {
                  font-size: 16px;
                  color: #e2e8f0;
                  margin-bottom: 32px;
                  line-height: 1.7;
                }

                .features-card {
                  background: linear-gradient(145deg, #334155 0%, #475569 100%);
                  border: 1px solid #475569;
                  border-radius: 12px;
                  padding: 32px;
                  margin-bottom: 32px;
                  position: relative;
                  overflow: hidden;
                }

                .features-card::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #0d9488 100%);
                }

                .features-title {
                  font-size: 20px;
                  font-weight: 600;
                  color: #ffffff;
                  margin-bottom: 24px;
                }

                .feature-item {
                  margin: 16px 0;
                  padding-left: 32px;
                  position: relative;
                  color: #e2e8f0;
                  font-size: 15px;
                }

                .feature-item:before {
                  content: "✓";
                  position: absolute;
                  left: 0;
                  color: #10b981;
                  font-weight: bold;
                  font-size: 18px;
                  width: 24px;
                  height: 24px;
                  background: rgba(16, 185, 129, 0.2);
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }

                .cta-wrapper {
                  text-align: center;
                  margin: 40px 0 32px;
                }

                .cta-button {
                  display: inline-block;
                  padding: 16px 40px;
                  background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 12px;
                  font-weight: 600;
                  font-size: 15px;
                  letter-spacing: 0.3px;
                  box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.25);
                  transition: all 0.3s ease;
                }

                .cta-button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.35);
                }

                .note {
                  font-size: 13px;
                  color: #94a3b8;
                  text-align: center;
                  margin-top: 32px;
                  padding-top: 32px;
                  border-top: 1px solid #334155;
                }

                .footer {
                  padding: 40px;
                  background: #0f172a;
                  border-top: 1px solid #334155;
                  text-align: center;
                }

                .footer-logo {
                  width: 80px;
                  height: auto;
                  margin: 0 auto 20px;
                  opacity: 0.8;
                }

                .footer-text {
                  font-size: 12px;
                  color: #64748b;
                  line-height: 1.6;
                  margin-bottom: 16px;
                }

                .copyright {
                  font-size: 11px;
                  color: #475569;
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #334155;
                }

                @media screen and (max-width: 600px) {
                  .wrapper {
                    padding: 20px 0;
                  }

                  .main {
                    border-radius: 0;
                  }

                  .header {
                    padding: 32px 24px;
                  }

                  .header-title {
                    font-size: 24px;
                  }

                  .content {
                    padding: 32px 24px;
                  }

                  .features-card {
                    padding: 24px;
                  }

                  .footer {
                    padding: 32px 24px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <table class="main" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td>
                      <div class="header">
                        <div class="logo-wrapper">
                          <img src="${process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"}/images/logo-white.png" alt="Kredi Takip" class="logo">
                        </div>
                        <h1 class="header-title">🎉 Hoş Geldiniz!</h1>
                        <p class="header-subtitle">Kredi Takip bültenine abone olduğunuz için teşekkür ederiz</p>
                      </div>

                      <div class="content">
                        <p class="greeting">
                          Merhaba,
                        </p>

                        <p class="message">
                          Kredi Takip ailesine katıldığınız için çok mutluyuz! Bundan sonra size özel içerikler, finans ipuçları ve platform güncellemeleri hakkında bilgi alacaksınız.
                        </p>

                        <div class="features-card">
                          <h3 class="features-title">Bültenimizde neler var?</h3>
                          <div class="feature-item">Haftalık kredi analizi raporları</div>
                          <div class="feature-item">Tasarruf ipuçları ve öneriler</div>
                          <div class="feature-item">Yeni özellik duyuruları</div>
                          <div class="feature-item">Finans dünyasından haberler</div>
                          <div class="feature-item">Özel kampanya ve fırsatlar</div>
                        </div>

                        <div class="cta-wrapper">
                          <a href="https://kreditakip.com.tr/uygulama" class="cta-button">
                            Hemen Başlayın
                          </a>
                        </div>

                        <p class="note">
                          Artık bülten almak istemiyorsanız, e-postalarımızın altındaki bağlantıdan aboneliğinizi iptal edebilirsiniz.
                        </p>
                      </div>

                      <div class="footer">
                        <img src="${process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"}/images/logo-white.png" alt="Kredi Takip" class="footer-logo">

                        <p class="footer-text">
                          Bu e-posta ${email} adresine gönderilmiştir.<br>
                          Bu e-posta otomatik olarak gönderilmiştir.
                        </p>

                        <div class="copyright">
                          © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
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
