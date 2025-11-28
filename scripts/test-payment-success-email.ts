/**
 * Test script for payment success email
 */

import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Import email function
import { sendRenewalSuccessNotification } from '../lib/email/subscription-notification.js'

const TEST_EMAIL = process.env.TEST_EMAIL || 'akintkaya@gmail.com'

async function testPaymentSuccessEmail() {
  console.log('🚀 Testing Payment Success Email...')
  console.log(`📧 Test email will be sent to: ${TEST_EMAIL}\n`)

  const testData = {
    userName: 'Akın Kaya',
    userEmail: TEST_EMAIL,
    planName: 'Premium Aylık',
    amount: 99.00,
    currency: 'TL',
    newExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  console.log('📨 Sending payment success email...')

  try {
    const result = await sendRenewalSuccessNotification(testData)

    if (result.success) {
      console.log('✅ Payment success email sent successfully!')
      console.log(`📬 Check your inbox at ${TEST_EMAIL}`)
    } else {
      console.log('❌ Failed to send email:', result.error)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

// Run test
testPaymentSuccessEmail().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
