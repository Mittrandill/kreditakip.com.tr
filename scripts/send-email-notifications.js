const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend")
const { createClient } = require("@supabase/supabase-js")

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY)

async function createEmailTemplate(firstName, bankName, installmentNumber, amount, dueDate, type) {
  const isReminder = type === "reminder"
  const subject = isReminder ? `💳 Kredi Taksit Hatırlatması - ${bankName}` : `⚠️ Geciken Ödeme Bildirimi - ${bankName}`

  const getBankLogoUrl = (bankName) => {
    const bankMappings = {
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

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
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
          background: ${isReminder ? "#10b981" : "#dc2626"};
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
          overflow: hidden;
        }
        
        .bank-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .bank-name {
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
          gap: 16px;
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
        
        .cta-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          margin: 32px 0;
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
          
          .bank-section {
            flex-direction: column;
            text-align: center;
          }
          
          .bank-icon {
            margin: 0 auto 12px;
          }
          
          .info-grid {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"}/images/design-mode/logo-white.png" alt="Kredi Takip" class="logo">
            <h1 class="header-title">${isReminder ? "Ödeme Hatırlatması" : "Gecikmiş Ödeme"}</h1>
            <p class="header-subtitle">Finansal takibiniz bizimle güvende</p>
          </div>
          
          <div class="content">
            <p class="greeting">
              Merhaba <strong>${firstName}</strong>,
            </p>
            
            <div class="payment-card">
              <div class="bank-section">
                <div class="bank-icon">
                  <img src="${getBankLogoUrl(bankName)}" alt="${bankName} logosu" class="bank-logo" onerror="this.style.display='none'; this.parentNode.innerHTML='🏦'; this.parentNode.style.fontSize='24px'; this.parentNode.style.color='#10b981';">
                </div>
                <div>
                  <div class="bank-name">${bankName}</div>
                </div>
              </div>
              
              <div class="amount-section">
                <div class="amount">${amount} ₺</div>
              </div>
              
              <div class="info-grid">
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
            
            <div style="text-align: center;">
              <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">
                Ödeme Planını Görüntüle
              </a>
            </div>
          </div>
          
          <div class="footer">
            <img src="${process.env.NEXT_PUBLIC_SITE_URL || "https://kreditakip.com.tr"}/images/design-mode/logo-white.png" alt="Kredi Takip" class="footer-logo">
            
            <p class="footer-text">
              Bu e-posta otomatik olarak gönderilmiştir.<br>
              E-posta bildirimlerini almak istemiyorsanız, ayarlar sayfasından kapatabilirsiniz.
            </p>
            
            <div class="copyright">
              © 2025 kreditakip.com.tr • Tüm hakları saklıdır
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

async function sendNotifications() {
  try {
    console.log("🚀 Email notification workflow started")

    if (!process.env.MAILERSEND_API_KEY) {
      throw new Error("MAILERSEND_API_KEY not configured")
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured")
    }

    if (!process.env.SERVICE_ROLE_KEY) {
      throw new Error("SERVICE_ROLE_KEY not configured")
    }

    // Test mode kontrolü
    if (process.env.TEST_MODE === "true" && process.env.TEST_EMAIL) {
      console.log("📧 Running in test mode")

      const emailTemplate = await createEmailTemplate(
        "Test Kullanıcısı",
        "Test Bankası A.Ş.",
        5,
        "1.250",
        new Date().toLocaleDateString("tr-TR"),
        "reminder",
      )

      const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
      const recipients = [new Recipient(process.env.TEST_EMAIL, "Test Kullanıcısı")]

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(`[TEST] ${emailTemplate.subject}`)
        .setHtml(emailTemplate.html)

      const response = await mailerSend.email.send(emailParams)

      if (response.statusCode === 202) {
        console.log("✅ Test email sent successfully")
      } else {
        console.error("❌ Test email failed:", response)
        process.exit(1)
      }

      return
    }

    // Bildirim tercihli kullanıcıları al
    const { data: notificationPrefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("email_enabled", true)

    if (prefsError) {
      throw new Error(`Notification preferences fetch error: ${prefsError.message}`)
    }

    console.log(`📋 Found ${notificationPrefs?.length || 0} users with email notifications enabled`)

    // Kullanıcı bilgilerini ayrı sorgu ile al
    const userIds = notificationPrefs?.map((pref) => pref.user_id) || []

    if (userIds.length === 0) {
      console.log("📭 No users with email notifications enabled")
      return
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", userIds)

    if (profilesError) {
      throw new Error(`Profiles fetch error: ${profilesError.message}`)
    }

    let totalSent = 0

    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const oneDayLater = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Get all payment plans for today, 1 day, and 3 days from now
    const { data: paymentPlans, error: paymentsError } = await supabase
      .from("payment_plans")
      .select(`
        id,
        credit_id,
        installment_number,
        due_date,
        total_payment,
        status,
        credits!inner(
          id,
          user_id,
          bank_id,
          banks!inner(
            id,
            name
          )
        )
      `)
      .in("due_date", [todayStr, oneDayLater, threeDaysLater])
      .eq("status", "pending")

    if (paymentsError) {
      throw new Error(`Payment plans fetch error: ${paymentsError.message}`)
    }

    console.log(`💳 Found ${paymentPlans?.length || 0} payment plans for notification dates`)

    for (const profile of profiles || []) {
      try {
        // Filter payment plans for this user
        const userPayments = paymentPlans?.filter((payment) => payment.credits.user_id === profile.id) || []

        for (const payment of userPayments) {
          const dueDate = new Date(payment.due_date)
          const diffTime = dueDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          let shouldSend = false
          let notificationType = ""

          // Bugün vadesi gelenler
          if (diffDays === 0) {
            shouldSend = true
            notificationType = "due_today"
          }
          // Yarın vadesi gelenler
          else if (diffDays === 1) {
            shouldSend = true
            notificationType = "reminder"
          }
          // 3 gün sonra vadesi gelenler
          else if (diffDays === 3) {
            shouldSend = true
            notificationType = "reminder"
          }

          if (shouldSend) {
            // Bugün aynı ödeme için email gönderilmiş mi kontrol et
            const { data: existingNotification } = await supabase
              .from("notifications")
              .select("id")
              .eq("user_id", profile.id)
              .eq("payment_plan_id", payment.id)
              .eq("notification_type", "email")
              .gte("created_at", todayStr)
              .single()

            if (existingNotification) {
              console.log(`⏭️ Email already sent today for payment ${payment.id}`)
              continue
            }

            const bankName = payment.credits.banks.name
            const emailTemplate = await createEmailTemplate(
              profile.first_name || "",
              bankName,
              payment.installment_number,
              payment.total_payment.toLocaleString("tr-TR"),
              dueDate.toLocaleDateString("tr-TR"),
              notificationType === "due_today" ? "overdue" : "reminder",
            )

            const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
            const recipients = [new Recipient(profile.email, profile.first_name || "")]

            const emailParams = new EmailParams()
              .setFrom(sentFrom)
              .setTo(recipients)
              .setSubject(emailTemplate.subject)
              .setHtml(emailTemplate.html)

            const response = await mailerSend.email.send(emailParams)

            if (response.statusCode === 202) {
              // Notification kaydı oluştur
              await supabase.from("notifications").insert({
                user_id: profile.id,
                payment_plan_id: payment.id,
                credit_id: payment.credit_id,
                title: emailTemplate.subject,
                message: `${bankName} bankasından ${payment.installment_number}. taksit ödeme hatırlatması`,
                notification_type: "email",
                email_sent_at: new Date().toISOString(),
                email_delivery_status: "sent",
              })

              totalSent++
              console.log(`✅ Email sent to ${profile.email} for payment ${payment.id}`)
            } else {
              console.error(`❌ Email failed for payment ${payment.id}:`, response)

              // Hata kaydı oluştur
              await supabase.from("notifications").insert({
                user_id: profile.id,
                payment_plan_id: payment.id,
                credit_id: payment.credit_id,
                title: emailTemplate.subject,
                message: `${bankName} bankasından ${payment.installment_number}. taksit ödeme hatırlatması`,
                notification_type: "email",
                email_sent_at: new Date().toISOString(),
                email_delivery_status: "failed",
                email_error_message: `HTTP ${response.statusCode}`,
              })
            }
          }
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${profile.id}:`, userError)
      }
    }

    console.log(`🎉 Email notification workflow completed. Total emails sent: ${totalSent}`)
  } catch (error) {
    console.error("❌ Email notification workflow failed:", error)
    process.exit(1)
  }
}

sendNotifications()
