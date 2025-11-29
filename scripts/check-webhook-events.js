const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oymjjceuiotxfbpwsdym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bWpqY2V1aW90eGZicHdzZHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY2OTAwOSwiZXhwIjoyMDc5MDI5MDA5fQ.OJmm3qWC75PMHHqBGl-sVSkD-qKXWqssSm8n1KduJYE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkWebhooks() {
  console.log('🔍 Checking recent webhook events...\n')

  const { data, error } = await supabase
    .from('paddle_webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error fetching webhooks:', error)
    return
  }

  console.log(`Found ${data.length} webhook events:\n`)

  data.forEach((event, index) => {
    console.log(`${index + 1}. Event ID: ${event.event_id}`)
    console.log(`   Type: ${event.event_type}`)
    console.log(`   Processed: ${event.processed}`)
    console.log(`   Created: ${event.created_at}`)
    console.log('---')
  })

  // Check subscriptions table
  console.log('\n🔍 Checking subscriptions...\n')

  const { data: subs, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (subError) {
    console.error('❌ Error fetching subscriptions:', subError)
    return
  }

  console.log(`Found ${subs.length} subscriptions:\n`)

  subs.forEach((sub, index) => {
    console.log(`${index + 1}. User ID: ${sub.user_id}`)
    console.log(`   Plan: ${sub.plan_id}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Paddle Sub ID: ${sub.paddle_subscription_id}`)
    console.log('---')
  })
}

checkWebhooks()