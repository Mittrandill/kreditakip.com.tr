const crypto = require('crypto');

// Simple Paddle client implementation for testing
class TestPaddleClient {
  constructor() {
    this.vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;
    this.apiKey = process.env.PADDLE_API_KEY;
    this.isTest = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox";
  }

  getBaseUrl() {
    return this.isTest
      ? "https://sandbox-api.paddle.com"
      : "https://api.paddle.com";
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.detail || `Paddle API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createCheckoutLink(options) {
    const response = await this.makeRequest("/checkouts", {
      method: "POST",
      body: JSON.stringify({
        items: options.items,
        customer_email: options.customer_email,
        custom_data: options.custom_data,
        success_url: options.success_url,
        cancel_url: options.cancel_url,
        passthrough: options.passthrough,
      }),
    });

    return {
      url: response.data.url,
      id: response.data.id,
    };
  }

  static generatePassthrough(userId, planId, metadata) {
    return JSON.stringify({
      userId,
      planId,
      timestamp: Date.now(),
      ...metadata,
    });
  }
}

async function testCheckout() {
  console.log('🚀 Creating Paddle Checkout Test...\n');

  // Test verileri
  const testData = {
    userEmail: 'test@example.com',
    userId: 'test-user-123',
    planId: 'premium', // premium veya pro
    planName: 'Premium Plan'
  };

  const paddleClient = new TestPaddleClient();

  // Plan ID'leri environment'dan al
  const proPlanId = process.env.PADDLE_PRO_PLAN_ID;
  const premiumPlanId = process.env.PADDLE_PREMIUM_PLAN_ID;

  console.log(`Environment Variables:`);
  console.log(`- Pro Plan ID: ${proPlanId}`);
  console.log(`- Premium Plan ID: ${premiumPlanId}`);
  console.log(`- Vendor ID: ${process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID}`);
  console.log(`- Environment: ${process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT}\n`);

  try {
    // Passthrough data oluştur
    const passthrough = TestPaddleClient.generatePassthrough(
      testData.userId,
      testData.planId,
      {
        email: testData.userEmail,
        planName: testData.planName
      }
    );

    // Checkout options
    const checkoutOptions = {
      items: [{
        price_id: testData.planId === 'pro' ? proPlanId : premiumPlanId,
        quantity: 1
      }],
      customer_email: testData.userEmail,
      custom_data: {
        user_id: testData.userId,
        plan_id: testData.planId,
        plan_name: testData.planName
      },
      success_url: `https://undeaf-shaneka-fernless.ngrok-free.dev/api/subscription/checkout/callback?success=true`,
      cancel_url: `https://undeaf-shaneka-fernless.ngrok-free.dev/subscription?canceled=true`,
      passthrough: passthrough
    };

    console.log('Creating checkout with options:');
    console.log(JSON.stringify(checkoutOptions, null, 2));

    // Checkout oluştur
    const checkout = await paddleClient.createCheckoutLink(checkoutOptions);

    console.log('\n✅ Checkout created successfully!');
    console.log(`\n📦 Checkout URL: ${checkout.url}`);
    console.log(`🆔 Checkout ID: ${checkout.id}`);

    console.log('\n🔗 Test the checkout:');
    console.log('1. Copy the URL above');
    console.log('2. Paste it in your browser');
    console.log('3. Complete the test payment (use Paddle test cards)');
    console.log('4. Check the webhook logs in your Supabase paddle_webhook_events table');

  } catch (error) {
    console.error('❌ Error creating checkout:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Check if Paddle API key is correct');
    console.error('2. Verify Product IDs are correct');
    console.error('3. Make sure you have the right permissions');
  }
}

// Environment'ı yükle
require('dotenv').config({ path: '.env.local' });

testCheckout();