#!/usr/bin/env node

/**
 * Update Paddle Plans to Live Mode
 *
 * This script updates the subscription_plans table with live Paddle price IDs.
 * Run this when switching from sandbox to production.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateLivePaddlePlans() {
  console.log('🚀 Updating Paddle plans to LIVE mode...\n')

  const updates = [
    {
      id: 'premium-monthly',
      name: 'Premium Monthly',
      paddle_product_id: 'pro_01kcrga40mwkf0t80drbe06rbd',
      paddle_price_id: 'pri_01kcrgn0119qmdrgdy92phf840'
    },
    {
      id: 'premium-yearly',
      name: 'Premium Yearly',
      paddle_product_id: 'pro_01kcrga40mwkf0t80drbe06rbd',
      paddle_price_id: 'pri_01kcrgdk1qex8pbyc2g47fv5dg'
    },
    {
      id: 'pro-monthly',
      name: 'Pro Monthly',
      paddle_product_id: 'pro_01kcrgadnmnknkz1c32yd50t5t',
      paddle_price_id: 'pri_01kcrgqgnatmmafk81qb9skdv2'
    },
    {
      id: 'pro-yearly',
      name: 'Pro Yearly',
      paddle_product_id: 'pro_01kcrgadnmnknkz1c32yd50t5t',
      paddle_price_id: 'pri_01kcrgrk0481d1wgrxw1gspqfq'
    }
  ]

  for (const plan of updates) {
    console.log(`📝 Updating ${plan.name}...`)

    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        paddle_product_id: plan.paddle_product_id,
        paddle_price_id: plan.paddle_price_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', plan.id)
      .select()

    if (error) {
      console.error(`   ❌ Error updating ${plan.name}:`, error.message)
    } else if (data && data.length > 0) {
      console.log(`   ✅ ${plan.name} updated successfully`)
      console.log(`      Product ID: ${plan.paddle_product_id}`)
      console.log(`      Price ID: ${plan.paddle_price_id}`)
    } else {
      console.log(`   ⚠️  ${plan.name} not found in database`)
    }
    console.log('')
  }

  // Verify updates
  console.log('🔍 Verifying updates...\n')

  const { data: allPlans, error: verifyError } = await supabase
    .from('subscription_plans')
    .select('id, name, paddle_product_id, paddle_price_id')
    .order('id')

  if (verifyError) {
    console.error('❌ Error verifying updates:', verifyError.message)
  } else {
    console.log('Current Paddle Plan Configuration:')
    console.log('=====================================')
    allPlans.forEach(plan => {
      console.log(`\n${plan.name} (${plan.id}):`)
      console.log(`  Product ID: ${plan.paddle_product_id || 'Not set'}`)
      console.log(`  Price ID: ${plan.paddle_price_id || 'Not set'}`)
    })
  }

  console.log('\n✅ Update complete!\n')
  console.log('⚠️  IMPORTANT: Make sure to update your .env.local with:')
  console.log('   - NEXT_PUBLIC_PADDLE_ENVIRONMENT=production')
  console.log('   - NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...')
  console.log('   - PADDLE_API_KEY=live_...')
  console.log('   - PADDLE_WEBHOOK_SECRET=pdl_ntfset_...')
}

updateLivePaddlePlans()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
