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
  template: string
  data?: any
}

// Generic email send function
export async function sendEmail({ to, subject, template, data }: EmailData) {
  console.log(`[Email] Would send to ${to}: ${subject}`)
  // For now, just log - actual email sending implementation can be added later
  return { success: true }
}