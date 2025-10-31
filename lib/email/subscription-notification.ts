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
    console.log("[subscription-email] Email sent successfully")
    return { success: true, result }
  } catch (error: any) {
    console.error("[subscription-email] Error:", error)
    return { success: false, error: error.message }
  }
}

function generateSubscriptionEmailHTML(data: SubscriptionEmailData): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yeni Abonelik</title>
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
            animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
        }
        .logo-container {
            position: relative;
            z-index: 2;
            margin-bottom: 10px;
        }
        .logo {
            width: 250px;
            height: auto;
            display: block;
            margin: 0 auto;
        }
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

        .message {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 35px;
            line-height: 1.7;
            text-align: center;
        }

        .subscription-details {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 15px;
            padding: 30px;
            margin: 35px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }
        .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #10b981;
        }
        .amount-highlight {
            font-size: 24px;
            font-weight: 700;
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
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 25px;
            }
            .logo {
                width: 200px;
            }
            .title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-container">
                <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip Logo" class="logo" />
                <div class="brand-tagline">Kredi Yönetiminin Geleceği</div>
                <div class="welcome-badge">🎉 Yeni Abonelik!</div>
            </div>
        </div>

        <div class="content">
            <h1 class="title">
                Yeni <span class="highlight">Premium Abonelik</span> Başlatıldı
            </h1>

            <div class="message">
                Harika haber! Yeni bir kullanıcı premium üyelik satın aldı.
            </div>

            <div class="subscription-details">
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
            <div class="footer-brand">Kredi Takip</div>
            <div class="footer-note">
                Bu e-posta otomatik olarak gönderilmiştir.<br>
                © ${new Date().getFullYear()} Kredi Takip - Tüm hakları saklıdır.
            </div>
        </div>
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
