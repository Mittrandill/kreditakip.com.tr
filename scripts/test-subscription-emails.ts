/**
 * Test script for subscription email notifications
 * Sends all types of subscription emails to a test email address
 */

import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Import all email functions
import {
  sendNewSubscriptionNotification,
  sendRenewalSuccessNotification,
  sendRenewalFailedNotification,
  sendUpcomingRenewalNotification,
  sendRenewalRequestNotification,
  sendGracePeriodStartNotification,
  sendGracePeriodEndingNotification,
  sendManualPaymentReminder
} from '../lib/email/subscription-notification.js'

const TEST_EMAIL = process.env.TEST_EMAIL || 'akintkaya@gmail.com'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testAllSubscriptionEmails() {
  console.log('🚀 Starting subscription email tests...')
  console.log(`📧 Test emails will be sent to: ${TEST_EMAIL}\n`)

  const baseData = {
    userName: 'Akın Kaya',
    userEmail: TEST_EMAIL,
    planName: 'Premium Aylık',
    amount: 99.00,
    currency: 'TL',
  }

  // Test 1: Yeni Abonelik Bildirimi (Admin'e)
  console.log('📨 Test 1: Yeni Abonelik Bildirimi')
  try {
    const result1 = await sendNewSubscriptionNotification({
      ...baseData,
      startDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    console.log(result1.success ? '✅ Başarılı' : '❌ Hata:', result1.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 2: Abonelik Yenileme Başarılı
  console.log('\n📨 Test 2: Abonelik Yenileme Başarılı')
  try {
    const result2 = await sendRenewalSuccessNotification({
      ...baseData,
      newExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    console.log(result2.success ? '✅ Başarılı' : '❌ Hata:', result2.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 3: Abonelik Yenileme Başarısız
  console.log('\n📨 Test 3: Abonelik Yenileme Başarısız')
  try {
    const result3 = await sendRenewalFailedNotification({
      ...baseData,
      failureReason: 'Kartınızın son kullanma tarihi geçmiş',
      retryUrl: 'https://kreditakip.com.tr/uygulama/ayarlar'
    })
    console.log(result3.success ? '✅ Başarılı' : '❌ Hata:', result3.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 4: Yenileme Öncesi Bildirim (3 Gün Önce)
  console.log('\n📨 Test 4: Yenileme Öncesi Bildirim (3 Gün Önce)')
  try {
    const result4 = await sendUpcomingRenewalNotification({
      ...baseData,
      renewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      last4: '1234',
      cancelUrl: 'https://kreditakip.com.tr/uygulama/ayarlar'
    })
    console.log(result4.success ? '✅ Başarılı' : '❌ Hata:', result4.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 5: 3D Secure Ödeme İsteği
  console.log('\n📨 Test 5: 3D Secure Ödeme İsteği')
  try {
    const result5 = await sendRenewalRequestNotification({
      ...baseData,
      renewalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      paymentUrl: 'https://kreditakip.com.tr/payment/test123',
      linkExpiresIn: '48 saat'
    })
    console.log(result5.success ? '✅ Başarılı' : '❌ Hata:', result5.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 6: Grace Period Başlangıç
  console.log('\n📨 Test 6: Grace Period Başlangıç (3 Gün Ek Süre)')
  try {
    const result6 = await sendGracePeriodStartNotification({
      ...baseData,
      expiresAt: new Date().toISOString(),
      gracePeriodEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 3
    })
    console.log(result6.success ? '✅ Başarılı' : '❌ Hata:', result6.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 7: Grace Period Bitiş Uyarısı (24 Saat Kaldı)
  console.log('\n📨 Test 7: Grace Period Bitiş Uyarısı (24 Saat Kaldı)')
  try {
    const result7 = await sendGracePeriodEndingNotification({
      ...baseData,
      gracePeriodEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      hoursRemaining: 24,
      paymentUrl: 'https://kreditakip.com.tr/uygulama/ayarlar'
    })
    console.log(result7.success ? '✅ Başarılı' : '❌ Hata:', result7.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 8: Manuel Ödeme Hatırlatması - 7 Gün Önce
  console.log('\n📨 Test 8: Manuel Ödeme Hatırlatması (7 Gün Önce)')
  try {
    const result8 = await sendManualPaymentReminder({
      ...baseData,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilExpiry: 7,
      paymentUrl: 'https://kreditakip.com.tr/uygulama/ayarlar'
    })
    console.log(result8.success ? '✅ Başarılı' : '❌ Hata:', result8.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 9: Manuel Ödeme Hatırlatması - 3 Gün Önce
  console.log('\n📨 Test 9: Manuel Ödeme Hatırlatması (3 Gün Önce)')
  try {
    const result9 = await sendManualPaymentReminder({
      ...baseData,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilExpiry: 3,
      paymentUrl: 'https://kreditakip.com.tr/uygulama/ayarlar'
    })
    console.log(result9.success ? '✅ Başarılı' : '❌ Hata:', result9.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 10: Manuel Ödeme Hatırlatması - 1 Gün Önce
  console.log('\n📨 Test 10: Manuel Ödeme Hatırlatması (1 Gün Önce - YARIN)')
  try {
    const result10 = await sendManualPaymentReminder({
      ...baseData,
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilExpiry: 1,
      paymentUrl: 'https://kreditakip.com.tr/uygulama/ayarlar'
    })
    console.log(result10.success ? '✅ Başarılı' : '❌ Hata:', result10.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  await sleep(2000)

  // Test 11: Manuel Ödeme Hatırlatması - BUGÜN (Day 0)
  console.log('\n📨 Test 11: Manuel Ödeme Hatırlatması (BUGÜN - ACİL)')
  try {
    const result11 = await sendManualPaymentReminder({
      ...baseData,
      expiresAt: new Date().toISOString(),
      daysUntilExpiry: 0,
      paymentUrl: 'https://kreditakip.com.tr/uygulama/ayarlar'
    })
    console.log(result11.success ? '✅ Başarılı' : '❌ Hata:', result11.error || '')
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }

  console.log('\n🎉 Tüm testler tamamlandı!')
  console.log(`📬 ${TEST_EMAIL} adresini kontrol edebilirsiniz.`)
}

// Run tests
testAllSubscriptionEmails().catch(error => {
  console.error('❌ Test sırasında kritik hata:', error)
  process.exit(1)
})
