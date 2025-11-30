// Email utilities - export all email functions
export {
  sendNewSubscriptionNotification,
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

// Generic email send function
export async function sendEmail({ to, subject, template, data, html, text }: EmailData) {
  // Email would be sent here in production
  // For now, just return success - actual email sending implementation can be added later
  return { success: true }
}