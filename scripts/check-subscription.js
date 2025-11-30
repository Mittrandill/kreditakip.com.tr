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

async function checkSubscription() {
  const userId = 'ca50f8d3-f391-438e-a48c-4ce28d0bdaa8' // Your user ID

  console.log('🔍 Checking subscription for user:', userId)

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
  } else if (subscription) {
    console.log('✅ Subscription found:')
    console.log('   Status:', subscription.status)
    console.log('   Plan:', subscription.plan_id)
    console.log('   Paddle Subscription ID:', subscription.paddle_subscription_id)
    console.log('   Created At:', subscription.created_at)
    console.log('   Ends At:', subscription.ends_at)
  } else {
    console.log('❌ No subscription found')
  }

  // Also check paddle webhook events
  console.log('\n📋 Recent Webhook Events:')
  const { data: events } = await supabase
    .from('paddle_webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (events && events.length > 0) {
    events.forEach(event => {
      console.log(`   - ${event.event_type} at ${event.created_at}`)
    })
  }
}

checkSubscription()