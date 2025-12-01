// Email templates for Paddle subscription events

export const subscriptionEmailTemplates = {
  // New subscription created
  "subscription.created": {
    subject: "Hoş Geldiniz! Aboneliğiniz Başarıyla Oluşturuldu",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aboneliğiniz Oluşturuldu</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .plan-details { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .feature-list { margin: 20px 0; }
        .feature-list li { margin: 8px 0; color: #475569; }
        .badge { display: inline-block; background: #ecfdf5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-left: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Aboneliğiniz Başarıyla Oluşturuldu!</h1>
        </div>
        <div class="content">
            <p>Merhaba <strong>{{customerName}}</strong>,</p>

            <p>Kreditakip.com.tr ailesine hoş geldiniz! <strong>{{planName}}</strong> planına başarıyla geçiş yaptınız.</p>

            <div class="plan-details">
                <h3>📋 Abonelik Detayları</h3>
                <p><strong>Plan:</strong> {{planName}} {{billingPeriod}}<span class="badge">{{amount}} {{currency}}</span></p>
                <p><strong>Başlangıç Tarihi:</strong> {{startDate}}</p>
                <p><strong>Abonelik ID:</strong> {{subscriptionId}}</p>
            </div>

            <h3>✨ Premium Özellikleriniz</h3>
            <ul class="feature-list">
                {{#if features.ocr}}<li>✅ Sınırsız OCR kredi döküm analizi</li>{{/if}}
                {{#if features.risk}}<li>✅ Sınırsız AI Finansal Sağlık Analizi</li>{{/if}}
                <li>✅ Gelişmiş raporlar</li>
                <li>✅ Reklamsız deneyim</li>
                <li>✅ Öncelikli destek</li>
            </ul>

            <p>Aboneliğinizi yönetmek, ödeme bilgilerinizi güncellemek veya istediğiniz zaman iptal etmek için aşağıdaki butona tıklayabilirsiniz:</p>

            <a href="{{managementUrl}}" class="cta-button">Aboneliği Yönet</a>

            <p>Sorularınız veya yardıma ihtiyacınız olursa <a href="mailto:info@kreditakip.com.tr">info@kreditakip.com.tr</a> adresinden bize ulaşabilirsiniz.</p>

            <div class="footer">
                <p>Bu e-posta Kreditakip.com.tr tarafından otomatik olarak gönderilmiştir.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },

  // Payment succeeded
  "payment.succeeded": {
    subject: "Ödemeniz Başarıyla Alındı - Aboneliğiniz Aktif",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ödeme Başarılı</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .payment-details { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .success-icon { font-size: 48px; color: #10b981; text-align: center; margin: 20px 0; }
        .invoice-link { color: #047857; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Ödemeniz Başarılı!</h1>
        </div>
        <div class="content">
            <div class="success-icon">💳</div>

            <p>Merhaba <strong>{{customerName}}</strong>,</p>

            <p><strong>{{planName}}</strong> aboneliğiniz için ödemeniz başarıyla alınmıştır.</p>

            <div class="payment-details">
                <h3>💳 Ödeme Detayları</h3>
                <p><strong>Plan:</strong> {{planName}} - {{billingPeriod}}</p>
                <p><strong>Tutar:</strong> <strong>{{amount}} {{currency}}</strong></p>
                <p><strong>Ödeme Tarihi:</strong> {{paymentDate}}</p>
                <p><strong>İşlem ID:</strong> {{transactionId}}</p>
                {{#if nextBillingDate}}<p><strong>Sonraki Ödeme Tarihi:</strong> {{nextBillingDate}}</p>{{/if}}
            </div>

            <p>Aboneliğiniz aktif durumdadır ve premium özelliklere hemen erişebilirsiniz.</p>

            {{#if invoiceUrl}}
            <p>Faturanızı indirmek için <a href="{{invoiceUrl}}" class="invoice-link">buraya tıklayın</a>.</p>
            {{/if}}

            <a href="{{appUrl}}/uygulama/abonelik" class="cta-button">Aboneliğimi Görüntüle</a>

            <div class="footer">
                <p>Bu e-posta Kreditakip.com.tr tarafından otomatik olarak gönderilmiştir.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },

  // Payment failed
  "payment.failed": {
    subject: "⚠️ Ödemeniz Başarısız Oldu - Lütfen Güncelleyin",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ödeme Başarısız</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fef2f2; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .warning-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .grace-period { background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .warning-icon { font-size: 48px; color: #f59e0b; text-align: center; margin: 20px 0; }
        .days-remaining { font-size: 24px; font-weight: bold; color: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Ödeme Başarısız</h1>
        </div>
        <div class="content">
            <div class="warning-icon">💳</div>

            <p>Merhaba <strong>{{customerName}}</strong>,</p>

            <p><strong>{{planName}}</strong> aboneliğiniz için ödeme alınamadı.</p>

            <div class="warning-box">
                <h3>📋 Ödeme Detayları</h3>
                <p><strong>Deneme Sayısı:</strong> {{attemptNumber}}</p>
                <p><strong>Tutar:</strong> {{amount}} {{currency}}</p>
                <p><strong>Hata:</strong> Ödeme işlemi bankanız tarafından reddedildi.</p>
            </div>

            <div class="grace-period">
                <h3>⏰ Ek Süre</h3>
                <p>Aboneliğiniz için <strong class="days-remaining">{{gracePeriodDays}} günlük</strong> ek süre tanınmıştır.</p>
                <p>Ek süre bitiminde: <strong>{{gracePeriodEnds}}</strong></p>
                <p>Bu süre içinde ödeme bilgilerinizi güncellemezseniz, premium özelliklere erişiminiz kapanacaktır.</p>
            </div>

            <p>Ödemeyi tamamlamak ve aboneliğinizi aktif tutmak için aşağıdaki butona tıklayarak ödeme bilgilerinizi güncelleyin:</p>

            <a href="{{updateUrl}}" class="cta-button">Ödeme Bilgilerini Güncelle</a>

            <p>Kartınızın geçerlilik süresinin dolmadığını, yeterli bakiye olduğunu ve işlemlere açık olduğundan emin olun.</p>

            <p>Sorularınız için <a href="mailto:info@kreditakip.com.tr">info@kreditakip.com.tr</a> adresinden bize ulaşabilirsiniz.</p>

            <div class="footer">
                <p>Bu e-posta Kreditakip.com.tr tarafından otomatik olarak gönderilmiştir.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },

  // Subscription canceled
  "subscription.canceled": {
    subject: "Aboneliğiniz İptal Edildi",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik İptal Edildi</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .info-box { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .info-icon { font-size: 48px; color: #64748b; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Abonelik İptali</h1>
        </div>
        <div class="content">
            <div class="info-icon">👋</div>

            <p>Merhaba <strong>{{customerName}}</strong>,</p>

            <p><strong>{{planName}}</strong> aboneliğiniz talebiniz üzerine iptal edilmiştir.</p>

            <div class="info-box">
                <h3>📅 İptal Detayları</h3>
                <p><strong>İptal Tarihi:</strong> {{canceledDate}}</p>
                <p><strong>Plan:</strong> {{planName}}</p>
                {{#if expirationDate}}<p><strong>Premium Erişim Sonu:</strong> {{expirationDate}}</p>{{/if}}
            </div>

            {{#if expirationDate}}
            <p>Aboneliğiniz <strong>{{expirationDate}}</strong> tarihine kadar premium özelliklerle devam edecektir. Bu tarihe kadar tüm özellikleri kullanmaya devam edebilirsiniz.</p>
            {{else}}
            <p>Aboneliğiniz anında iptal edilmiştir ve premium özelliklere erişim sonlandırılmıştır.</p>
            {{/if}}

            <p>İstediğiniz zaman aboneliğinizi yenileyebilirsiniz:</p>

            <a href="{{appUrl}}/uygulama/premium" class="cta-button">Tekrar Abone Ol</a>

            <p>Bizi seçtiğiniz için teşekkür ederiz. İleride tekrar görüşmeyi umuyoruz!</p>

            <p>Herhangi bir geri bildiriminiz varsa <a href="mailto:info@kreditakip.com.tr">info@kreditakip.com.tr</a> adresinden bizimle paylaşabilirsiniz.</p>

            <div class="footer">
                <p>Bu e-posta Kreditakip.com.tr tarafından otomatik olarak gönderilmiştir.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },

  // Subscription expired / suspended
  "subscription.suspended": {
    subject: "⛔ Aboneliğiniz Askıya Alındı - Premium Erişim Kapatıldı",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Askıya Alındı</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fef2f2; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .alert-box { background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .alert-icon { font-size: 48px; color: #ef4444; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⛔ Abonelik Askıya Alındı</h1>
        </div>
        <div class="content">
            <div class="alert-icon">🚫</div>

            <p>Merhaba <strong>{{customerName}}</strong>,</p>

            <p><strong>{{planName}}</strong> aboneliğiniz ödeme alınamadığı için askıya alınmıştır.</p>

            <div class="alert-box">
                <h3>⚠️ Önemli Bilgi</h3>
                <p>Ek süre içinde ödeme yapılmadığı için premium özelliklerinize erişim kapatılmıştır.</p>
                <p>Kayıtlı kredi verileriniz güvende kalacaktır, ancak premium özellikleri kullanamazsınız.</p>
            </div>

            <p>Premium özelliklere tekrar erişmek için aboneliğinizi yenileyebilirsiniz:</p>

            <a href="{{appUrl}}/uygulama/premium" class="cta-button">Aboneliği Yenile</a>

            <p>Ödeme sorununu çözmek için yardım almak isterseniz <a href="mailto:info@kreditakip.com.tr">info@kreditakip.com.tr</a> adresinden bizimle iletişime geçin.</p>

            <p>Bizi yeniden seçtiğinizde mutlu oluruz!</p>

            <div class="footer">
                <p>Bu e-posta Kreditakip.com.tr tarafından otomatik olarak gönderilmiştir.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },

  // Subscription renewed
  "subscription.renewed": {
    subject: "✅ Aboneliğiniz Yenilendi - Teşekkürler!",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik Yenilendi</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f0fdf4; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .success-box { background: #dcfce7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .success-icon { font-size: 48px; color: #22c55e; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Aboneliğiniz Yenilendi!</h1>
        </div>
        <div class="content">
            <div class="success-icon">🎉</div>

            <p>Merhaba <strong>{{customerName}}</strong>,</p>

            <p><strong>{{planName}}</strong> aboneliğiniz başarıyla yenilendi. Bize güvendiğiniz için teşekkür ederiz!</p>

            <div class="success-box">
                <h3>📋 Yenileme Detayları</h3>
                <p><strong>Plan:</strong> {{planName}} - {{billingPeriod}}</p>
                <p><strong>Yenileme Tarihi:</strong> {{renewalDate}}</p>
                <p><strong>Yeni Bitiş Tarihi:</strong> {{nextBillingDate}}</p>
                <p><strong>Ödeme Tutarı:</strong> {{amount}} {{currency}}</p>
            </div>

            <p>Premium özelliklere kesintisiz erişiminiz devam etmektedir.</p>

            <a href="{{appUrl}}/uygulama/abonelik" class="cta-button">Aboneliğimi Görüntüle</a>

            <p>Herhangi bir sorunuz olursa <a href="mailto:info@kreditakip.com.tr">info@kreditakip.com.tr</a> adresinden bize ulaşabilirsiniz.</p>

            <div class="footer">
                <p>Bu e-posta Kreditakip.com.tr tarafından otomatik olarak gönderilmiştir.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },
}

// Helper function to send subscription emails
export async function sendSubscriptionEmail({
  to,
  template,
  data,
}: {
  to: string
  template: keyof typeof subscriptionEmailTemplates
  data: Record<string, any>
}) {
  const { sendEmail } = await import("@/lib/email")

  const emailTemplate = subscriptionEmailTemplates[template]
  if (!emailTemplate) {
    throw new Error(`Email template not found: ${template}`)
  }

  // Replace template variables
  let html = emailTemplate.html
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g")
    html = html.replace(regex, data[key] || "")
  })

  // Handle simple conditional logic
  html = html.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
    return data[key] ? content : ""
  })

  return await sendEmail({
    to,
    subject: emailTemplate.subject,
    html,
    text: emailTemplate.html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
  })
}