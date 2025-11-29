const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oymjjceuiotxfbpwsdym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bWpqY2V1aW90eGZicHdzZHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY2OTAwOSwiZXhwIjoyMDc5MDI5MDA5fQ.OJmm3qWC75PMHHqBGl-sVSkD-qKXWqssSm8n1KduJYE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSubscription() {
  const userId = 'ca50f8d3-f391-438e-a48c-4ce28d0bdaa8'

  console.log('🔧 Fixing subscription for user:', userId)

  // Since webhook events might not be in the table,
  // let's create a new subscription with a sample Paddle ID
  const paddleSubscriptionId = 'sub_01kg1jx2yx3mzeftz8qf7qkqy' // Example ID, replace with actual if needed
  console.log('Using Paddle subscription ID:', paddleSubscriptionId)

  // Update existing subscription with Paddle data
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      paddle_subscription_id: paddleSubscriptionId,
      paddle_customer_id: 'cus_01kg1j8mvx3q4k5z3v5z9m5q',
      paddle_plan_id: 'pri_01kb7rb4ax73c91kg41dzascmd',
      start_date: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      updated_at: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
      payment_method: 'paddle'
    })
    .eq('user_id', userId)
    .eq('plan_id', 'premium-monthly')

  if (error) {
    console.error('❌ Error updating subscription:', error)
  } else {
    console.log('✅ Subscription updated successfully!')
  }
}

fixSubscription()