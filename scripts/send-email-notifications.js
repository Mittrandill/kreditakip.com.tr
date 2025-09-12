const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend")
const { createClient } = require("@supabase/supabase-js")

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY)

async function createEmailTemplate(firstName, bankName, installmentNumber, amount, dueDate, type) {
  const isReminder = type === "reminder"
  const subject = isReminder ? `💳 Kredi Taksit Hatırlatması - ${bankName}` : `⚠️ Geciken Ödeme Bildirimi - ${bankName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Kredi Takip</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Ödeme Bildirimi</p>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Merhaba ${firstName},</h2>
          
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
            ${
              isReminder
                ? `${bankName} bankanızdan ${installmentNumber}. taksit ödemenizin vadesi yaklaşıyor.`
                : `${bankName} bankanızdan ${installmentNumber}. taksit ödemenizin vadesi geçmiş.`
            }
          </p>
          
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-weight: 500;">Banka:</span>
              <span style="color: #1e293b; font-weight: 600;">${bankName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-weight: 500;">Taksit No:</span>
              <span style="color: #1e293b; font-weight: 600;">${installmentNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-weight: 500;">Tutar:</span>
              <span style="color: #1e293b; font-weight: 600;">${amount} ₺</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Vade Tarihi:</span>
              <span style="color: ${isReminder ? "#059669" : "#dc2626"}; font-weight: 600;">${dueDate}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://kreditakip.com.tr/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
              Detayları Görüntüle
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0; font-size: 14px;">
            Bu e-posta Kredi Takip sistemi tarafından otomatik olarak gönderilmiştir.
          </p>
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
    const { data: users, error: usersError } = await supabase
      .from("notification_preferences")
      .select(`
        user_id,
        profiles!inner(email, first_name, last_name)
      `)
      .eq("email_enabled", true)

    if (usersError) {
      throw new Error(`Users fetch error: ${usersError.message}`)
    }

    console.log(`📋 Found ${users?.length || 0} users with email notifications enabled`)

    let totalSent = 0

    for (const user of users || []) {
      try {
        // Kullanıcının ödemelerini al
        const { data: payments, error: paymentsError } = await supabase
          .from("payment_plans")
          .select(`
            *,
            credits!inner(
              bank_name,
              credit_amount
            )
          `)
          .eq("user_id", user.user_id)
          .gte("due_date", new Date().toISOString().split("T")[0])

        if (paymentsError) {
          console.error(`❌ Payments fetch error for user ${user.user_id}:`, paymentsError)
          continue
        }

        const today = new Date()

        for (const payment of payments || []) {
          const dueDate = new Date(payment.due_date)
          const diffTime = dueDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          let shouldSend = false
          let notificationType = ""

          // Yarın vadesi gelenler
          if (diffDays === 1) {
            shouldSend = true
            notificationType = "reminder"
          }
          // 3 gün sonra vadesi gelenler
          else if (diffDays === 3) {
            shouldSend = true
            notificationType = "reminder"
          }
          // Vadesi geçenler
          else if (diffDays < 0) {
            shouldSend = true
            notificationType = "overdue"
          }

          if (shouldSend) {
            // Bugün aynı ödeme için email gönderilmiş mi kontrol et
            const { data: existingEmail } = await supabase
              .from("email_notifications")
              .select("id")
              .eq("user_id", user.user_id)
              .eq("payment_plan_id", payment.id)
              .eq("notification_type", notificationType)
              .gte("sent_at", today.toISOString().split("T")[0])
              .single()

            if (existingEmail) {
              console.log(`⏭️ Email already sent today for payment ${payment.id}`)
              continue
            }

            const emailTemplate = await createEmailTemplate(
              user.profiles.first_name || "",
              payment.credits.bank_name,
              payment.installment_number,
              payment.amount.toLocaleString("tr-TR"),
              dueDate.toLocaleDateString("tr-TR"),
              notificationType,
            )

            const sentFrom = new Sender("bildirim@kreditakip.com.tr", "Kredi Takip")
            const recipients = [new Recipient(user.profiles.email, user.profiles.first_name || "")]

            const emailParams = new EmailParams()
              .setFrom(sentFrom)
              .setTo(recipients)
              .setSubject(emailTemplate.subject)
              .setHtml(emailTemplate.html)

            const response = await mailerSend.email.send(emailParams)

            if (response.statusCode === 202) {
              // Email gönderim kaydı oluştur
              await supabase.from("email_notifications").insert({
                user_id: user.user_id,
                payment_plan_id: payment.id,
                credit_id: payment.credit_id,
                subject: emailTemplate.subject,
                content: `${payment.credits.bank_name} bankasından ${payment.installment_number}. taksit ödeme hatırlatması`,
                notification_type: notificationType,
                sent_at: new Date().toISOString(),
                status: "sent",
              })

              totalSent++
              console.log(`✅ Email sent to ${user.profiles.email} for payment ${payment.id}`)
            } else {
              console.error(`❌ Email failed for payment ${payment.id}:`, response)

              // Hata kaydı oluştur
              await supabase.from("email_notifications").insert({
                user_id: user.user_id,
                payment_plan_id: payment.id,
                credit_id: payment.credit_id,
                subject: emailTemplate.subject,
                content: `${payment.credits.bank_name} bankasından ${payment.installment_number}. taksit ödeme hatırlatması`,
                notification_type: notificationType,
                sent_at: new Date().toISOString(),
                status: "failed",
                error_message: `HTTP ${response.statusCode}`,
              })
            }
          }
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${user.user_id}:`, userError)
      }
    }

    console.log(`🎉 Email notification workflow completed. Total emails sent: ${totalSent}`)
  } catch (error) {
    console.error("❌ Email notification workflow failed:", error)
    process.exit(1)
  }
}

sendNotifications()
