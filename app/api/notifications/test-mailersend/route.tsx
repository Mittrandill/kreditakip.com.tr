import { type NextRequest, NextResponse } from "next/server"
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const sentFrom = new Sender("noreply@kreditakip.com.tr", "KrediTakip")
    const recipients = [new Recipient(to, "Test User")]

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">KrediTakip</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0;">Test E-postası</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
            <h2 style="color: #1e293b; margin-top: 0;">Test Mesajı</h2>
            <p style="font-size: 16px; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Bu e-posta MailerSend entegrasyonu test edilmek için gönderilmiştir.
            </p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">
              © 2024 kreditakip.com.tr - Tüm hakları saklıdır.
            </p>
          </div>
        </body>
        </html>
      `)
      .setText(message)

    await mailerSend.email.send(emailParams)

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
    })
  } catch (error) {
    console.error("MailerSend test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
