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
            Name: "Kredi Takip",
          },
          To: [
            {
              Email: "info@kreditakip.com.tr",
              Name: "Kredi Takip Admin",
            },
          ],
          Subject: `Yeni Premium Abonelik - ${data.planName}`,
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
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yeni Premium Abonelik</title>
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
      max-width: 200px;
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
      background: #10b981;
    }

    .plan-section {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
      text-align: center;
    }

    .plan-name {
      font-size: 20px;
      color: #ffffff;
      font-weight: 600;
      margin-bottom: 8px;
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

    .footer {
      padding: 40px;
      background: #0f172a;
      border-top: 1px solid #334155;
      text-align: center;
    }

    .footer-logo {
      width: 120px;
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
        <h1 class="header-title">Yeni Premium Abonelik</h1>
        <p class="header-subtitle">Platformunuza yeni bir üye katıldı</p>
      </div>

      <div class="content">
        <p class="greeting">
          Harika haber!
        </p>

        <div class="payment-card">
          <div class="plan-section">
            <div class="plan-name">${data.planName}</div>
          </div>

          <div class="amount-section">
            <div class="amount">${data.amount.toFixed(2)} ${data.currency}</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Kullanıcı</div>
              <div class="info-value">${data.userName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">E-posta</div>
              <div class="info-value">${data.userEmail}</div>
            </div>
          </div>

          <div class="info-grid" style="margin-top: 16px;">
            <div class="info-item">
              <div class="info-label">Başlangıç</div>
              <div class="info-value">${new Date(data.startDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bitiş</div>
              <div class="info-value">${new Date(data.expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
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

function generateSubscriptionEmailText(data: SubscriptionEmailData): string {
  return `
Yeni Premium Abonelik

Harika haber! Platformunuza yeni bir üye katıldı.

Plan: ${data.planName}
Tutar: ${data.amount.toFixed(2)} ${data.currency}
Kullanıcı: ${data.userName}
E-posta: ${data.userEmail}
Başlangıç: ${new Date(data.startDate).toLocaleDateString('tr-TR')}
Bitiş: ${new Date(data.expiresAt).toLocaleDateString('tr-TR')}

---
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
          Subject: `Aboneliğiniz Yenilendi - ${data.planName}`,
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
          Subject: `Abonelik Yenileme Başarısız - İşlem Gerekli`,
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Yenilendi</title>
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
      max-width: 200px;
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
      background: #10b981;
    }

    .plan-section {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
      text-align: center;
    }

    .plan-name {
      font-size: 20px;
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

    .footer {
      padding: 40px;
      background: #0f172a;
      border-top: 1px solid #334155;
      text-align: center;
    }

    .footer-logo {
      width: 120px;
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
        <h1 class="header-title">Abonelik Yenilendi</h1>
        <p class="header-subtitle">Premium üyeliğiniz başarıyla uzatıldı</p>
      </div>

      <div class="content">
        <p class="greeting">
          Merhaba <strong>${data.userName}</strong>,
        </p>

        <div class="payment-card">
          <div class="plan-section">
            <div class="plan-name">${data.planName}</div>
          </div>

          <div class="amount-section">
            <div class="amount">${data.amount.toFixed(2)} ${data.currency}</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Yeni Bitiş Tarihi</div>
              <div class="info-value">${new Date(data.newExpiryDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <p class="footer-text" style="text-align: center; color: #94a3b8;">
          Abonelik yenileme işleminiz başarıyla tamamlandı. Premium özellikleriniz kesintisiz devam edecektir.
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

function generateRenewalSuccessText(data: RenewalNotificationData): string {
  return `
Abonelik Yenilendi

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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Yenileme Başarısız</title>
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
      max-width: 200px;
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
      background: #dc2626;
    }

    .error-section {
      background: #7f1d1d;
      border: 1px solid #991b1b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: center;
    }

    .error-text {
      color: #fca5a5;
      font-size: 14px;
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
      width: 120px;
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
        <h1 class="header-title">Abonelik Yenileme Başarısız</h1>
        <p class="header-subtitle">Ödeme işlemi tamamlanamadı</p>
      </div>

      <div class="content">
        <p class="greeting">
          Merhaba <strong>${data.userName}</strong>,
        </p>

        <div class="payment-card">
          <div class="error-section">
            <p class="error-text">
              <strong>Hata:</strong> ${data.failureReason}
            </p>
          </div>

          <div class="amount-section">
            <div class="amount">${data.amount.toFixed(2)} ${data.currency}</div>
          </div>

          <p style="color: #e2e8f0; text-align: center; margin-top: 24px;">
            ${data.planName} aboneliğinizi yenilemek için yapılan ödeme işlemi başarısız oldu. Aboneliğinizin kesintiye uğramaması için lütfen ödeme ayarlarınızı kontrol edin.
          </p>

          <div style="text-align: center;">
            <a href="${data.retryUrl}" class="cta-button">
              Tekrar Dene
            </a>
          </div>
        </div>
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
          Subject: `Aboneliğiniz 3 Gün Sonra Yenilenecek`,
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Yenilenecek</title>
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
      max-width: 200px;
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
      background: #3b82f6;
    }

    .plan-section {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
      text-align: center;
    }

    .plan-name {
      font-size: 20px;
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

    .info-note {
      background: #1e40af;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      color: #dbeafe;
      font-size: 14px;
      text-align: center;
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
      width: 120px;
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
        <h1 class="header-title">Abonelik Yenilenecek</h1>
        <p class="header-subtitle">3 gün sonra otomatik yenileme</p>
      </div>

      <div class="content">
        <p class="greeting">
          Merhaba <strong>${data.userName}</strong>,
        </p>

        <div class="payment-card">
          <div class="plan-section">
            <div class="plan-name">${data.planName}</div>
          </div>

          <div class="amount-section">
            <div class="amount">${data.amount.toFixed(2)} ${data.currency}</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Yenileme Tarihi</div>
              <div class="info-value">${new Date(data.renewalDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Kart (Son 4 Hane)</div>
              <div class="info-value">**** ${data.last4}</div>
            </div>
          </div>

          <div class="info-note">
            <strong>Önemli Bilgi:</strong> Kayıtlı kartınızdan otomatik ödeme alınacaktır. İptal etmek isterseniz, yenileme tarihinden önce aboneliğinizi iptal edebilirsiniz.
          </div>

          <div style="text-align: center;">
            <a href="${data.cancelUrl}" class="cta-button" style="background: #dc2626;">
              Aboneliği İptal Et
            </a>
          </div>
        </div>
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

function generateUpcomingRenewalText(data: UpcomingRenewalData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
  return `
Abonelik 3 Gün Sonra Yenilenecek

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
          Subject: `Abonelik Yenileme Onayı Gerekiyor - ${data.planName}`,
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Yenileme Onayı</title>
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
      max-width: 200px;
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
      background: #3b82f6;
    }

    .plan-section {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
      text-align: center;
    }

    .plan-name {
      font-size: 20px;
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

    .info-note {
      background: #1e40af;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      color: #dbeafe;
      font-size: 14px;
      text-align: center;
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
      width: 120px;
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
        <h1 class="header-title">Abonelik Yenileme Onayı</h1>
        <p class="header-subtitle">Ödemenizi onaylamanız gerekiyor</p>
      </div>

      <div class="content">
        <p class="greeting">
          Merhaba <strong>${data.userName}</strong>,
        </p>

        <div class="payment-card">
          <div class="plan-section">
            <div class="plan-name">${data.planName}</div>
          </div>

          <div class="amount-section">
            <div class="amount">${data.amount.toFixed(2)} ${data.currency}</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Bitiş Tarihi</div>
              <div class="info-value">${new Date(data.renewalDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
            </div>
          </div>

          <div class="info-note">
            <strong>Önemli:</strong> Bu ödeme linki ${data.linkExpiresIn} içinde geçerliliğini yitirecektir. Lütfen en kısa sürede ödemenizi tamamlayın.
          </div>

          <div style="text-align: center;">
            <a href="${data.paymentUrl}" class="cta-button">
              Ödemeyi Onayla ve Tamamla
            </a>
          </div>
        </div>

        <p style="color: #94a3b8; font-size: 14px; text-align: center;">
          Güvenli ödeme sayfasında kartınızdan ${data.amount.toFixed(2)} ${data.currency} tutarında ödeme alınacaktır.
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
          Subject: `Abonelik Süresi Doldu - ${data.daysRemaining} Gün Ek Süre`,
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Süresi Doldu</title>
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
      max-width: 200px;
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
      background: #f59e0b;
    }

    .plan-section {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
      text-align: center;
    }

    .plan-name {
      font-size: 20px;
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
      color: #f59e0b;
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

    .info-note {
      background: #78350f;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      color: #fcd34d;
      font-size: 14px;
      text-align: center;
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
      width: 120px;
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
        <h1 class="header-title">Abonelik Süresi Doldu</h1>
        <p class="header-subtitle">${data.daysRemaining} gün ek süre tanındı</p>
      </div>

      <div class="content">
        <p class="greeting">
          Merhaba <strong>${data.userName}</strong>,
        </p>

        <div class="payment-card">
          <div class="plan-section">
            <div class="plan-name">${data.planName}</div>
          </div>

          <div class="amount-section">
            <div class="amount">${data.daysRemaining} Gün</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Abonelik Bitiş</div>
              <div class="info-value">${new Date(data.expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Ek Süre Bitiş</div>
              <div class="info-value">${new Date(data.gracePeriodEndsAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
            </div>
          </div>

          <div class="info-note">
            <strong>Önemli:</strong> ${data.daysRemaining} gün içinde aboneliğinizi yenilemezseniz, premium özelliklerinize erişiminiz kapatılacaktır.
          </div>

          <div style="text-align: center;">
            <a href="${baseUrl}/uygulama/ayarlar" class="cta-button">
              Aboneliği Yenile
            </a>
          </div>
        </div>
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
          Subject: `ACİL: Abonelik ${data.hoursRemaining} Saat İçinde Kapanacak`,
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Bitiyor</title>
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
      max-width: 200px;
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
      background: #dc2626;
    }

    .plan-section {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
      text-align: center;
    }

    .plan-name {
      font-size: 20px;
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
      color: #dc2626;
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

    .info-note {
      background: #7f1d1d;
      border-left: 4px solid #dc2626;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      color: #fca5a5;
      font-size: 14px;
      text-align: center;
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
      width: 120px;
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
        <h1 class="header-title">ACİL: Abonelik Bitiyor</h1>
        <p class="header-subtitle">${data.hoursRemaining} saat içinde erişim kapanacak</p>
      </div>

      <div class="content">
        <p class="greeting">
          Merhaba <strong>${data.userName}</strong>,
        </p>

        <div class="payment-card">
          <div class="plan-section">
            <div class="plan-name">${data.planName}</div>
          </div>

          <div class="amount-section">
            <div class="amount">${data.hoursRemaining} Saat</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Bitiş Zamanı</div>
              <div class="info-value">${new Date(data.gracePeriodEndsAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} ${new Date(data.gracePeriodEndsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <div class="info-note">
            <strong>Dikkat:</strong> Bu süre sonunda premium özelliklerinize erişiminiz kapanacak ve risk analizi limitleriniz sıfırlanacaktır.
          </div>

          <div style="text-align: center;">
            <a href="${ctaUrl}" class="cta-button">
              ${ctaText}
            </a>
          </div>
        </div>
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

    // 0 gün ise "bugün", değilse "X gün sonra" formatı
    const daysText = data.daysUntilExpiry === 0 ? 'Bugün' : `${data.daysUntilExpiry} Gün Sonra`

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
          Subject: `Aboneliğiniz ${daysText} Sona Erecek - Manuel Ödeme Gerekiyor`,
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
  const daysText = data.daysUntilExpiry === 0 ? 'BUGÜN' : data.daysUntilExpiry === 1 ? '1 GÜN' : data.daysUntilExpiry + ' GÜN'

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
      max-width: 200px;
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
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #475569;
      text-align: center;
    }

    .plan-name {
      font-size: 20px;
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
      width: 120px;
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
            <div class="plan-name">${data.planName}</div>
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
                ${daysText}
              </div>
            </div>
          </div>
        </div>

        <div class="urgency-indicator">
          <div class="urgency-text">
            ${data.daysUntilExpiry === 0 ? 'ACİL: BUGÜN ÖDEME YAPMANIZ GEREKMEKTEDİR' :
              data.daysUntilExpiry === 1 ? 'DİKKAT: YARIN SON ÖDEME GÜNÜ' :
              `SON ÖDEME TARİHİNE ${data.daysUntilExpiry} GÜN KALDI`}
          </div>
          <div class="urgency-desc">
            ${data.planName} aboneliğiniz için ödeme süreniz ${data.daysUntilExpiry === 0 ? 'bugün' : data.daysUntilExpiry === 1 ? 'yarın' : data.daysUntilExpiry + ' gün içinde'} sona erecektir. Kesintisiz hizmet almak için lütfen ödemenizi zamanında tamamlayınız.
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${data.paymentUrl}" class="cta-button">
            Hemen Ödeme Yap
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
  const daysText = data.daysUntilExpiry === 0 ? 'BUGÜN' : data.daysUntilExpiry === 1 ? '1 GÜN' : data.daysUntilExpiry + ' GÜN'

  return `
KREDİ TAKİP - ÖDEME HATIRLATMASI

${data.daysUntilExpiry === 0 ? 'ACİL: BUGÜN ÖDEME YAPMANIZ GEREKMEKTEDİR' :
  data.daysUntilExpiry === 1 ? 'DİKKAT: YARIN SON ÖDEME GÜNÜ' :
  `SON ÖDEME TARİHİNE ${data.daysUntilExpiry} GÜN KALDI`}

═══════════════════════════════════════

Sayın ${data.userName},

${data.planName} hizmet paketinize ait ödeme tarihiniz yaklaşmaktadır. Hizmetinizin kesintiye uğramaması için lütfen ödemenizi zamanında yapınız.

ÖDEME DETAYLARI
═══════════════════════════════════════
Hizmet Paketi    : ${data.planName}
Ödeme Tutarı     : ${data.amount.toFixed(2)} ${data.currency}
Son Ödeme Tarihi : ${new Date(data.expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
Kalan Süre       : ${daysText}

ÖNEMLI UYARI
═══════════════════════════════════════
Ödemenizin zamanında yapılmaması durumunda hizmetiniz otomatik olarak ${data.daysUntilExpiry <= 3 ? 'BUGÜN' : '3 gün içinde'} askıya alınacaktır.

HEMEN ÖDEME YAP: ${data.paymentUrl}

───────────────────────────────────────
Bu e-posta otomatik sistem tarafından gönderilmiştir.
Destek: destek@kreditakip.com.tr

© ${new Date().getFullYear()} Kredi Takip - Tüm hakları saklıdır.
  `
}
