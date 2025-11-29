const crypto = require('crypto');

// Test webhook payload
const testPayload = {
  event_id: 'evt_test_' + Date.now(),
  event_type: 'subscription.created',
  data: {
    id: 'sub_test_' + Date.now(),
    customer_id: 'cus_test_123',
    customer_email: 'test@example.com',
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: [{
      price: {
        id: 'pri_test_123',
        currency: 'USD',
        amount: 999
      }
    }],
    custom_data: {
      user_id: 'test_user_123',
      plan_id: 'premium_plan'
    },
    management_urls: {
      cancel: 'https://example.com/cancel',
      update_payment: 'https://example.com/update'
    }
  }
};

// Paddle test public key (from .env.local)
const PADDLE_PUBLIC_KEY = 'test_5df0da577618a325530f2612765';

// Generate signature
function generateSignature(payload, secretKey) {
  const signer = crypto.createSign('sha256');
  signer.update(payload);
  return signer.sign(secretKey, 'base64');
}

// The payload as string
const payloadString = JSON.stringify(testPayload);

// For testing, we'll use a placeholder signature
// In real scenario, this would be generated with Paddle's private key
const testSignature = 'test_signature';

console.log('=== Paddle Webhook Test ===');
console.log('\nWebhook URL: https://undeaf-shaneka-fernless.ngrok-free.dev/api/paddle/webhooks');
console.log('\nTest Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\nTo test with Paddle:');
console.log('1. Go to Paddle Seller Dashboard > Developer Tools > Webhooks');
console.log('2. Add webhook URL: https://undeaf-shaneka-fernless.ngrok-free.dev/api/paddle/webhooks');
console.log('3. Send test events from the dashboard');
console.log('\nTo test locally with curl:');
console.log(`curl -X POST https://undeaf-shaneka-fernless.ngrok-free.dev/api/paddle/webhooks \\
  -H "Content-Type: application/json" \\
  -H "paddle_signature: ${testSignature}" \\
  -d '${payloadString}'`);