import { type NextRequest, NextResponse } from "next/server"
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"
import { createSupabaseAdmin } from "@/lib/supabase-server"
import { getNotificationPreferences } from "@/lib/api/notification-preferences"
import { getAllPayments } from "@/lib/api/payments"

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

const supabase = createSupabaseAdmin()

async function checkEmailAlreadySent(
  userId: string,
  paymentPlanId: string,
  notificationType: string,
  scheduledDate: Date,
): Promise<boolean> {
  const startOfDay = new Date(scheduledDate)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(scheduledDate)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("payment_plan_id", paymentPlanId)
    .eq("notification_type", "email")
    .gte("scheduled_for", startOfDay.toISOString())
    .lte("scheduled_for", endOfDay.toISOString())
    .not("email_sent_at", "is", null)
    .limit(1)

  if (error) {
    console.error("Error checking duplicate email:", error)
    return false // Hata durumunda e-posta gönderilmesine izin ver
  }

  return data && data.length > 0
}

async function createEmailNotificationRecord(
  userId: string,
  paymentPlanId: string,
  creditId: string,
  title: string,
  message: string,
  scheduledFor: Date,
  emailSentAt?: Date,
  emailProviderId?: string,
  emailStatus = "pending",
  errorMessage?: string,
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      payment_plan_id: paymentPlanId,
      credit_id: creditId,
      title,
      message,
      notification_type: "email",
      scheduled_for: scheduledFor.toISOString(),
      email_sent_at: emailSentAt?.toISOString(),
      email_provider_id: emailProviderId,
      email_delivery_status: emailStatus,
      email_error_message: errorMessage,
      retry_count: 0,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating email notification record:", error)
  }

  return { data, error }
}

function createEmailTemplate(
  firstName: string,
  bankName: string,
  installmentNumber: number,
  amount: string,
  dueDate: string,
  type: string,
) {
  let subject = ""
  let title = ""
  let message = ""
  let urgencyColor = "#10b981" // Default green from original template
  let urgencyBg = "#10b981"
  let urgencyText = "Bilgilendirme"
  let iconEmoji = "⏰" // Default to clock icon from original template

  switch (type) {
    case "3_days_before":
      subject = `Ödeme Hatırlatması - 3 Gün Kaldı`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi 3 gün sonra (${dueDate}) dolacak.`
      urgencyColor = "#f59e0b"
      urgencyBg = "#f59e0b"
      urgencyText = "3 Gün Kaldı"
      iconEmoji = "⏰" // Clock icon for 3 days before
      break

    case "1_day_before":
      subject = `Ödeme Hatırlatması - Yarın Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi yarın (${dueDate}) dolacak.`
      urgencyColor = "#f97316"
      urgencyBg = "#f97316"
      urgencyText = "Yarın Vade"
      iconEmoji = "⏰" // Clock icon for 1 day before
      break

    case "due_date":
      subject = `Ödeme Hatırlatması - Bugün Vade`
      title = "Ödeme Hatırlatması"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi bugün (${dueDate}) doluyor.`
      urgencyColor = "#dc2626"
      urgencyBg = "#dc2626"
      urgencyText = "Bugün Vade"
      iconEmoji = "🚨" // Alert icon for due date
      break

    case "overdue":
      subject = `Gecikmiş Ödeme Bildirimi`
      title = "Gecikmiş Ödeme"
      message = `${bankName} bankasından ${installmentNumber}. taksit ödemenizin vadesi (${dueDate}) geçmiş durumda.`
      urgencyColor = "#dc2626"
      urgencyBg = "#dc2626"
      urgencyText = "Vade Geçti"
      iconEmoji = "❌" // X icon for overdue
      break
  }

  const getBankLogoUrl = (bankName: string): string => {
    const bankMappings: Record<string, string> = {
      "Yapı Kredi": "yapi-kredi-bankasi.png",
      "Yapı Kredi Bankası": "yapi-kredi-bankasi.png",
      "Yapı ve Kredi Bankası A.Ş.": "yapi-kredi-bankasi.png",
      Garanti: "turkiye-garanti-bankasi.png",
      "Garanti BBVA": "turkiye-garanti-bankasi.png",
      "Türkiye Garanti Bankası": "turkiye-garanti-bankasi.png",
      "Türkiye Garanti Bankası A.Ş.": "turkiye-garanti-bankasi.png",
      Akbank: "akbank.png",
      "Akbank T.A.Ş.": "akbank.png",
      "İş Bankası": "turkiye-is-bankasi.png",
      "Türkiye İş Bankası": "turkiye-is-bankasi.png",
      "Türkiye İş Bankası A.Ş.": "turkiye-is-bankasi.png",
      "Ziraat Bankası": "ziraat-bankasi.png",
      "T.C. Ziraat Bankası A.Ş.": "ziraat-bankasi.png",
      VakıfBank: "vakifbank.png",
      "Türkiye Vakıflar Bankası": "vakifbank.png",
      "Türkiye Vakıflar Bankası T.A.O.": "vakifbank.png",
      Halkbank: "turkiye-halk-bankasi.png",
      "Türkiye Halk Bankası A.Ş.": "turkiye-halk-bankasi.png",
      DenizBank: "denizbank.png",
      "DenizBank A.Ş.": "denizbank.png",
      "QNB Finansbank": "qnb-finansbank.png",
      "QNB Finansbank A.Ş.": "qnb-finansbank.png",
      TEB: "turkiye-ekonomi-bankasi.png",
      "Türkiye Ekonomi Bankası A.Ş.": "turkiye-ekonomi-bankasi.png",
      ING: "ing-bank.png",
      "ING Bank A.Ş.": "ing-bank.png",
      Şekerbank: "sekerbank.png",
      "Şekerbank T.A.Ş.": "sekerbank.png",
      Fibabanka: "fibabanka.png",
      "Fibabanka A.Ş.": "fibabanka.png",
      "Enpara.com": "enpara-bank.png",
      HSBC: "hsbc-bank.png",
      "HSBC Bank A.Ş.": "hsbc-bank.png",
      Citibank: "citibank.png",
      "Citibank A.Ş.": "citibank.png",
      "Ziraat Katılım": "ziraat-katilim-bankasi.png",
      "Ziraat Katılım Bankası A.Ş.": "ziraat-katilim-bankasi.png",
      "Vakıf Katılım": "vakif-katilim-bankasi.png",
      "Vakıf Katılım Bankası A.Ş.": "vakif-katilim-bankasi.png",
      "Kuveyt Türk": "kuveyt-turk-katilim-bankasi.png",
      "Kuveyt Türk Katılım Bankası A.Ş.": "kuveyt-turk-katilim-bankasi.png",
      "Albaraka Türk": "albaraka-turk-katilim-bankasi.png",
      "Albaraka Türk Katılım Bankası A.Ş.": "albaraka-turk-katilim-bankasi.png",
      "Türkiye Finans": "turkiye-finans-katilim-bankasi.png",
      "Türkiye Finans Katılım Bankası A.Ş.": "turkiye-finans-katilim-bankasi.png",
    }

    const logoFileName = bankMappings[bankName] || "default-bank.png"
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"
    return `${baseUrl}/bank-icons/${logoFileName}`
  }

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <!--[if mso]>
          <noscript>
              <xml>
                  <o:OfficeDocumentSettings>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                  </o:OfficeDocumentSettings>
              </xml>
          </noscript>
          <![endif]-->
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
              
              /* Header with Gradient */
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
                  max-width: 220px;
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
              
              /* Content Section */
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
              
              .greeting strong {
                  color: #ffffff;
                  font-weight: 600;
              }
              
              /* Modern Payment Card */
              .payment-card {
                  background: linear-gradient(145deg, #334155 0%, #475569 100%);
                  border: 1px solid #475569;
                  border-radius: 12px;
                  padding: 32px;
                  margin-bottom: 32px;
                  position: relative;
                  overflow: hidden;
              }
              
              .payment-card::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: linear-gradient(90deg, ${urgencyColor} 0%, ${urgencyColor} 50%, ${urgencyColor} 100%);
              }
              
              .bank-section {
                  display: flex;
                  align-items: center;
                  margin-bottom: 24px;
                  padding-bottom: 20px;
                  border-bottom: 1px solid #475569;
              }
              
              .bank-icon {
                  width: 48px;
                  height: 48px;
                  background: #ffffff;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-right: 16px;
                  flex-shrink: 0;
                  overflow: hidden;
                  font-size: 24px;
                  color: #10b981;
              }
              
              .bank-logo {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  border-radius: 8px;
              }
              
              .bank-info {
                  flex: 1;
              }
              
              .bank-label {
                  font-size: 12px;
                  color: #94a3b8;
                  text-transform: uppercase;
                  letter-spacing: 0.8px;
                  font-weight: 600;
                  margin-bottom: 4px;
              }
              
              .bank-name {
                  font-size: 16px;
                  color: #ffffff;
                  font-weight: 600;
              }
              
              /* Amount Display */
              .amount-section {
                  text-align: center;
                  margin: 32px 0;
              }
              
              .amount-label {
                  font-size: 12px;
                  color: #94a3b8;
                  text-transform: uppercase;
                  letter-spacing: 0.8px;
                  font-weight: 600;
                  margin-bottom: 12px;
              }
              
              .amount-wrapper {
                  display: inline-flex;
                  align-items: baseline;
                  gap: 8px;
              }
              
              .amount {
                  font-size: 42px;
                  font-weight: 800;
                  color: #ffffff;
                  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                  letter-spacing: -1px;
              }
              
              .currency {
                  font-size: 24px;
                  color: #ffffff;
                  font-weight: 500;
              }
              
              /* Info Grid */
              .info-grid {
                  display: table;
                  width: 100%;
                  margin-top: 24px;
              }
              
              .info-row {
                  display: table-row;
              }
              
              .info-item {
                  display: table-cell;
                  width: 50%;
                  padding: 12px;
                  text-align: center;
                  background: #475569;
                  border: 1px solid #64748b;
              }
              
              .info-item:first-child {
                  border-radius: 8px 0 0 8px;
                  border-right: none;
                  margin-right: 8px;
              }

              .info-item:last-child {
                  border-radius: 0 8px 8px 0;
                  margin-left: 8px;
              }
              
              .info-label {
                  font-size: 11px;
                  color: #94a3b8;
                  text-transform: uppercase;
                  letter-spacing: 0.8px;
                  font-weight: 600;
                  margin-bottom: 6px;
              }
              
              .info-value {
                  font-size: 16px;
                  color: #ffffff;
                  font-weight: 700;
              }
              
              /* Alert Message Box */
              .alert-box {
                  background: #334155;
                  border: 1px solid #475569;
                  border-radius: 12px;
                  padding: 20px;
                  margin-bottom: 32px;
                  position: relative;
              }
              
              .alert-content {
                  display: flex;
                  align-items: center;
                  gap: 16px;
              }
              
              .alert-icon {
                  width: 40px;
                  height: 40px;
                  background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%);
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  font-size: 20px;
                  color: white;
              }
              
              .alert-text-wrapper {
                  flex: 1;
              }
              
              .alert-title {
                  font-size: 14px;
                  font-weight: 600;
                  color: #ffffff;
                  margin-bottom: 4px;
              }
              
              .alert-message {
                  font-size: 14px;
                  color: #e2e8f0;
                  line-height: 1.5;
              }
              
              /* CTA Button */
              .cta-wrapper {
                  text-align: center;
                  margin: 40px 0 32px;
              }
              
              .cta-button {
                  display: inline-block;
                  padding: 16px 40px;
                  background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 12px;
                  font-weight: 600;
                  font-size: 15px;
                  letter-spacing: 0.3px;
                  box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.25);
                  transition: all 0.3s ease;
                  position: relative;
                  overflow: hidden;
              }
              
              .cta-button:before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: -100%;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                  transition: left 0.5s ease;
              }
              
              .cta-button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.35);
              }
              
              .cta-button:hover:before {
                  left: 100%;
              }
              
              /* Secondary Links */
              .secondary-links {
                  text-align: center;
                  margin-top: 24px;
              }
              
              .secondary-link {
                  display: inline-block;
                  color: #10b981;
                  text-decoration: none;
                  font-size: 14px;
                  font-weight: 500;
                  margin: 0 16px;
                  transition: color 0.2s;
              }
              
              .secondary-link:hover {
                  color: #0d9488;
                  text-decoration: underline;
              }
              
              /* Footer */
              .footer {
                  padding: 40px;
                  background: #0f172a;
                  border-top: 1px solid #334155;
                  text-align: center;
              }
              
              .footer-logo {
                  width: 140px;
                  height: auto;
                  margin: 0 auto 20px;
                  opacity: 0.8;
              }
              
              .footer-links {
                  margin-bottom: 24px;
              }
              
              .footer-link {
                  display: inline-block;
                  color: #64748b;
                  text-decoration: none;
                  font-size: 13px;
                  margin: 0 12px;
                  transition: color 0.2s;
              }
              
              .footer-link:hover {
                  color: #10b981;
              }
              
              .footer-divider {
                  color: #475569;
                  margin: 0 8px;
                  font-size: 10px;
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
              
              /* Responsive Design */
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
                  
                  .payment-card {
                      padding: 24px;
                  }
                  
                  .bank-section {
                      flex-direction: column;
                      text-align: center;
                  }
                  
                  .bank-icon {
                      margin: 0 auto 12px;
                  }
                  
                  .amount {
                      font-size: 36px;
                  }
                  
                  .info-item {
                      display: block;
                      width: 100%;
                      margin-bottom: 8px;
                      border-radius: 8px !important;
                      border: 1px solid #64748b !important;
                  }
                  
                  .footer {
                      padding: 32px 24px;
                  }
                  
                  .secondary-link {
                      display: block;
                      margin: 8px 0;
                  }
                  
                  .footer-link {
                      display: block;
                      margin: 8px 0;
                  }
                  
                  .footer-divider {
                      display: none;
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
                              <h1 class="header-title">${title}</h1>
                              <p class="header-subtitle">Finansal takibiniz bizimle güvende</p>
                          </div>
                          
                          <div class="content">
                              <p class="greeting">
                                  Merhaba <strong>${firstName || "Değerli Müşterimiz"}</strong>,
                              </p>
                              
                              <div class="payment-card">
                                  <div class="bank-section">
                                      <div class="bank-icon">
                                          <img src="${getBankLogoUrl(bankName)}" alt="${bankName}" class="bank-logo">
                                      </div>
                                      <div class="bank-info">
                                          <div class="bank-label">Banka</div>
                                          <div class="bank-name">${bankName}</div>
                                      </div>
                                  </div>
                                  
                                  <div class="amount-section">
                                      <div class="amount-label">Ödeme Tutarı</div>
                                      <div class="amount-wrapper">
                                          <span class="amount">${amount}</span>
                                          <span class="currency">₺</span>
                                      </div>
                                  </div>
                                  
                                  <div class="info-grid">
                                      <div class="info-row">
                                          <div class="info-item">
                                              <div class="info-label">Taksit</div>
                                              <div class="info-value">${installmentNumber}</div>
                                          </div>
                                          <div class="info-item">
                                              <div class="info-label">Vade Tarihi</div>
                                              <div class="info-value">${dueDate}</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              <div class="alert-box">
                                  <div class="alert-content">
                                      <div class="alert-icon">${iconEmoji}</div>
                                      <div class="alert-text-wrapper">
                                          <div class="alert-title">${urgencyText}</div>
                                          <div class="alert-message">
                                              ${message} ${
                                                type === "overdue"
                                                  ? "Lütfen en kısa sürede ödemenizi yaparak gecikme faizinden kaçının."
                                                  : "Zamanında ödeme yaparak kredi notunuzu koruyabilir ve gecikme faizinden kaçınabilirsiniz."
                                              }
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              <div class="cta-wrapper">
                                  <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">
                                      Ödeme Planını Görüntüle
                                  </a>
                              </div>
                              
                              <div class="secondary-links">
                                  <a href="https://kreditakip.com.tr/uygulama/hatirlatici" class="secondary-link">Hatırlatıcı Kur</a>
                                  <a href="https://kreditakip.com.tr/uygulama/odeme-yap" class="secondary-link">Hızlı Ödeme</a>
                              </div>
                          </div>
                          
                          <div class="footer">
                              <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="footer-logo">
                              
                              <div class="footer-links">
                                  <a href="https://kreditakip.com.tr/uygulama/ayarlar" class="footer-link">Bildirim Ayarları</a>
                                  <span class="footer-divider">•</span>
                                  <a href="https://kreditakip.com.tr/uygulama" class="footer-link">Uygulama</a>
                                  <span class="footer-divider">•</span>
                                  <a href="https://kreditakip.com.tr/destek" class="footer-link">Destek</a>
                                  <span class="footer-divider">•</span>
                                  <a href="https://kreditakip.com.tr/gizlilik" class="footer-link">Gizlilik</a>
                              </div>
                              
                              <p class="footer-text">
                                  Bu e-posta otomatik olarak gönderilmiştir.<br>
                                  E-posta bildirimlerini almak istemiyorsanız, ayarlar sayfasından kapatabilirsiniz.
                              </p>
                              
                              <div class="copyright">
                                  © 2025 kreditakip.com.tr • Tüm hakları saklıdır
                              </div>
                          </div>
                      </td>
                  </tr>
              </table>
          </div>
      </body>
      </html>
    `,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, testMode, testEmail } = await request.json()

    if (testMode && testEmail) {
      if (!process.env.MAILERSEND_API_KEY) {
        console.error("MAILERSEND_API_KEY environment variable is not set")
        return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
      }

      // Mock data for testing
      const mockBankName = "Test Bankası A.Ş."
      const mockAmount = "1.250"
      const mockDueDate = new Date().toLocaleDateString("tr-TR")
      const mockInstallmentNumber = 5
      const mockFirstName = "Test Kullanıcısı"

      try {
        const emailTemplate = createEmailTemplate(
          mockFirstName,
          mockBankName,
          mockInstallmentNumber,
          mockAmount,
          mockDueDate,
          type,
        )

        const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
        const recipients = [new Recipient(testEmail, mockFirstName)]

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(`[TEST] ${emailTemplate.subject}`)
          .setHtml(emailTemplate.html)

        const response = await mailerSend.email.send(emailParams)

        if (response.statusCode !== 202) {
          console.error(`MailerSend test error:`, response)
          return NextResponse.json(
            {
              success: false,
              error: `HTTP ${response.statusCode}`,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: "Test e-postası başarıyla gönderildi",
          messageId: response.headers?.["x-message-id"] || "unknown",
        })
      } catch (error) {
        console.error("Error sending test email:", error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        )
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!process.env.MAILERSEND_API_KEY) {
      console.error("MAILERSEND_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Kullanıcının bildirim tercihlerini al
    const preferences = await getNotificationPreferences(userId)
    if (!preferences || !preferences.email_enabled) {
      return NextResponse.json({ message: "Email notifications disabled for user" }, { status: 200 })
    }

    // Kullanıcının e-posta adresini al
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single()

    if (profileError || !profile?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 })
    }

    // Kullanıcının ödemelerini al
    const payments = await getAllPayments(userId, 1, 1) // 1 ay geçmiş + 1 ay gelecek

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    let emailsSent = 0
    let emailsSkipped = 0
    const results = []

    // Bildirim tipine göre filtreleme
    let paymentsToNotify = []

    switch (type) {
      case "3_days_before":
        if (preferences.email_3_days_before) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate.toDateString() === threeDaysLater.toDateString() && p.status === "pending"
          })
        }
        break

      case "1_day_before":
        if (preferences.email_1_day_before) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate.toDateString() === tomorrow.toDateString() && p.status === "pending"
          })
        }
        break

      case "due_date":
        if (preferences.email_on_due_date) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate.toDateString() === today.toDateString() && p.status === "pending"
          })
        }
        break

      case "overdue":
        if (preferences.email_overdue) {
          paymentsToNotify = payments.filter((p) => {
            const dueDate = new Date(p.due_date)
            return dueDate < today && p.status === "pending"
          })
        }
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // Her ödeme için e-posta gönder
    for (const payment of paymentsToNotify) {
      const bankName = payment.credits.banks.name
      const amount = payment.total_payment.toLocaleString("tr-TR")
      const dueDate = new Date(payment.due_date).toLocaleDateString("tr-TR")
      const installmentNumber = payment.installment_number
      const scheduledFor = new Date()

      const alreadySent = await checkEmailAlreadySent(userId, payment.id, type, scheduledFor)
      if (alreadySent) {
        results.push({
          paymentId: payment.id,
          bankName,
          amount,
          dueDate,
          success: false,
          skipped: true,
          reason: "Email already sent today",
        })
        emailsSkipped++
        continue
      }

      try {
        const emailTemplate = createEmailTemplate(
          profile.first_name || "",
          bankName,
          installmentNumber,
          amount,
          dueDate,
          type,
        )

        const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
        const recipients = [new Recipient(profile.email, profile.first_name || "")]

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(emailTemplate.subject)
          .setHtml(emailTemplate.html)

        const response = await mailerSend.email.send(emailParams)

        if (response.statusCode !== 202) {
          console.error(`MailerSend error for payment ${payment.id}:`, response)

          await createEmailNotificationRecord(
            userId,
            payment.id,
            payment.credit_id,
            emailTemplate.subject,
            `${bankName} bankasından ${installmentNumber}. taksit ödeme hatırlatması`,
            scheduledFor,
            undefined,
            undefined,
            "failed",
            `HTTP ${response.statusCode}`,
          )

          results.push({
            paymentId: payment.id,
            bankName,
            amount,
            dueDate,
            success: false,
            error: `HTTP ${response.statusCode}`,
          })
        } else {
          const emailSentAt = new Date()
          const messageId = response.headers?.["x-message-id"] || "unknown"

          await createEmailNotificationRecord(
            userId,
            payment.id,
            payment.credit_id,
            emailTemplate.subject,
            `${bankName} bankasından ${installmentNumber}. taksit ödeme hatırlatması`,
            scheduledFor,
            emailSentAt,
            messageId,
            "sent",
          )

          results.push({
            paymentId: payment.id,
            bankName,
            amount,
            dueDate,
            success: true,
            messageId,
          })
          emailsSent++
        }
      } catch (error) {
        console.error(`Error sending email for payment ${payment.id}:`, error)

        const errorMessage = error instanceof Error ? error.message : String(error)

        await createEmailNotificationRecord(
          userId,
          payment.id,
          payment.credit_id,
          `Ödeme Hatırlatması - ${type}`,
          `${bankName} bankasından ${installmentNumber}. taksit ödeme hatırlatması`,
          scheduledFor,
          undefined,
          undefined,
          "failed",
          errorMessage,
        )

        results.push({
          paymentId: payment.id,
          bankName,
          amount,
          dueDate,
          success: false,
          error: errorMessage,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${emailsSent} e-posta gönderildi, ${emailsSkipped} e-posta atlandı (zaten gönderilmiş)`,
      emailsSent,
      emailsSkipped,
      totalPayments: paymentsToNotify.length,
      results,
    })
  } catch (error) {
    console.error("Error in send-reminders:", error)
    return NextResponse.json({ error: "Bildirimler gönderilirken hata oluştu" }, { status: 500 })
  }
}
