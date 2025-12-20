#!/usr/bin/env node

/**
 * Test Paddle Live Configuration
 *
 * This script verifies that all Paddle live mode environment variables are correctly set
 * and tests the connection to Paddle API.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const requiredEnvVars = {
  'NEXT_PUBLIC_PADDLE_ENVIRONMENT': {
    required: true,
    expectedValue: 'production',
    description: 'Paddle environment (should be "production" for live mode)'
  },
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN': {
    required: true,
    pattern: /^live_/,
    description: 'Paddle client token for frontend (should start with "live_")'
  },
  'PADDLE_API_KEY': {
    required: true,
    pattern: /^live_/,
    description: 'Paddle API key for backend (should start with "live_")'
  },
  'PADDLE_WEBHOOK_SECRET': {
    required: true,
    pattern: /^pdl_ntfset_/,
    description: 'Paddle webhook secret (should start with "pdl_ntfset_")'
  },
  'NEXT_PUBLIC_PADDLE_CHECKOUT_URL': {
    required: true,
    expectedValue: 'https://buy.paddle.com/checkout',
    description: 'Paddle checkout URL (should be production URL)'
  }
}

async function testPaddleConfiguration() {
  console.log('🧪 Testing Paddle Live Mode Configuration...\n')

  let allPassed = true
  const warnings = []

  // Test 1: Environment Variables
  console.log('📋 Checking Environment Variables:')
  console.log('=====================================')

  for (const [envVar, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[envVar]

    if (!value) {
      console.log(`❌ ${envVar}: MISSING`)
      console.log(`   ${config.description}`)
      allPassed = false
    } else {
      let status = '✅'
      let message = 'OK'

      if (config.expectedValue && value !== config.expectedValue) {
        status = '⚠️ '
        message = `Expected "${config.expectedValue}", got "${value}"`
        warnings.push(`${envVar}: ${message}`)
      } else if (config.pattern && !config.pattern.test(value)) {
        status = '⚠️ '
        message = `Does not match expected pattern`
        warnings.push(`${envVar}: ${message}`)
      }

      // Hide sensitive parts of the value
      const maskedValue = value.length > 20 ?
        `${value.substring(0, 10)}...${value.substring(value.length - 4)}` :
        `${value.substring(0, 8)}...`

      console.log(`${status} ${envVar}: ${maskedValue}`)
      console.log(`   ${config.description}`)
    }
    console.log('')
  }

  // Test 2: Paddle API Connection
  console.log('\n🌐 Testing Paddle API Connection:')
  console.log('=====================================')

  try {
    const apiKey = process.env.PADDLE_API_KEY
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT
    const baseUrl = environment === 'sandbox' ?
      'https://sandbox-api.paddle.com' :
      'https://api.paddle.com'

    const response = await fetch(`${baseUrl}/products?per_page=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      console.log('✅ Paddle API connection successful')
      const data = await response.json()
      console.log(`   Found ${data.meta?.pagination?.total || 0} product(s)`)
    } else {
      const error = await response.json().catch(() => ({}))
      console.log('❌ Paddle API connection failed')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${error.error?.detail || response.statusText}`)
      allPassed = false
    }
  } catch (error) {
    console.log('❌ Paddle API connection error')
    console.log(`   ${error.message}`)
    allPassed = false
  }

  // Test 3: Database Price IDs
  console.log('\n💾 Checking Database Price IDs:')
  console.log('=====================================')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('id, name, paddle_product_id, paddle_price_id')
      .order('id')

    if (error) {
      console.log('❌ Error fetching plans from database')
      console.log(`   ${error.message}`)
      allPassed = false
    } else {
      const liveProductPattern = /^pro_01/
      const livePricePattern = /^pri_01/

      plans.forEach(plan => {
        if (plan.id === 'free') {
          console.log(`⚪ ${plan.name} (${plan.id}): Free plan, no Paddle IDs needed`)
          return
        }

        const hasProduct = plan.paddle_product_id
        const hasPrice = plan.paddle_price_id
        const isLiveProduct = hasProduct && liveProductPattern.test(plan.paddle_product_id)
        const isLivePrice = hasPrice && livePricePattern.test(plan.paddle_price_id)

        if (!hasProduct || !hasPrice) {
          console.log(`❌ ${plan.name} (${plan.id}): Missing Paddle IDs`)
          allPassed = false
        } else if (!isLiveProduct || !isLivePrice) {
          console.log(`⚠️  ${plan.name} (${plan.id}): May be using sandbox IDs`)
          console.log(`   Product: ${plan.paddle_product_id}`)
          console.log(`   Price: ${plan.paddle_price_id}`)
          warnings.push(`${plan.name}: Check if using live Paddle IDs`)
        } else {
          console.log(`✅ ${plan.name} (${plan.id}): Live IDs configured`)
          console.log(`   Product: ${plan.paddle_product_id}`)
          console.log(`   Price: ${plan.paddle_price_id}`)
        }
      })
    }
  } else {
    console.log('⚠️  Supabase credentials not found, skipping database check')
  }

  // Summary
  console.log('\n📊 Summary:')
  console.log('=====================================')

  if (allPassed && warnings.length === 0) {
    console.log('✅ All tests passed! Paddle live mode is correctly configured.')
  } else {
    if (!allPassed) {
      console.log('❌ Some tests failed. Please fix the errors above.')
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} warning(s):`)
      warnings.forEach(warning => console.log(`   - ${warning}`))
    }
  }

  console.log('\n📖 Next steps:')
  console.log('   1. Ensure all environment variables are set in Vercel')
  console.log('   2. Test checkout flow in production')
  console.log('   3. Verify webhook is receiving events')
  console.log('   4. Monitor first few transactions closely')
  console.log('\n💡 See docs/PADDLE_LIVE_SETUP.md for detailed setup instructions')
}

testPaddleConfiguration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
