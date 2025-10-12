const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend")
const { createClient } = require("@supabase/supabase-js")

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SERVICE_ROLE_KEY)

async function createEmailTemplate(firstName, bankName, installmentNumber, amount, dueDate, type) {
  const isReminder = type === "reminder";
  const subject = isReminder
    ? `💳 Kredi Taksit Hatırlatması - ${bankName}`
    : `⚠️ Geciken Ödeme Bildirimi - ${bankName}`;

  const BRAND_LOGO =
    "https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png";

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
    };
    const file = bankMappings[bankName] || "default-bank.png";
    return `https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/bank-logos/${file}`;
  };

  const accent = isReminder ? "#10b981" : "#dc2626";    // yeşil/kırmızı
  const accentDark = isReminder ? "#0ea271" : "#b91c1c";
  const badgeBg = isReminder ? "#ecfdf5" : "#fef2f2";
  const badgeFg = isReminder ? "#065f46" : "#991b1b";

  const safeFirstName = (firstName || "").trim() || "Kullanıcımız";
  const bankLogo = getBankLogoUrl(bankName);

  const preheader = isReminder
    ? `${bankName} ${installmentNumber}. taksit vadesi ${dueDate}. Detaylar ve ödeme planınız içeride.`
    : `${bankName} ${installmentNumber}. taksit için vade geçti. Planınızı kontrol edin ve aksiyon alın.`;

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${subject}</title>
  <style>
    /* Client resets */
    html, body { margin:0 !important; padding:0 !important; height:100% !important; width:100% !important; }
    * { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt !important; mso-table-rspace:0pt !important; border-collapse:collapse !important; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:0; text-decoration:none; display:block; }
    a { text-decoration:none; }
    /* Mobile */
    @media screen and (max-width: 600px) {
      .container { width:100% !important; }
      .px-40 { padding-left:20px !important; padding-right:20px !important; }
      .py-32 { padding-top:24px !important; padding-bottom:24px !important; }
      .h1 { font-size:22px !important; line-height:1.3 !important; }
      .amount { font-size:28px !important; }
      .grid { display:block !important; }
      .cell { width:100% !important; display:block !important; margin-bottom:12px !important; }
      .brandbar { height:8px !important; }
    }
    /* Dark-ish neutral background to match brand */
    body { background:#0f172a; }
  </style>
  <!--[if mso]>
    <style type="text/css">
      .fallback-font { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
  <![endif]-->
</head>
<body class="fallback-font" style="background:#0f172a;">
  <!-- Preheader (gizli) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${preheader}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0f172a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" class="container" style="width:640px; max-width:100%;">
          <!-- Brand header -->
          <tr>
            <td style="background:#1e293b; border:1px solid #334155; border-bottom:0; border-radius:16px 16px 0 0; padding:28px;" align="center">
              <img src="${BRAND_LOGO}" width="140" height="auto" alt="Kredi Takip" style="height:auto;">
              <div style="height:16px;"></div>
              <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:${badgeBg}; color:${badgeFg}; font-size:12px; font-weight:700;">
                ${isReminder ? "ÖDEME HATIRLATMASI" : "GECİKEN ÖDEME"}
              </div>
              <div style="height:12px;"></div>
              <h1 class="h1" style="margin:0; color:#ffffff; font-size:24px; line-height:1.4; font-weight:800;">
                ${bankName} • ${installmentNumber}. Taksit
              </h1>
              <div style="height:6px;"></div>
              <p style="margin:0; color:#b6c2d9; font-size:14px;">
                Finansal takibiniz bizimle güvende
              </p>
            </td>
          </tr>

          <!-- Brand gradient bar -->
          <tr>
            <td class="brandbar" style="height:10px; background:linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0d9488 100%); border-left:1px solid #334155; border-right:1px solid #334155;"></td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1e293b; border:1px solid #334155; border-top:0; border-bottom:0; padding:32px;" class="px-40 py-32">
              <p style="margin:0 0 16px 0; color:#e5e7eb; font-size:16px;">
                Merhaba <strong style="color:#fff;">${safeFirstName}</strong>,
              </p>
              <p style="margin:0; color:#b6c2d9; font-size:14px;">
                ${isReminder
                  ? "Aşağıdaki taksitinizin vade tarihi yaklaşıyor. Detayları kontrol ederek zamanında ödeme yapmanızı öneririz."
                  : "Aşağıdaki taksidiniz için vade tarihi geçti. Lütfen planınızı kontrol ederek en kısa sürede işlem yapınız."}
              </p>

              <div style="height:24px;"></div>

              <!-- Payment summary box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b1220; border:1px solid #2a3a55; border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td valign="middle" style="width:56px;">
                          <!-- Bank logo box -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:56px; height:56px; background:#ffffff; border-radius:12px;">
                            <tr>
                              <td align="center" valign="middle" style="padding:6px;">
                                <img src="${bankLogo}" width="44" height="44" style="width:44px; height:44px;" alt="${bankName}">
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="width:16px;"></td>
                        <td valign="middle">
                          <div style="color:#ffffff; font-weight:700; font-size:16px;">${bankName}</div>
                          <div style="color:#93a4bd; font-size:13px;">${installmentNumber}. Taksit</div>
                        </td>
                        <td align="right" valign="middle">
                          <div class="amount" style="color:#ffffff; font-weight:800; font-size:34px; line-height:1;">${amount} ₺</div>
                        </td>
                      </tr>
                    </table>

                    <div style="height:16px;"></div>

                    <!-- two column grid -->
                    <table role="presentation" width="100%" class="grid">
                      <tr>
                        <td class="cell" style="width:50%; padding:12px; background:#122034; border-radius:8px;">
                          <div style="color:#93a4bd; font-size:12px; text-transform:uppercase; letter-spacing:0.4px;">Vade Tarihi</div>
                          <div style="color:#fff; font-size:16px; font-weight:700; margin-top:6px;">${dueDate}</div>
                        </td>
                        <td style="width:16px;"></td>
                        <td class="cell" style="width:50%; padding:12px; background:#122034; border-radius:8px;">
                          <div style="color:#93a4bd; font-size:12px; text-transform:uppercase; letter-spacing:0.4px;">Durum</div>
                          <div style="color:${accent}; font-size:16px; font-weight:700; margin-top:6px;">
                            ${isReminder ? "Yaklaşan Vade" : "Geciken Ödeme"}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Accent bar -->
                <tr>
                  <td style="height:4px; background:${accent}; border-radius:0 0 12px 12px;"></td>
                </tr>
              </table>

              <div style="height:28px;"></div>

              <!-- CTA (Outlook bulletproof) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="${accent}" style="border-radius:12px;">
                    <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                        href="https://kreditakip.com.tr/uygulama/odeme-plani?utm_source=email&utm_medium=${isReminder?'reminder':'overdue'}"
                        style="height:48px;v-text-anchor:middle;width:280px;" arcsize="20%" stroke="f" fillcolor="${accent}">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:700;">
                          Ödeme Planını Görüntüle
                        </center>
                      </v:roundrect>
                    <![endif]-->
                    <a href="https://kreditakip.com.tr/uygulama/odeme-plani?utm_source=email&utm_medium=${isReminder?'reminder':'overdue'}"
                       style="background:${accent}; border:1px solid ${accentDark}; display:inline-block; padding:14px 28px; border-radius:12px; color:#ffffff; font-weight:700; font-size:16px; line-height:1;"
                       target="_blank">
                      Ödeme Planını Görüntüle
                    </a>
                  </td>
                </tr>
              </table>

              <div style="height:16px;"></div>
              <p style="margin:0; color:#93a4bd; font-size:12px;">
                Bu hatırlatma, bildirim tercihleriniz açıksa gönderilir. Bildirim ayarlarınızı dilediğiniz zaman güncelleyebilirsiniz.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a; border:1px solid #334155; border-top:0; border-radius:0 0 16px 16px; padding:24px;" align="center">
              <img src="${BRAND_LOGO}" width="84" alt="Kredi Takip" style="opacity:0.9;">
              <div style="height:10px;"></div>
              <p style="margin:0; color:#7887a4; font-size:12px; line-height:1.6;">
                Bu e-posta otomatik olarak gönderilmiştir.<br>
                E-posta bildirimlerini almak istemiyorsanız <a href="https://kreditakip.com.tr/uygulama/ayarlar/bildirimler" style="color:${accent}; font-weight:600;">ayarlar</a> bölümünden kapatabilirsiniz.
              </p>
              <div style="height:12px;"></div>
              <p style="margin:0; color:#5a6786; font-size:11px;">© 2025 kreditakip.com.tr • Tüm hakları saklıdır</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${subject}

Merhaba ${safeFirstName},

${bankName} (${installmentNumber}. taksit) için ${isReminder ? "vade yaklaşıyor" : "vade geçti"}.
Tutar: ${amount} ₺
Vade Tarihi: ${dueDate}

Ödeme planınızı görüntüleyin:
https://kreditakip.com.tr/uygulama/odeme-plani

Bu e-posta otomatik olarak gönderilmiştir. Bildirim tercihlerinizi ayarlardan güncelleyebilirsiniz.
© 2025 kreditakip.com.tr`;

  return { subject, html, text };
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
