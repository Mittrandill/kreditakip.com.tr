// Email utilities - export all email functions
export {
  sendNewSubscriptionNotification,
  sendSubscriptionWelcomeNotification,
  sendRenewalSuccessNotification,
  sendRenewalFailedNotification,
  sendUpcomingRenewalNotification,
  sendGracePeriodStartNotification,
} from './subscription-notification'

export interface EmailData {
  to: string
  subject: string
  template?: string
  data?: any
  html?: string
  text?: string
}

// Generic email send function using MailerSend
export async function sendEmail({ to, subject, template, data, html, text }: EmailData) {
  try {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      return { success: false, error: 'Cannot send email from browser' }
    }

    // Lazy load MailerSend to avoid browser issues
    const { MailerSend, EmailParams, Sender, Recipient } = await import('mailersend')

    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || '',
    })

    if (!process.env.MAILERSEND_API_KEY) {
      throw new Error('MAILERSEND_API_KEY not configured')
    }

    const sentFrom = new Sender('bildirim@kreditakip.com.tr', 'Kredi Takip')
    const recipients = [new Recipient(to, '')]

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html || '')

    if (text) {
      emailParams.setText(text)
    }

    const response = await mailerSend.email.send(emailParams)

    if (response.statusCode === 202) {
      return { success: true }
    } else {
      console.error('MailerSend error:', response)
      return { success: false, error: `HTTP ${response.statusCode}` }
    }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}