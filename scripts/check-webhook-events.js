require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// SECURITY: Always use environment variables for sensitive credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

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