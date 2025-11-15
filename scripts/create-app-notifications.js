const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend")
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
)

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

/**
 * Kullanıcının bildirim tercihlerini getirir
 */
async function getNotificationPreferences(userId) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error(`Error fetching preferences for user ${userId}:`, error)
    return null
  }

  return data
}

/**
 * Email template oluşturur
 */
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

        .cta-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
          color: #ffffff !important;
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
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="logo">
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
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="footer-logo">

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

/**
 * Bildirim için email gönderir ve email_delivery_status günceller
 */
async function sendEmailForNotification(notificationId, userId, payment, profile) {
  try {
    // Email API key kontrolü
    if (!process.env.MAILERSEND_API_KEY) {
      console.log(`⏭️ Skipping email for notification ${notificationId} - MAILERSEND_API_KEY not configured`)
      return
    }

    // Kullanıcının email tercihlerini kontrol et
    const preferences = await getNotificationPreferences(userId)
    if (!preferences || !preferences.email_enabled) {
      console.log(`⏭️ Skipping email for user ${userId} - Email notifications disabled`)
      return
    }

    // Email gönder
    const bankName = payment.credits.banks.name
    const dueDate = new Date(payment.due_date)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Email type'ı belirle (reminder veya overdue)
    const emailType = diffDays < 0 ? "overdue" : "reminder"

    const emailTemplate = await createEmailTemplate(
      profile.first_name || "",
      bankName,
      payment.installment_number,
      payment.total_payment.toLocaleString("tr-TR"),
      dueDate.toLocaleDateString("tr-TR"),
      emailType,
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
      // Email başarıyla gönderildi - notification'u güncelle
      const messageId = response.headers?.["x-message-id"] || "unknown"

      await supabase
        .from("notifications")
        .update({
          email_sent_at: new Date().toISOString(),
          email_delivery_status: "sent",
          email_provider_id: messageId,
        })
        .eq("id", notificationId)

      console.log(`📧 Email sent successfully for notification ${notificationId} (Message ID: ${messageId})`)
    } else {
      // Email gönderilemedi - error status kaydet
      await supabase
        .from("notifications")
        .update({
          email_delivery_status: "failed",
          email_error_message: `HTTP ${response.statusCode}`,
        })
        .eq("id", notificationId)

      console.error(`❌ Email failed for notification ${notificationId}: HTTP ${response.statusCode}`)
    }
  } catch (error) {
    console.error(`❌ Error sending email for notification ${notificationId}:`, error)

    // Error durumunu kaydet
    await supabase
      .from("notifications")
      .update({
        email_delivery_status: "failed",
        email_error_message: error instanceof Error ? error.message : String(error),
      })
      .eq("id", notificationId)
  }
}

/**
 * Uygulama içi bildirimler oluşturur ve email gönderir
 */
async function createAppNotifications() {
  try {
    console.log("📱 App notification workflow started")

    // Supabase bağlantı kontrolü
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured")
    }

    if (!process.env.SERVICE_ROLE_KEY) {
      throw new Error("SERVICE_ROLE_KEY not configured")
    }

    // TÜM aktif kullanıcıları al
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .not("id", "is", null)

    if (profilesError) {
      throw new Error(`Profiles fetch error: ${profilesError.message}`)
    }

    console.log(`👥 Found ${profiles?.length || 0} users`)

    let totalReminders = 0
    let totalOverdue = 0

    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    for (const profile of profiles || []) {
      try {
        // 1. HATIRLATMA BİLDİRİMLERİ (3 gün içinde vadesi gelenler)

        // Mevcut app_reminder bildirimlerini kontrol et
        const { data: existingReminders } = await supabase
          .from("notifications")
          .select("payment_plan_id")
          .eq("user_id", profile.id)
          .eq("notification_type", "app_reminder")
          .is("deleted_at", null)

        const existingReminderPlanIds = new Set(existingReminders?.map((n) => n.payment_plan_id) || [])

        // 3 gün içinde vadesi gelen ödemeleri getir
        const { data: upcomingPayments } = await supabase
          .from("payment_plans")
          .select(`
            id,
            credit_id,
            installment_number,
            due_date,
            total_payment,
            credits!inner (
              id,
              user_id,
              banks (name)
            )
          `)
          .eq("credits.user_id", profile.id)
          .eq("status", "pending")
          .gte("due_date", todayStr)
          .lte("due_date", threeDaysLater)

        // Henüz bildirimi olmayan ödemeler için bildirim oluştur
        const paymentsToNotify = (upcomingPayments || []).filter((payment) => !existingReminderPlanIds.has(payment.id))

        const reminderNotifications = paymentsToNotify.map((payment) => {
            const dueDate = new Date(payment.due_date)
            const diffTime = dueDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            let title = "Kredi Taksit Hatırlatması"
            let type = "info"

            if (diffDays <= 0) {
              title = "Kredi Taksit Hatırlatması - Bugün"
              type = "error"
            } else if (diffDays === 1) {
              title = "Kredi Taksit Hatırlatması - Yarın"
              type = "warning"
            } else if (diffDays <= 3) {
              title = `Kredi Taksit Hatırlatması - ${diffDays} Gün Sonra`
              type = "warning"
            }

            return {
              user_id: profile.id,
              credit_id: payment.credit_id,
              payment_plan_id: payment.id,
              notification_type: "app_reminder",
              title,
              message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi ${dueDate.toLocaleDateString("tr-TR")} tarihinde doluyor. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺`,
              type,
              is_read: false,
            }
          })

        if (reminderNotifications.length > 0) {
          const { data: createdReminders, error: reminderError } = await supabase
            .from("notifications")
            .insert(reminderNotifications)
            .select()

          if (reminderError && reminderError.code !== "23505") {
            console.error(`❌ Error creating reminders for user ${profile.id}:`, reminderError)
          } else if (createdReminders) {
            totalReminders += createdReminders.length
            console.log(`✅ Created ${createdReminders.length} reminder(s) for ${profile.email}`)

            // Email gönder (her bildirim için)
            for (let i = 0; i < createdReminders.length; i++) {
              const notification = createdReminders[i]
              const payment = paymentsToNotify[i]
              await sendEmailForNotification(notification.id, profile.id, payment, profile)
            }
          }
        }

        // 2. GECİKMİŞ ÖDEME BİLDİRİMLERİ (vadesi geçmiş olanlar)

        // Mevcut app_overdue bildirimlerini kontrol et
        const { data: existingOverdue } = await supabase
          .from("notifications")
          .select("payment_plan_id")
          .eq("user_id", profile.id)
          .eq("notification_type", "app_overdue")
          .is("deleted_at", null)

        const existingOverduePlanIds = new Set(existingOverdue?.map((n) => n.payment_plan_id) || [])

        // Vadesi geçmiş ödemeleri getir
        const { data: overduePayments } = await supabase
          .from("payment_plans")
          .select(`
            id,
            credit_id,
            installment_number,
            due_date,
            total_payment,
            credits!inner (
              id,
              user_id,
              banks (name)
            )
          `)
          .eq("credits.user_id", profile.id)
          .eq("status", "pending")
          .lt("due_date", todayStr)

        // Henüz bildirimi olmayan gecikmiş ödemeler için bildirim oluştur
        const overduePaymentsToNotify = (overduePayments || []).filter((payment) => !existingOverduePlanIds.has(payment.id))

        const overdueNotifications = overduePaymentsToNotify.map((payment) => {
            const dueDate = new Date(payment.due_date)
            const diffTime = today.getTime() - dueDate.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            let title = "⚠️ Geciken Ödeme Bildirimi"

            if (diffDays === 1) {
              title = "⚠️ Geciken Ödeme Bildirimi - 1 Gün"
            } else if (diffDays > 1) {
              title = `⚠️ Geciken Ödeme Bildirimi - ${diffDays} Gün`
            }

            return {
              user_id: profile.id,
              credit_id: payment.credit_id,
              payment_plan_id: payment.id,
              notification_type: "app_overdue",
              title,
              message: `${payment.credits.banks.name} bankasından ${payment.installment_number}. taksit ödemenizin vadesi ${dueDate.toLocaleDateString("tr-TR")} tarihinde doldu ve ${diffDays} gündür gecikmiş durumda. Tutar: ${payment.total_payment.toLocaleString("tr-TR")} ₺. Lütfen en kısa sürede ödeme yapınız.`,
              type: "error",
              is_read: false,
            }
          })

        if (overdueNotifications.length > 0) {
          const { data: createdOverdue, error: overdueError } = await supabase
            .from("notifications")
            .insert(overdueNotifications)
            .select()

          if (overdueError && overdueError.code !== "23505") {
            console.error(`❌ Error creating overdue notifications for user ${profile.id}:`, overdueError)
          } else if (createdOverdue) {
            totalOverdue += createdOverdue.length
            console.log(`✅ Created ${createdOverdue.length} overdue notification(s) for ${profile.email}`)

            // Email gönder (her bildirim için)
            for (let i = 0; i < createdOverdue.length; i++) {
              const notification = createdOverdue[i]
              const payment = overduePaymentsToNotify[i]
              await sendEmailForNotification(notification.id, profile.id, payment, profile)
            }
          }
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${profile.id}:`, userError)
      }
    }

    console.log(`🎉 App notification workflow completed`)
    console.log(`📊 Total reminders created: ${totalReminders}`)
    console.log(`📊 Total overdue notifications created: ${totalOverdue}`)
  } catch (error) {
    console.error("❌ App notification workflow failed:", error)
    process.exit(1)
  }
}

createAppNotifications()
