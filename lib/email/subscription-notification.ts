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
  renewalDate: string
  newExpiresAt: string
  isAutomatic: boolean
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
  errorMessage: string
  expiresAt: string
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
                ${data.isAutomatic ? "Kayıtlı kartınızdan otomatik olarak" : "Manuel olarak"} abonelik yenileme işleminiz başarıyla tamamlandı.
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
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #475569;">
                    <span style="color: #94a3b8;">Yenileme Tarihi</span>
                    <span style="color: #ffffff;">${new Date(data.renewalDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #94a3b8;">Yeni Bitiş Tarihi</span>
                    <span style="color: #ffffff; font-weight: 600;">${new Date(data.newExpiresAt).toLocaleDateString('tr-TR')}</span>
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

${data.isAutomatic ? "Kayıtlı kartınızdan otomatik olarak" : "Manuel olarak"} abonelik yenileme işleminiz başarıyla tamamlandı.

Plan: ${data.planName}
Ödenen Tutar: ${data.amount.toFixed(2)} ${data.currency}
Yenileme Tarihi: ${new Date(data.renewalDate).toLocaleDateString('tr-TR')}
Yeni Bitiş Tarihi: ${new Date(data.newExpiresAt).toLocaleDateString('tr-TR')}

Premium özellikleriniz kesintisiz devam edecektir.

---
© ${new Date().getFullYear()} Kredi Takip
  `
}

function generateRenewalFailedHTML(data: {
  userName: string
  userEmail: string
  planName: string
  errorMessage: string
  expiresAt: string
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
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
                ${data.planName} aboneliğinizi yenilemek için yapılan otomatik ödeme işlemi başarısız oldu.
            </p>

            <div style="background: #7f1d1d; border: 1px solid #991b1b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #fca5a5; margin: 0; font-size: 14px;">
                    <strong>Hata:</strong> ${data.errorMessage}
                </p>
            </div>

            <div style="background: #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: #94a3b8;">Abonelik Bitiş Tarihi</span>
                    <span style="color: #fbbf24; font-weight: 600;">${new Date(data.expiresAt).toLocaleDateString('tr-TR')}</span>
                </div>
            </div>

            <p style="color: #e2e8f0; margin-bottom: 24px;">
                Aboneliğinizin kesintiye uğramaması için lütfen aşağıdaki adımları izleyin:
            </p>

            <ul style="color: #e2e8f0; padding-left: 20px; margin-bottom: 24px;">
                <li>Kayıtlı kart bilgilerinizi kontrol edin</li>
                <li>Kartınızda yeterli bakiye olduğundan emin olun</li>
                <li>Gerekirse yeni bir kart ekleyin</li>
            </ul>

            <div style="text-align: center;">
                <a href="${baseUrl}/uygulama/ayarlar" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                    Ödeme Ayarlarına Git
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
  errorMessage: string
  expiresAt: string
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  return `
Abonelik Yenileme Başarısız

Merhaba ${data.userName},

${data.planName} aboneliğinizi yenilemek için yapılan otomatik ödeme işlemi başarısız oldu.

Hata: ${data.errorMessage}

Abonelik Bitiş Tarihi: ${new Date(data.expiresAt).toLocaleDateString('tr-TR')}

Aboneliğinizin kesintiye uğramaması için lütfen:
- Kayıtlı kart bilgilerinizi kontrol edin
- Kartınızda yeterli bakiye olduğundan emin olun
- Gerekirse yeni bir kart ekleyin

Ödeme ayarlarına gitmek için: ${baseUrl}/uygulama/ayarlar

---
© ${new Date().getFullYear()} Kredi Takip
  `
}
