/**
 * PayTR Subscription Renewal Reminders
 *
 * Sends email reminders to users before their PayTR subscription expires
 * Reminders sent at 7, 3, and 1 days before expiry
 */

const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend")
const { createClient } = require("@supabase/supabase-js")

// Initialize MailerSend
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
)

// App URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.kreditakip.com.tr"

async function sendSubscriptionReminders() {
  console.log("🔔 Starting PayTR subscription reminder job...")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Get PayTR subscriptions expiring in the next 7 days
    const { data: expiringSubscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans(name, price, billing_period),
        profiles!inner(email, first_name, last_name)
      `)
      .eq("payment_provider", "paytr")
      .eq("status", "active")
      .gte("expires_at", today.toISOString())
      .lte("expires_at", new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null)

    if (error) {
      console.error("❌ Error fetching subscriptions:", error)
      return
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      console.log("✅ No expiring subscriptions found")
      return
    }

    console.log(`📧 Found ${expiringSubscriptions.length} expiring subscriptions`)

    let remindersSent = 0

    for (const subscription of expiringSubscriptions) {
      const expiryDate = new Date(subscription.expires_at)
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))

      // Determine if we should send a reminder
      let shouldSend = false
      let emailType = ""

      if (daysUntilExpiry === 7) {
        shouldSend = true
        emailType = "7_days"
      } else if (daysUntilExpiry === 3) {
        shouldSend = true
        emailType = "3_days"
      } else if (daysUntilExpiry === 1) {
        shouldSend = true
        emailType = "1_day"
      }

      if (!shouldSend) continue

      // Check if we already sent this reminder today
      const { data: alreadySent } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", subscription.user_id)
        .eq("notification_type", "email")
        .like("title", `%${daysUntilExpiry} Gün%`)
        .gte("created_at", today.toISOString())
        .maybeSingle()

      if (alreadySent) {
        console.log(`⏭️  Skipping - already sent to ${subscription.profiles.email}`)
        continue
      }

      // Create email HTML
      const emailHtml = createRenewalReminderEmail({
        firstName: subscription.profiles.first_name || "Değerli Kullanıcı",
        planName: subscription.subscription_plans.name,
        expiryDate: expiryDate.toLocaleDateString("tr-TR"),
        daysRemaining: daysUntilExpiry,
        renewalUrl: `${APP_URL}/uygulama/abonelik`,
        planPrice: subscription.subscription_plans.price,
      })

      // Send email
      const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
      const recipients = [
        new Recipient(
          subscription.profiles.email,
          subscription.profiles.first_name || "Kullanıcı"
        ),
      ]

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(`⏰ Aboneliğiniz ${daysUntilExpiry} Gün İçinde Sona Eriyor`)
        .setHtml(emailHtml)

      try {
        const response = await mailerSend.email.send(emailParams)

        if (response.statusCode === 202) {
          // Log notification
          await supabase.from("notifications").insert({
            user_id: subscription.user_id,
            title: `Abonelik Hatırlatması - ${daysUntilExpiry} Gün`,
            message: `${subscription.subscription_plans.name} aboneliğiniz ${daysUntilExpiry} gün içinde sona erecek.`,
            notification_type: "email",
            email_sent_at: new Date().toISOString(),
            email_delivery_status: "sent",
          })

          // Update next_renewal_reminder_date
          let nextReminderDate = null
          if (daysUntilExpiry === 7) {
            // Next reminder: 3 days before
            nextReminderDate = new Date(expiryDate)
            nextReminderDate.setDate(nextReminderDate.getDate() - 3)
          } else if (daysUntilExpiry === 3) {
            // Next reminder: 1 day before
            nextReminderDate = new Date(expiryDate)
            nextReminderDate.setDate(nextReminderDate.getDate() - 1)
          }

          if (nextReminderDate) {
            await supabase
              .from("subscriptions")
              .update({ next_renewal_reminder_date: nextReminderDate.toISOString() })
              .eq("id", subscription.id)
          }

          console.log(
            `✅ Reminder sent to ${subscription.profiles.email} (${daysUntilExpiry} days)`
          )
          remindersSent++
        }
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${subscription.profiles.email}:`, emailError)
      }
    }

    console.log(`\n✨ Job completed: ${remindersSent} reminder(s) sent`)
  } catch (error) {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  }
}

/**
 * Create renewal reminder email HTML
 */
function createRenewalReminderEmail({
  firstName,
  planName,
  expiryDate,
  daysRemaining,
  renewalUrl,
  planPrice,
}) {
  const urgencyColor = daysRemaining === 1 ? "#ef4444" : daysRemaining === 3 ? "#f97316" : "#10b981"

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Hatırlatması</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0f172a;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 40px 20px;
    }
    .main {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
      color: white;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 24px;
      color: #f1f5f9;
    }
    .alert-card {
      background: rgba(239, 68, 68, 0.1);
      border: 2px solid ${urgencyColor};
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .days-remaining {
      font-size: 48px;
      font-weight: bold;
      color: ${urgencyColor};
      margin: 12px 0;
    }
    .info-grid {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #94a3b8;
      font-size: 14px;
    }
    .info-value {
      color: #f1f5f9;
      font-weight: 600;
    }
    .cta-button {
      display: inline-block;
      background: ${urgencyColor};
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .footer {
      background: rgba(15, 23, 42, 0.5);
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>⏰ Abonelik Hatırlatması</h1>
      </div>

      <div class="content">
        <p class="greeting">Merhaba <strong>${firstName}</strong>,</p>

        <div class="alert-card">
          <div class="info-label">${planName} aboneliğiniz</div>
          <div class="days-remaining">${daysRemaining} Gün</div>
          <div class="info-label">içinde sona erecek</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Plan</span>
            <span class="info-value">${planName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Son Kullanım Tarihi</span>
            <span class="info-value">${expiryDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Yenileme Ücreti</span>
            <span class="info-value">${planPrice} TL</span>
          </div>
        </div>

        <p style="color: #cbd5e1; margin: 24px 0;">
          Aboneliğinizi yenilemezseniz, <strong>${expiryDate}</strong> tarihinde
          otomatik olarak ücretsiz plana geçiş yapılacaktır ve premium özelliklerinize
          erişiminiz sona erecektir.
        </p>

        <div style="text-align: center;">
          <a href="${renewalUrl}" class="cta-button">
            Aboneliği Şimdi Yenile →
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 32px;">
          Sorunuz mu var? info@kreditakip.com.tr adresinden bize ulaşabilirsiniz.
        </p>
      </div>

      <div class="footer">
        <p>© 2025 Kredi Takip - Tüm hakları saklıdır.</p>
        <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

// Run the job
sendSubscriptionReminders()
