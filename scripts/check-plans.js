const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oymjjceuiotxfbpwsdym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bWpqY2V1aW90eGZicHdzZHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY2OTAwOSwiZXhwIjoyMDc5MDI5MDA5fQ.OJmm3qWC75PMHHqBGl-sVSkD-qKXWqssSm8n1KduJYE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlans() {
  console.log('🔍 Checking subscription plans...\n')

  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('❌ Error fetching plans:', error.message)
      return
    }

    console.log(`✓ Found ${plans.length} active plans:\n`)

    plans.forEach(plan => {
      console.log(`📋 ${plan.name} (${plan.id})`)
      console.log(`   - Price: ${plan.price} ${plan.currency}`)
      console.log(`   - Period: ${plan.billing_period}`)
      console.log(`   - Paddle Product ID: ${plan.paddle_product_id || 'NOT SET'}`)
      console.log(`   - Paddle Price ID: ${plan.paddle_price_id || 'NOT SET'}`)
      console.log(`   - Popular: ${plan.is_popular ? 'Yes' : 'No'}`)
      console.log('')
    })

    // Check if environment variables match
    console.log('\n🔧 Environment Variables:')
    console.log(`PADDLE_PRO_PLAN_ID: ${process.env.PADDLE_PRO_PLAN_ID || 'NOT SET'}`)
    console.log(`PADDLE_PREMIUM_PLAN_ID: ${process.env.PADDLE_PREMIUM_PLAN_ID || 'NOT SET'}`)

  } catch (e) {
    console.error('❌ Unexpected error:', e)
  }
}

checkPlans()