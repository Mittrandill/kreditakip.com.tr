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