# Paddle Migration Guide

## Overview
This guide helps you migrate from PayTR to Paddle for subscription management. Paddle will handle all payment processing, subscription management, and tax compliance automatically.

## Paddle Setup Checklist

### 1. Paddle Account Setup
- [ ] Sign up at [Paddle.com](https://www.paddle.com/)
- [ ] Complete your business verification
- [ ] Set up your bank details for payouts
- [ ] Configure tax settings (Paddle handles VAT/GST automatically)

### 2. Paddle Sandbox Setup
- [ ] Enable Sandbox mode in Paddle settings
- [ ] Get your Sandbox API keys:
  - `PADDLE_VENDOR_ID` (from Settings > API Keys)
  - `PADDLE_VENDOR_AUTH_CODE` (from Settings > API Keys)
  - `PADDLE_PUBLIC_KEY` (from Checkout > Branding > Public Key)

### 3. Environment Variables
Add these to your `.env.local`:

```env
# Paddle Configuration
NEXT_PUBLIC_PADDLE_VENDOR_ID=your_vendor_id
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_VENDOR_AUTH_CODE=your_vendor_auth_code
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://sandbox-checkout.paddle.com/checkout/custom
```

For production:
```env
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://checkout.paddle.com/checkout/custom
```

### 4. Paddle Products Setup
In your Paddle dashboard (Products):

#### Pro Plan (Monthly)
- Product Name: "Pro Plan (Monthly)"
- Product ID: `pro_monthly_2025` (you'll get this from Paddle)
- Price: 199.00 TRY
- Billing Type: Subscription
- Billing Interval: Monthly
- Tax: Automatic (Paddle handles this)

#### Pro Plan (Yearly)
- Product Name: "Pro Plan (Yearly)"
- Product ID: `pro_yearly_2025`
- Price: 1,910.00 TRY
- Billing Type: Subscription
- Billing Interval: Yearly
- Tax: Automatic

#### Premium Plan (Monthly)
- Product Name: "Premium Plan (Monthly)"
- Product ID: `premium_monthly_2025`
- Price: 399.00 TRY
- Billing Type: Subscription
- Billing Interval: Monthly

#### Premium Plan (Yearly)
- Product Name: "Premium Plan (Yearly)"
- Product ID: `premium_yearly_2025`
- Price: 3,830.00 TRY
- Billing Type: Subscription
- Billing Interval: Yearly

### 5. Webhook Configuration
Set up webhooks in Paddle (Settings > Webhooks):
- URL: `https://yourdomain.com/api/paddle/webhooks`
- Events to subscribe:
  - `subscription.created`
  - `subscription.updated`
  - `subscription.cancelled`
  - `subscription.payment_succeeded`
  - `subscription.payment_failed`
  - `subscription.paused`
  - `subscription.resumed`
  - `payment.succeeded`
  - `payment.refunded`

### 6. Checkout Customization
In Paddle Checkout > Branding:
- Upload your logo
- Set brand colors (matching your site)
- Configure checkout message
- Set payment methods (Credit Card, PayPal, etc.)

## Database Migration

Your database needs these updates to work with Paddle:

### New Columns for subscriptions table:
```sql
ALTER TABLE subscriptions
ADD COLUMN paddle_subscription_id VARCHAR(255),
ADD COLUMN paddle_plan_id VARCHAR(255),
ADD COLUMN paddle_customer_id VARCHAR(255),
ADD COLUMN paddle_checkout_id VARCHAR(255),
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancel_url TEXT,
ADD COLUMN update_url TEXT;

-- Create indexes
CREATE INDEX idx_subscriptions_paddle_sub_id ON subscriptions(paddle_subscription_id);
CREATE INDEX idx_subscriptions_paddle_customer_id ON subscriptions(paddle_customer_id);
```

### New paddle_customers table:
```sql
CREATE TABLE paddle_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    paddle_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    country VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_paddle_customers_user_id ON paddle_customers(user_id);
CREATE INDEX idx_paddle_customers_paddle_id ON paddle_customers(paddle_customer_id);
```

## Implementation Steps

### 1. Install Paddle SDK
```bash
npm install @paddle/paddle-js
```

### 2. Update Subscription Plans
Update your plans to include Paddle product IDs:

```typescript
// lib/subscription-plans.ts
export const SUBSCRIPTION_PLANS = [
  {
    id: "pro-monthly",
    name: "Pro",
    paddleProductId: "pro_monthly_2025", // From Paddle
    price: 199,
    // ... rest
  },
  // ... other plans
]
```

### 3. Replace Payment Form
Replace your PayTR payment form with Paddle Checkout overlay.

### 4. Update Webhooks
Replace PayTR webhooks with Paddle webhooks for subscription events.

### 5. Update Customer Portal
Implement Paddle's Customer Portal for subscription management.

## Benefits of Paddle

1. **No PCI Compliance Needed** - Paddle handles all card data
2. **Automatic Tax Management** - VAT/GST handled globally
3. **Multiple Payment Methods** - Cards, PayPal, Apple Pay, Google Pay
4. **Subscription Management** - Dunning, retries, grace periods
5. **Customer Portal** - Self-service subscription management
6. **Detailed Reporting** - Revenue, MRR, churn analytics
7. **Global Support** - 135+ currencies, 20+ languages

## Migration Timeline

1. **Day 1**: Paddle setup and product configuration
2. **Day 2**: Database migration and SDK installation
3. **Day 3**: Implement checkout and webhooks
4. **Day 4**: Test sandbox integration
5. **Day 5**: Deploy to production
6. **Day 6**: Migrate existing subscriptions (if needed)

## Post-Migration

1. **Monitor Transactions**: Check Paddle dashboard for any issues
2. **Test Cancellations**: Ensure the customer portal works
3. **Verify Tax**: Check that tax is being applied correctly
4. **Update Documentation**: Update your help docs and FAQs

## Troubleshooting

### Common Issues:
1. **Checkout not loading**: Check API keys and environment
2. **Webhooks not working**: Verify URL is accessible and HTTPS
3. **Tax not applying**: Check customer country settings
4. **Subscription not updating**: Check webhook processing

### Support Resources:
- [Paddle Documentation](https://developer.paddle.com/)
- [Paddle Support](https://paddle.com/support/)
- [Paddle API Reference](https://developer.paddle.com/api-reference)

## Security Considerations

1. **Never expose secret keys** on the client side
2. **Verify webhook signatures** using Paddle's public key
3. **Use HTTPS** for all endpoints
4. **Log all events** for debugging and compliance
5. **Handle errors gracefully** without exposing sensitive data