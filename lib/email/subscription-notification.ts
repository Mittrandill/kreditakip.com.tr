/**
 * Subscription Email Notifications using Mailjet
 */

interface SubscriptionEmailData {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  startDate: string
  expiresAt: string
}

export async function sendNewSubscriptionNotification(data: SubscriptionEmailData) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[subscription-email] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip - Abonelik Sistemi",
          },
          To: [
            {
              Email: "info@kreditakip.com.tr",
              Name: "Kredi Takip Admin",
            },
          ],
          Subject: `🎉 Yeni Premium Abonelik - ${data.planName}`,
          HTMLPart: generateSubscriptionEmailHTML(data),
          TextPart: generateSubscriptionEmailText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[subscription-email] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[subscription-email] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateSubscriptionEmailHTML(data: SubscriptionEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yeni Premium Abonelik</title>
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

        .header-badge {
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
            z-index: 1;
        }

        .header-title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin: 20px 0 0 0;
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

        .message {
            font-size: 16px;
            color: #e2e8f0;
            margin-bottom: 32px;
            line-height: 1.7;
            text-align: center;
        }

        .details-card {
            background: linear-gradient(145deg, #334155 0%, #475569 100%);
            border: 1px solid #475569;
            border-radius: 12px;
            padding: 32px;
            margin-bottom: 32px;
            position: relative;
            overflow: hidden;
        }

        .details-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #0d9488 100%);
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #475569;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-size: 14px;
            color: #94a3b8;
            font-weight: 500;
        }

        .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            text-align: right;
        }

        .amount-highlight {
            font-size: 24px;
            font-weight: 700;
            color: #10b981;
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

            .details-card {
                padding: 24px;
            }

            .footer {
                padding: 32px 24px;
            }

            .detail-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .detail-value {
                text-align: left;
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
                            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="logo">
                        </div>
                        <div class="header-badge">🎉 Yeni Abonelik!</div>
                        <h1 class="header-title">Premium Abonelik Başlatıldı</h1>
                        <p class="header-subtitle">Yeni bir kullanıcı premium üyelik satın aldı</p>
                    </div>

                    <div class="content">
                        <p class="message">
                            Harika haber! Platform'a yeni bir premium üye katıldı.
                        </p>

                        <div class="details-card">
                            <div class="detail-row">
                                <div class="detail-label">👤 Kullanıcı Adı</div>
                                <div class="detail-value">${data.userName}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">📧 E-posta</div>
                                <div class="detail-value">${data.userEmail}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">💎 Plan</div>
                                <div class="detail-value">${data.planName}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">💰 Tutar</div>
                                <div class="detail-value amount-highlight">${data.amount.toFixed(2)} ${data.currency}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">📅 Başlangıç</div>
                                <div class="detail-value">${new Date(data.startDate).toLocaleDateString('tr-TR')}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">⏰ Bitiş</div>
                                <div class="detail-value">${new Date(data.expiresAt).toLocaleDateString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="footer-logo">

                        <p class="footer-text">
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
  `
}

function generateSubscriptionEmailText(data: SubscriptionEmailData): string {
  return `
Yeni Premium Abonelik Başlatıldı!

Kullanıcı: ${data.userName}
E-posta: ${data.userEmail}
Plan: ${data.planName}
Tutar: ${data.amount.toFixed(2)} ${data.currency}
Başlangıç: ${new Date(data.startDate).toLocaleDateString('tr-TR')}
Bitiş: ${new Date(data.expiresAt).toLocaleDateString('tr-TR')}

---
Bu e-posta otomatik olarak gönderilmiştir.
© ${new Date().getFullYear()} Kredi Takip
  `
}

// ============================================
// Abonelik Yenileme Bildirimleri
// ============================================

interface RenewalNotificationData {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  newExpiryDate: string
}

/**
 * Abonelik yenileme başarılı bildirimi - Kullanıcıya gönderilir
 */
export async function sendRenewalSuccessNotification(data: RenewalNotificationData) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[renewal-email] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: data.userEmail,
              Name: data.userName,
            },
          ],
          Subject: `✅ Aboneliğiniz Yenilendi - ${data.planName}`,
          HTMLPart: generateRenewalSuccessHTML(data),
          TextPart: generateRenewalSuccessText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[renewal-email] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[renewal-email] Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Abonelik yenileme başarısız bildirimi - Kullanıcıya gönderilir
 */
export async function sendRenewalFailedNotification(data: {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  failureReason: string
  retryUrl: string
}) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[renewal-email] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: data.userEmail,
              Name: data.userName,
            },
          ],
          Subject: `⚠️ Abonelik Yenileme Başarısız - Aksiyon Gerekli`,
          HTMLPart: generateRenewalFailedHTML(data),
          TextPart: generateRenewalFailedText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[renewal-email] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[renewal-email] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateRenewalSuccessHTML(data: RenewalNotificationData): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Yenilendi</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #ffffff; background-color: #0f172a; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Aboneliğiniz Yenilendi</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Premium üyeliğiniz başarıyla uzatıldı</p>
        </div>

        <div style="padding: 40px;">
            <p style="color: #e2e8f0; margin-bottom: 24px;">Merhaba ${data.userName},</p>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                Abonelik yenileme işleminiz başarıyla tamamlandı. Premium üyeliğiniz devam ediyor!
            </p>

            <div style="background: #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Plan</span>
                    <span style="color: #ffffff; font-weight: 600;">${data.planName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Ödenen Tutar</span>
                    <span style="color: #10b981; font-weight: 700; font-size: 18px;">${data.amount.toFixed(2)} ${data.currency}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #94a3b8;">Yeni Bitiş Tarihi</span>
                    <span style="color: #ffffff; font-weight: 600;">${new Date(data.newExpiryDate).toLocaleDateString('tr-TR')}</span>
                </div>
            </div>

            <p style="color: #94a3b8; font-size: 14px;">
                Premium özellikleriniz kesintisiz devam edecektir. Sorularınız için destek ekibimizle iletişime geçebilirsiniz.
            </p>
        </div>

        <div style="padding: 24px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function generateRenewalSuccessText(data: RenewalNotificationData): string {
  return `
Aboneliğiniz Yenilendi!

Merhaba ${data.userName},

Abonelik yenileme işleminiz başarıyla tamamlandı. Premium üyeliğiniz devam ediyor!

Plan: ${data.planName}
Ödenen Tutar: ${data.amount.toFixed(2)} ${data.currency}
Yeni Bitiş Tarihi: ${new Date(data.newExpiryDate).toLocaleDateString('tr-TR')}

Premium özellikleriniz kesintisiz devam edecektir.

---
© ${new Date().getFullYear()} Kredi Takip
  `
}

function generateRenewalFailedHTML(data: {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  failureReason: string
  retryUrl: string
}): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Yenileme Başarısız</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #ffffff; background-color: #0f172a; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Abonelik Yenileme Başarısız</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Ödeme işlemi tamamlanamadı</p>
        </div>

        <div style="padding: 40px;">
            <p style="color: #e2e8f0; margin-bottom: 24px;">Merhaba ${data.userName},</p>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                ${data.planName} aboneliğinizi yenilemek için yapılan ödeme işlemi başarısız oldu.
            </p>

            <div style="background: #7f1d1d; border: 1px solid #991b1b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #fca5a5; margin: 0; font-size: 14px;">
                    <strong>Hata:</strong> ${data.failureReason}
                </p>
            </div>

            <div style="background: #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #94a3b8;">Ödeme Tutarı</span>
                    <span style="color: #fbbf24; font-weight: 600;">${data.amount.toFixed(2)} ${data.currency}</span>
                </div>
            </div>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                Aboneliğinizin kesintiye uğramaması için lütfen ödeme ayarlarınızı kontrol edin ve tekrar deneyin.
            </p>

            <div style="text-align: center;">
                <a href="${data.retryUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                    Tekrar Dene
                </a>
            </div>
        </div>

        <div style="padding: 24px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function generateRenewalFailedText(data: {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  failureReason: string
  retryUrl: string
}): string {
  return `
Abonelik Yenileme Başarısız

Merhaba ${data.userName},

${data.planName} aboneliğinizi yenilemek için yapılan ödeme işlemi başarısız oldu.

Hata: ${data.failureReason}
Ödeme Tutarı: ${data.amount.toFixed(2)} ${data.currency}

Aboneliğinizin kesintiye uğramaması için lütfen ödeme ayarlarınızı kontrol edin ve tekrar deneyin.

Tekrar denemek için: ${data.retryUrl}

---
© ${new Date().getFullYear()} Kredi Takip
  `
}

// ============================================
// Yenileme Öncesi Bildirim (3 Gün Önceden)
// ============================================

interface UpcomingRenewalData {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  renewalDate: string
  last4: string
  cancelUrl: string
}

/**
 * Yenileme öncesi bildirim - 3 gün önceden gönderilir
 */
export async function sendUpcomingRenewalNotification(data: UpcomingRenewalData) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[upcoming-renewal-email] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: data.userEmail,
              Name: data.userName,
            },
          ],
          Subject: `📅 Aboneliğiniz 3 Gün Sonra Yenilenecek`,
          HTMLPart: generateUpcomingRenewalHTML(data),
          TextPart: generateUpcomingRenewalText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[upcoming-renewal-email] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[upcoming-renewal-email] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateUpcomingRenewalHTML(data: UpcomingRenewalData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Yenilenecek</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #ffffff; background-color: #0f172a; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📅 Aboneliğiniz Yenilenecek</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">3 gün sonra otomatik yenileme</p>
        </div>

        <div style="padding: 40px;">
            <p style="color: #e2e8f0; margin-bottom: 24px;">Merhaba ${data.userName},</p>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                kreditakip.com.tr Premium aboneliğiniz <strong>${new Date(data.renewalDate).toLocaleDateString('tr-TR')}</strong> tarihinde otomatik olarak yenilenecektir.
            </p>

            <div style="background: #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Plan</span>
                    <span style="color: #ffffff; font-weight: 600;">${data.planName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Yenileme Tutarı</span>
                    <span style="color: #3b82f6; font-weight: 700; font-size: 18px;">${data.amount.toFixed(2)} ${data.currency}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Yenileme Tarihi</span>
                    <span style="color: #ffffff;">${new Date(data.renewalDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #94a3b8;">Kart (Son 4 Hane)</span>
                    <span style="color: #ffffff;">**** ${data.last4}</span>
                </div>
            </div>

            <div style="background: #1e40af; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
                <p style="color: #dbeafe; margin: 0; font-size: 14px;">
                    <strong>Önemli Bilgi:</strong> Kayıtlı kartınızdan otomatik ödeme alınacaktır. İptal etmek isterseniz, yenileme tarihinden önce aboneliğinizi iptal edebilirsiniz.
                </p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${data.cancelUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin-right: 10px;">
                    Aboneliği İptal Et
                </a>
                <a href="${baseUrl}/uygulama/ayarlar" style="display: inline-block; background: #334155; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                    Ayarlara Git
                </a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                Herhangi bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.
            </p>
        </div>

        <div style="padding: 24px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function generateUpcomingRenewalText(data: UpcomingRenewalData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  return `
Aboneliğiniz 3 Gün Sonra Yenilenecek

Merhaba ${data.userName},

kreditakip.com.tr Premium aboneliğiniz ${new Date(data.renewalDate).toLocaleDateString('tr-TR')} tarihinde otomatik olarak yenilenecektir.

Yenileme Detayları:
- Plan: ${data.planName}
- Tutar: ${data.amount.toFixed(2)} ${data.currency}
- Kart: **** ${data.last4}
- Tarih: ${new Date(data.renewalDate).toLocaleDateString('tr-TR')}

Kayıtlı kartınızdan otomatik ödeme alınacaktır.

İptal etmek isterseniz: ${data.cancelUrl}
Ayarlar: ${baseUrl}/uygulama/ayarlar

---
© ${new Date().getFullYear()} Kredi Takip
  `
}

// ============================================
// 3D Secure Renewal Request Notification
// ============================================

interface RenewalRequestData {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  renewalDate: string
  paymentUrl: string
  linkExpiresIn: string
}

/**
 * 3D Secure ödeme isteği bildirimi - Kullanıcıya ödeme URL'i gönderilir
 */
export async function sendRenewalRequestNotification(data: RenewalRequestData) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[renewal-request-email] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: data.userEmail,
              Name: data.userName,
            },
          ],
          Subject: `🔔 Abonelik Yenileme Onayı Gerekiyor - ${data.planName}`,
          HTMLPart: generateRenewalRequestHTML(data),
          TextPart: generateRenewalRequestText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[renewal-request-email] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[renewal-request-email] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateRenewalRequestHTML(data: RenewalRequestData): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Yenileme Onayı</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #ffffff; background-color: #0f172a; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔔 Abonelik Yenileme Onayı</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Ödemenizi onaylamanız gerekiyor</p>
        </div>

        <div style="padding: 40px;">
            <p style="color: #e2e8f0; margin-bottom: 24px;">Merhaba ${data.userName},</p>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                ${data.planName} aboneliğinizin süresi dolmak üzere. Aboneliğinizi yenilemek için ödeme onayınıza ihtiyacımız var.
            </p>

            <div style="background: #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Plan</span>
                    <span style="color: #ffffff; font-weight: 600;">${data.planName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Tutar</span>
                    <span style="color: #3b82f6; font-weight: 700; font-size: 18px;">${data.amount.toFixed(2)} ${data.currency}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #94a3b8;">Bitiş Tarihi</span>
                    <span style="color: #ffffff;">${new Date(data.renewalDate).toLocaleDateString('tr-TR')}</span>
                </div>
            </div>

            <div style="background: #1e40af; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
                <p style="color: #dbeafe; margin: 0; font-size: 14px;">
                    <strong>Önemli:</strong> Bu ödeme linki ${data.linkExpiresIn} içinde geçerliliğini yitirecektir. Lütfen en kısa sürede ödemenizi tamamlayın.
                </p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${data.paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Ödemeyi Onayla ve Tamamla
                </a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                Güvenli ödeme sayfasında kartınızdan ${data.amount.toFixed(2)} ${data.currency} tutarında ödeme alınacaktır.
            </p>
        </div>

        <div style="padding: 24px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function generateRenewalRequestText(data: RenewalRequestData): string {
  return `
Abonelik Yenileme Onayı Gerekiyor

Merhaba ${data.userName},

${data.planName} aboneliğinizin süresi dolmak üzere. Aboneliğinizi yenilemek için ödeme onayınıza ihtiyacımız var.

Yenileme Detayları:
- Plan: ${data.planName}
- Tutar: ${data.amount.toFixed(2)} ${data.currency}
- Bitiş Tarihi: ${new Date(data.renewalDate).toLocaleDateString('tr-TR')}

ÖNEMLI: Bu ödeme linki ${data.linkExpiresIn} içinde geçerliliğini yitirecektir.

Ödemeyi tamamlamak için: ${data.paymentUrl}

---
© ${new Date().getFullYear()} Kredi Takip
  `
}

// ============================================
// Grace Period Notifications
// ============================================

interface GracePeriodStartData {
  userName: string
  userEmail: string
  planName: string
  expiresAt: string
  gracePeriodEndsAt: string
  daysRemaining: number
}

/**
 * Grace period başlangıç bildirimi - Day 0
 */
export async function sendGracePeriodStartNotification(data: GracePeriodStartData) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[grace-period-start-email] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: data.userEmail,
              Name: data.userName,
            },
          ],
          Subject: `⏰ Abonelik Süresi Doldu - ${data.daysRemaining} Gün Ek Süre`,
          HTMLPart: generateGracePeriodStartHTML(data),
          TextPart: generateGracePeriodStartText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[grace-period-start-email] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[grace-period-start-email] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateGracePeriodStartHTML(data: GracePeriodStartData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Süresi Doldu</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #ffffff; background-color: #0f172a; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Abonelik Süresi Doldu</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${data.daysRemaining} gün ek süre tanındı</p>
        </div>

        <div style="padding: 40px;">
            <p style="color: #e2e8f0; margin-bottom: 24px;">Merhaba ${data.userName},</p>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                ${data.planName} aboneliğinizin süresi ${new Date(data.expiresAt).toLocaleDateString('tr-TR')} tarihinde sona erdi. Size <strong>${data.daysRemaining} gün ek süre</strong> tanıdık.
            </p>

            <div style="background: #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Abonelik Bitiş</span>
                    <span style="color: #ffffff;">${new Date(data.expiresAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Ek Süre Bitiş</span>
                    <span style="color: #f59e0b; font-weight: 600;">${new Date(data.gracePeriodEndsAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #94a3b8;">Kalan Süre</span>
                    <span style="color: #ffffff; font-weight: 700; font-size: 18px;">${data.daysRemaining} Gün</span>
                </div>
            </div>

            <div style="background: #78350f; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
                <p style="color: #fcd34d; margin: 0; font-size: 14px;">
                    <strong>Önemli:</strong> ${data.daysRemaining} gün içinde aboneliğinizi yenilemezseniz, premium özelliklerinize erişiminiz kapatılacaktır.
                </p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${baseUrl}/uygulama/ayarlar" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Aboneliği Yenile
                </a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                Kesintisiz hizmet için lütfen en kısa sürede aboneliğinizi yenileyin.
            </p>
        </div>

        <div style="padding: 24px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function generateGracePeriodStartText(data: GracePeriodStartData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  return `
Abonelik Süresi Doldu - ${data.daysRemaining} Gün Ek Süre

Merhaba ${data.userName},

${data.planName} aboneliğinizin süresi ${new Date(data.expiresAt).toLocaleDateString('tr-TR')} tarihinde sona erdi. Size ${data.daysRemaining} gün ek süre tanıdık.

Detaylar:
- Abonelik Bitiş: ${new Date(data.expiresAt).toLocaleDateString('tr-TR')}
- Ek Süre Bitiş: ${new Date(data.gracePeriodEndsAt).toLocaleDateString('tr-TR')}
- Kalan Süre: ${data.daysRemaining} Gün

ÖNEMLI: ${data.daysRemaining} gün içinde aboneliğinizi yenilemezseniz, premium özelliklerinize erişiminiz kapatılacaktır.

Aboneliği yenilemek için: ${baseUrl}/uygulama/ayarlar

---
© ${new Date().getFullYear()} Kredi Takip
  `
}

interface GracePeriodEndingData {
  userName: string
  userEmail: string
  planName: string
  gracePeriodEndsAt: string
  hoursRemaining: number
  paymentUrl: string | null
}

/**
 * Grace period bitiş uyarısı - Day 6 (24 hours before end)
 */
export async function sendGracePeriodEndingNotification(data: GracePeriodEndingData) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[grace-period-ending-email] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: data.userEmail,
              Name: data.userName,
            },
          ],
          Subject: `⚠️ ACİL: Abonelik ${data.hoursRemaining} Saat İçinde Kapanacak`,
          HTMLPart: generateGracePeriodEndingHTML(data),
          TextPart: generateGracePeriodEndingText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[grace-period-ending-email] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[grace-period-ending-email] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateGracePeriodEndingHTML(data: GracePeriodEndingData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  const ctaUrl = data.paymentUrl || `${baseUrl}/uygulama/ayarlar`
  const ctaText = data.paymentUrl ? "Ödemeyi Hemen Tamamla" : "Aboneliği Yenile"

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Bitiyor</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #ffffff; background-color: #0f172a; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ ACİL: Abonelik Bitiyor</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${data.hoursRemaining} saat içinde erişim kapanacak</p>
        </div>

        <div style="padding: 40px;">
            <p style="color: #e2e8f0; margin-bottom: 24px;">Merhaba ${data.userName},</p>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                <strong>Son uyarı!</strong> ${data.planName} aboneliğinize verilen ek süre <strong>${data.hoursRemaining} saat</strong> içinde sona erecek.
            </p>

            <div style="background: #7f1d1d; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #991b1b;">
                    <span style="color: #fca5a5;">Bitiş Zamanı</span>
                    <span style="color: #ffffff; font-weight: 600;">${new Date(data.gracePeriodEndsAt).toLocaleDateString('tr-TR')} ${new Date(data.gracePeriodEndsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #fca5a5;">Kalan Süre</span>
                    <span style="color: #dc2626; font-weight: 700; font-size: 20px;">${data.hoursRemaining} Saat</span>
                </div>
            </div>

            <div style="background: #7f1d1d; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
                <p style="color: #fca5a5; margin: 0; font-size: 14px;">
                    <strong>Dikkat:</strong> Bu süre sonunda premium özelliklerinize erişiminiz kapanacak ve risk analizi limitleriniz sıfırlanacaktır.
                </p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    ${ctaText}
                </a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                Aboneliğinizi yenileyerek kesintisiz hizmet almaya devam edin.
            </p>
        </div>

        <div style="padding: 24px 40px; background: #0f172a; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function generateGracePeriodEndingText(data: GracePeriodEndingData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  const actionUrl = data.paymentUrl || `${baseUrl}/uygulama/ayarlar`

  return `
ACİL: Abonelik ${data.hoursRemaining} Saat İçinde Kapanacak

Merhaba ${data.userName},

SON UYARI! ${data.planName} aboneliğinize verilen ek süre ${data.hoursRemaining} saat içinde sona erecek.

Bitiş Zamanı: ${new Date(data.gracePeriodEndsAt).toLocaleDateString('tr-TR')} ${new Date(data.gracePeriodEndsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
Kalan Süre: ${data.hoursRemaining} Saat

DİKKAT: Bu süre sonunda premium özelliklerinize erişiminiz kapanacak ve risk analizi limitleriniz sıfırlanacaktır.

${data.paymentUrl ? `Ödemeyi tamamlamak için: ${actionUrl}` : `Aboneliği yenilemek için: ${actionUrl}`}

---
© ${new Date().getFullYear()} Kredi Takip
  `
}

// ============================================
// Manuel Ödeme Hatırlatma Bildirimleri
// ============================================

interface ManualPaymentReminderData {
  userName: string
  userEmail: string
  planName: string
  amount: number
  currency: string
  expiresAt: string
  daysUntilExpiry: number
  paymentUrl: string
}

/**
 * Manuel ödeme hatırlatması - Abonelik dolmadan önce gönderilir
 * Kart saklama ve otomatik ödeme olmadığı için kullanıcıya manuel ödeme hatırlatması yapılır
 */
export async function sendManualPaymentReminder(data: ManualPaymentReminderData) {
  try {
    const MAILJET_API_KEY = process.env.MAILJET_API_KEY
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error("[manual-payment-reminder] Mailjet credentials missing")
      return { success: false, error: "Mailjet credentials missing" }
    }

    const emailData = {
      Messages: [
        {
          From: {
            Email: "info@kreditakip.com.tr",
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: data.userEmail,
              Name: data.userName,
            },
          ],
          Subject: `🔔 Aboneliğiniz ${data.daysUntilExpiry} Gün Sonra Sona Erecek - Manuel Ödeme Gerekiyor`,
          HTMLPart: generateManualPaymentReminderHTML(data),
          TextPart: generateManualPaymentReminderText(data),
        },
      ],
    }

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[manual-payment-reminder] Mailjet error:", errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error: any) {
    console.error("[manual-payment-reminder] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateManualPaymentReminderHTML(data: ManualPaymentReminderData): string {
  // Dynamic urgency colors based on days remaining
  const urgencyColor = data.daysUntilExpiry === 0 ? '#dc2626' : data.daysUntilExpiry <= 1 ? '#f59e0b' : '#10b981'
  const urgencyIcon = data.daysUntilExpiry === 0 ? '🚨' : data.daysUntilExpiry <= 1 ? '⚠️' : '📅'

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Ödeme Hatırlatması</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0f172a;
      color: #ffffff;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 60px 0;
    }

    .main {
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
    }

    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 20px;
      filter: brightness(0) invert(1);
    }

    .header-title {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }

    .header-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 8px;
    }

    .content {
      padding: 48px 40px;
      background-color: #1e293b;
    }

    .greeting {
      font-size: 18px;
      color: #ffffff;
      margin-bottom: 32px;
    }

    .greeting strong {
      color: #ffffff;
      font-weight: 600;
    }

    .payment-card {
      background: linear-gradient(145deg, #334155 0%, #475569 100%);
      border: 1px solid #475569;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      position: relative;
    }

    .payment-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${urgencyColor};
    }

    .plan-section {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
    }

    .plan-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;
    }

    .plan-name {
      font-size: 16px;
      color: #ffffff;
      font-weight: 600;
    }

    .amount-section {
      text-align: center;
      margin: 32px 0;
    }

    .amount {
      font-size: 42px;
      font-weight: 800;
      color: #ffffff;
    }

    .info-grid {
      display: flex;
      gap: 32px;
      margin-top: 24px;
    }

    .info-item {
      flex: 1;
      padding: 16px;
      background: #475569;
      border-radius: 8px;
      text-align: center;
    }

    .info-label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .info-value {
      font-size: 16px;
      color: #ffffff;
      font-weight: 700;
    }

    .urgency-indicator {
      background: #475569;
      border-left: 4px solid ${urgencyColor};
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }

    .urgency-text {
      font-size: 16px;
      color: ${urgencyColor};
      font-weight: 700;
      margin-bottom: 8px;
    }

    .urgency-desc {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.6;
    }

    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      margin: 32px 0;
      font-size: 15px;
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
      margin-bottom: 20px;
      opacity: 0.8;
    }

    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 16px;
    }

    .copyright {
      font-size: 11px;
      color: #475569;
      border-top: 1px solid #334155;
      padding-top: 20px;
    }

    @media screen and (max-width: 600px) {
      .header, .content, .footer {
        padding: 32px 24px;
      }

      .payment-card {
        padding: 24px;
      }

      .plan-section {
        flex-direction: column;
        text-align: center;
      }

      .plan-icon {
        margin: 0 auto 12px;
      }

      .info-grid {
        flex-direction: column;
      }

      .amount {
        font-size: 32px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="logo">
        <h1 class="header-title">Ödeme Hatırlatması</h1>
        <p class="header-subtitle">Finansal takibiniz bizimle güvende</p>
      </div>

      <div class="content">
        <p class="greeting">
          Merhaba <strong>${data.userName}</strong>,
        </p>

        <div class="payment-card">
          <div class="plan-section">
            <div class="plan-icon">
              ${urgencyIcon}
            </div>
            <div>
              <div class="plan-name">${data.planName}</div>
            </div>
          </div>

          <div class="amount-section">
            <div class="amount">${data.amount.toFixed(2)} ${data.currency}</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Son Ödeme</div>
              <div class="info-value">${new Date(data.expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Kalan Süre</div>
              <div class="info-value" style="color: ${urgencyColor};">
                ${data.daysUntilExpiry === 0 ? 'BUGÜN' : data.daysUntilExpiry === 1 ? '1 GÜN' : data.daysUntilExpiry + ' GÜN'}
              </div>
            </div>
          </div>
        </div>

        <div class="urgency-indicator">
          <div class="urgency-text">
            ${data.daysUntilExpiry === 0 ? '🚨 ACİL: BUGÜN ÖDEME YAPMANIZ GEREKMEKTEDİR' :
              data.daysUntilExpiry === 1 ? '⚠️ DİKKAT: YARIN SON ÖDEME GÜNÜ' :
              `📅 SON ÖDEME TARİHİNE ${data.daysUntilExpiry} GÜN KALDI`}
          </div>
          <div class="urgency-desc">
            ${data.planName} aboneliğiniz için ödeme süreniz ${data.daysUntilExpiry === 0 ? 'bugün' : data.daysUntilExpiry === 1 ? 'yarın' : data.daysUntilExpiry + ' gün içinde'} sona erecektir. Kesintisiz hizmet almak için lütfen ödemenizi zamanında tamamlayınız.
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${data.paymentUrl}" class="cta-button">
            HEMEN ÖDEME YAP
          </a>
        </div>

        <p class="footer-text" style="margin-top: 24px; text-align: center;">
          Ödeme yapmak için yukarıdaki butona tıklayarak güvenli ödeme sayfamıza yönlendirileceksiniz.<br>
          Tüm işlemleriniz SSL sertifikası ile korunmaktadır.
        </p>
      </div>

      <div class="footer">
        <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="footer-logo">

        <p class="footer-text">
          Bu e-posta otomatik olarak gönderilmiştir.<br>
          Herhangi bir sorunuz için destek@kreditakip.com.tr adresinden bize ulaşabilirsiniz.
        </p>

        <div class="copyright">
          © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

function generateManualPaymentReminderText(data: ManualPaymentReminderData): string {
  return `
KREDİ TAKİP - ÖDEME HATIRLATMASI

${data.daysUntilExpiry === 0 ? '⚠️ ACİL: BUGÜN ÖDEME YAPMANIZ GEREKMEKTEDİR' :
  data.daysUntilExpiry === 1 ? '⚠️ DİKKAT: YARIN SON ÖDEME GÜNÜ' :
  `SON ÖDEME TARİHİNE ${data.daysUntilExpiry} GÜN KALDI`}

═══════════════════════════════════════

Sayın ${data.userName},

${data.planName} hizmet paketinize ait ödeme tarihiniz yaklaşmaktadır. Hizmetinizin kesintiye uğramaması için lütfen ödemenizi zamanında yapınız.

ÖDEME DETAYLARI
═══════════════════════════════════════
Hizmet Paketi    : ${data.planName}
Ödeme Tutarı     : ${data.amount.toFixed(2)} ${data.currency}
Son Ödeme Tarihi : ${new Date(data.expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
Kalan Süre       : ${data.daysUntilExpiry === 0 ? 'BUGÜN' : data.daysUntilExpiry === 1 ? '1 GÜN' : data.daysUntilExpiry + ' GÜN'}

⚠️ ÖNEMLİ UYARI
═══════════════════════════════════════
Ödemenizin zamanında yapılmaması durumunda hizmetiniz otomatik olarak ${data.daysUntilExpiry <= 3 ? 'BUGÜN' : '3 gün içinde'} askıya alınacaktır.

HEMEN ÖDEME YAP: ${data.paymentUrl}

───────────────────────────────────────
Bu e-posta otomatik sistem tarafından gönderilmiştir.
Destek: destek@kreditakip.com.tr

© ${new Date().getFullYear()} Kredi Takip - Tüm hakları saklıdır.
  `
}
