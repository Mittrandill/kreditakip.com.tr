/**
 * Downgrade Expired PayTR Subscriptions
 *
 * Automatically downgrades expired PayTR subscriptions to free plan
 * Runs daily to check for subscriptions that have expired
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

async function downgradeExpiredSubscriptions() {
  console.log("🔄 Starting expired subscription downgrade job...")

  const now = new Date()

  try {
    // Get expired PayTR subscriptions
    const { data: expiredSubscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans(name, price),
        profiles!inner(email, first_name, last_name)
      `)
      .eq("payment_provider", "paytr")
      .eq("status", "active")
      .lt("expires_at", now.toISOString())
      .is("deleted_at", null)

    if (error) {
      console.error("❌ Error fetching expired subscriptions:", error)
      return
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log("✅ No expired subscriptions found")
      return
    }

    console.log(`📉 Found ${expiredSubscriptions.length} expired subscription(s)`)

    let downgraded = 0

    for (const subscription of expiredSubscriptions) {
      try {
        // Mark current subscription as expired
        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)

        // Create new free subscription
        const { data: freeSub, error: freeSubError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: subscription.user_id,
            plan_id: "free",
            plan_type: "free",
            status: "active",
            start_date: new Date().toISOString(),
            expires_at: "2099-12-31T23:59:59Z",
            payment_provider: "free",
          })
          .select()
          .single()

        if (freeSubError) {
          console.error(`❌ Failed to create free subscription for user ${subscription.user_id}:`, freeSubError)
          continue
        }

        // Reset usage limits to free tier
        await resetUsageToFreeTier(subscription.user_id, freeSub.id)

        // Send downgrade notification email
        await sendDowngradeEmail({
          email: subscription.profiles.email,
          firstName: subscription.profiles.first_name || "Değerli Kullanıcı",
          planName: subscription.subscription_plans.name,
          expiryDate: new Date(subscription.expires_at).toLocaleDateString("tr-TR"),
        })

        console.log(`✅ Downgraded subscription ${subscription.id} (User: ${subscription.profiles.email})`)
        downgraded++
      } catch (subError) {
        console.error(`❌ Error processing subscription ${subscription.id}:`, subError)
      }
    }

    console.log(`\n✨ Job completed: ${downgraded} subscription(s) downgraded to free`)
  } catch (error) {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  }
}

/**
 * Reset usage tracking to free tier limits
 */
async function resetUsageToFreeTier(userId, subscriptionId) {
  const resetAt = new Date()
  resetAt.setDate(resetAt.getDate() + 30)

  await supabase.from("subscription_usage").upsert([
    {
      user_id: userId,
      subscription_id: subscriptionId,
      feature_type: "ocr_analysis",
      usage_count: 0,
      limit_count: 1, // Free tier limit
      saved_credits_count: 0,
      saved_credits_limit: 1,
      reset_at: resetAt.toISOString(),
    },
    {
      user_id: userId,
      subscription_id: subscriptionId,
      feature_type: "risk_analysis",
      usage_count: 0,
      limit_count: 0, // Free tier has no risk analysis
      saved_credits_count: 0,
      saved_credits_limit: 0,
      reset_at: resetAt.toISOString(),
    },
  ])

  console.log(`  ↳ Usage limits reset to free tier for user ${userId}`)
}

/**
 * Send downgrade notification email
 */
async function sendDowngradeEmail({ email, firstName, planName, expiryDate }) {
  const emailHtml = createDowngradeEmailHTML({ firstName, planName, expiryDate })

  const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
  const recipients = [new Recipient(email, firstName)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Aboneliğiniz Sona Erdi - Ücretsiz Plana Geçiş Yapıldı")
    .setHtml(emailHtml)

  try {
    const response = await mailerSend.email.send(emailParams)

    if (response.statusCode === 202) {
      console.log(`  ↳ Downgrade email sent to ${email}`)
    }
  } catch (emailError) {
    console.error(`  ↳ Failed to send downgrade email to ${email}:`, emailError)
  }
}

/**
 * Create downgrade email HTML
 */
function createDowngradeEmailHTML({ firstName, planName, expiryDate }) {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abonelik Sona Erdi</title>
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
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
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
    .alert-box {
      background: rgba(100, 116, 139, 0.1);
      border: 2px solid #64748b;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background: #10b981;
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .features-list {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .feature-item {
      padding: 10px 0;
      color: #cbd5e1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .feature-item:last-child {
      border-bottom: none;
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
        <h1>Aboneliğiniz Sona Erdi</h1>
      </div>

      <div class="content">
        <p style="font-size: 18px; color: #f1f5f9; margin-bottom: 24px;">
          Merhaba <strong>${firstName}</strong>,
        </p>

        <div class="alert-box">
          <p style="font-size: 16px; margin: 0;">
            <strong>${planName}</strong> aboneliğiniz <strong>${expiryDate}</strong> tarihinde sona erdi.
          </p>
          <p style="margin-top: 16px; color: #94a3b8;">
            Hesabınız ücretsiz plana geçirildi.
          </p>
        </div>

        <h3 style="color: #f1f5f9; margin-top: 32px;">Ücretsiz Plan Özellikleri:</h3>

        <div class="features-list">
          <div class="feature-item">✓ Temel OCR özellikleri (1 adet)</div>
          <div class="feature-item">✓ Manuel kredi takibi</div>
          <div class="feature-item">✓ Basit raporlar</div>
          <div class="feature-item">✗ AI Finansal Sağlık Analizi</div>
          <div class="feature-item">✗ Gelişmiş raporlar</div>
          <div class="feature-item">✗ Öncelikli destek</div>
        </div>

        <p style="color: #cbd5e1; margin: 24px 0;">
          Premium özelliklerine tekrar erişmek için aboneliğinizi yenileyebilirsiniz.
        </p>

        <div style="text-align: center;">
          <a href="${APP_URL}/uygulama/premium" class="cta-button">
            Premium'a Yükselt →
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 32px;">
          Sorularınız için: info@kreditakip.com.tr
        </p>
      </div>

      <div class="footer">
        <p>© 2025 Kredi Takip - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

// Run the job
downgradeExpiredSubscriptions()
