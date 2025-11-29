const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oymjjceuiotxfbpwsdym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bWpqY2V1aW90eGZicHdzZHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY2OTAwOSwiZXhwIjoyMDc5MDI5MDA5fQ.OJmm3qWC75PMHHqBGl-sVSkD-qKXWqssSm8n1KduJYE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Veritabanı Tablo Yapısı Kontrolü...\n')

  // Subscriptions tablosunu kontrol et
  console.log('📋 Subscriptions tablosu:')
  try {
    const { data: columns, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)

    if (error) {
      console.log('  ❌ Subscriptions tablosu bulunamadı:', error.message)
    } else {
      console.log('  ✓ Subscriptions tablosu mevcut')
      if (columns.length > 0) {
        console.log('  Sütunlar:', Object.keys(columns[0]))
        Object.keys(columns[0]).forEach(key => {
          if (key.toLowerCase().includes('paytr')) {
            console.log(`  ❌ ${key} - PayTR referansı içeriyor!`)
          }
        })
      }
    }
  } catch (e) {
    console.log('  ⚠️ Subscriptions kontrol edilemedi')
  }

  // Subscription plans tablosunu kontrol et
  console.log('\n📋 Subscription Plans tablosu:')
  try {
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('id, name, payment_provider, paddle_product_id, paddle_price_id')
      .limit(5)

    if (!plans) {
      console.log('  ❌ Subscription plans tablosu bulunamadı')
    } else {
      console.log(`  ✓ ${plans.length} plan bulundu`)
      plans.forEach(plan => {
        if (plan.payment_provider && plan.payment_provider !== 'paddle') {
          console.log(`  ❌ ${plan.name} - Provider: ${plan.payment_provider}`)
        }
      })
    }
  } catch (e) {
    console.log('  ⚠️ Subscription plans kontrol edilemedi')
  }

  // Payment related tablolar
  const paymentTables = ['invoices', 'payments', 'pending_payments', 'payment_methods']

  console.log('\n📋 Ödeme ile ilgili tablolar:')
  for (const tableName of paymentTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (!error && data) {
        console.log(`  ✓ ${tableName} tablosu mevcut`)
        if (data.length > 0) {
          Object.keys(data[0]).forEach(key => {
            if (key.toLowerCase().includes('paytr')) {
              console.log(`  ❌ ${tableName}.${key} - PayTR sütunu!`)
            }
          })
        }
      }
    } catch (e) {
      console.log(`  - ${tableName} tablosu mevcut değil`)
    }
  }

  // Webhook tabloları
  console.log('\n📋 Webhook tabloları:')
  try {
    const { data: webhooks } = await supabase
      .from('paddle_webhook_events')
      .select('*')
      .limit(1)

    if (!webhooks) {
      console.log('  ❌ Paddle webhook events tablosu bulunamadı')
    } else {
      console.log('  ✓ Paddle webhook events tablosu mevcut')
    }
  } catch (e) {
    console.log('  ⚠️ Webhook tablosu kontrol edilemedi')
  }

  console.log('\n✅ Kontrol tamamlandı!')
}

checkTables()