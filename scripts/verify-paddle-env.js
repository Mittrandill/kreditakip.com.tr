#!/usr/bin/env node

/**
 * Verify Paddle Environment Variables
 *
 * This script checks if all required Paddle environment variables are set
 * and provides helpful guidance for troubleshooting.
 */

console.log('🔍 Verifying Paddle Environment Variables...\n')

const requiredVars = {
  'NEXT_PUBLIC_PADDLE_ENVIRONMENT': {
    expected: 'production',
    description: 'Should be "production" for live mode'
  },
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN': {
    pattern: /^live_/,
    description: 'Client-side token (should start with "live_")'
  },
  'PADDLE_API_KEY': {
    pattern: /^live_/,
    description: 'Server-side API key (should start with "live_")'
  },
  'PADDLE_WEBHOOK_SECRET': {
    pattern: /^pdl_ntfset_/,
    description: 'Webhook secret (should start with "pdl_ntfset_")'
  }
}

let hasErrors = false

console.log('Environment Variables Check:')
console.log('=' .repeat(50))

for (const [name, config] of Object.entries(requiredVars)) {
  const value = process.env[name]

  if (!value) {
    console.log(`❌ ${name}: MISSING`)
    console.log(`   ${config.description}`)
    hasErrors = true
  } else if (config.expected && value !== config.expected) {
    console.log(`⚠️  ${name}: ${value}`)
    console.log(`   Expected: ${config.expected}`)
  } else if (config.pattern && !config.pattern.test(value)) {
    console.log(`⚠️  ${name}: ${value.substring(0, 10)}...`)
    console.log(`   ${config.description}`)
    console.log(`   Pattern check failed!`)
    hasErrors = true
  } else {
    const masked = value.length > 15
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value
    console.log(`✅ ${name}: ${masked}`)
  }
  console.log('')
}

console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('\n❌ Some environment variables are missing or incorrect!')
  console.log('\nTo fix this:')
  console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
  console.log('2. Add/update the missing variables')
  console.log('3. Redeploy your application')
  console.log('\n📖 See docs/PADDLE_LIVE_SETUP.md for detailed instructions')
  process.exit(1)
} else {
  console.log('\n✅ All Paddle environment variables are correctly set!')
  console.log('\nIf you\'re still experiencing issues:')
  console.log('1. Check browser console for detailed error messages')
  console.log('2. Verify Price IDs match your Paddle dashboard')
  console.log('3. Ensure webhook URL is correctly configured in Paddle')
  process.exit(0)
}
