# Paddle Integration Documentation

This document explains the Paddle payment integration for the kreditakip.com.tr subscription system.

## Overview

We've migrated from PayTR to Paddle for subscription management. Paddle provides:
- ✅ PCI DSS compliance (no card data touches our servers)
- ✅ Global tax handling (VAT, GST, etc.)
- ✅ Multiple payment methods (Cards, PayPal, Apple Pay, Google Pay)
- ✅ Subscription management (dunning, retries, grace periods)
- ✅ Customer portal for self-service
- ✅ Webhook notifications for real-time updates

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend API   │     │     Paddle      │
│                 │     │                 │     │                 │
│ - Paddle Checkout ◄────► - Webhook       ◄────► - Subscription   │
│ - Customer Portal│     │   Handler       │     │   Management    │
│ - Subscription  │     │ - Checkout API  │     │ - Tax Calc      │
│   Management    │     │ - Status API    │     │ - Payment       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Key Components

### 1. PaddleCheckout Component
- Location: `components/payment/paddle-checkout.tsx`
- Handles checkout flow
- Collects billing info
- Opens Paddle checkout overlay

### 2. Webhook Handler
- Location: `app/api/paddle/webhooks/route.ts`
- Processes all Paddle events
- Updates subscription status in database
- Sends email notifications

### 3. Subscription Management
- Location: `components/subscription/subscription-management.tsx`
- User-facing subscription portal
- Links to Paddle customer portal
- Shows current subscription status

### 4. Database Schema
New tables added:
- `paddle_customers` - Maps users to Paddle customers
- `paddle_webhook_events` - Logs all webhook events
- Updated `subscriptions` table with Paddle fields

## Setup Instructions

### 1. Paddle Account Setup

1. Create a Paddle account at [paddle.com](https://paddle.com)
2. Complete business verification
3. Set up bank details for payouts

### 2. Environment Variables

Add to your `.env.local`:

```env
# Paddle Configuration
NEXT_PUBLIC_PADDLE_VENDOR_ID=your_vendor_id
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_VENDOR_AUTH_CODE=your_vendor_auth_code
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://sandbox-checkout.paddle.com/checkout/custom
PADDLE_PUBLIC_KEY=your_paddle_public_key
```

### 3. Product Configuration in Paddle

Create 4 subscription products in Paddle:

1. **Pro Monthly**
   - Product ID: `pro_monthly_2025`
   - Price: 199 TRY
   - Billing: Monthly

2. **Pro Yearly**
   - Product ID: `pro_yearly_2025`
   - Price: 1,910 TRY
   - Billing: Yearly

3. **Premium Monthly**
   - Product ID: `premium_monthly_2025`
   - Price: 399 TRY
   - Billing: Monthly

4. **Premium Yearly**
   - Product ID: `premium_yearly_2025`
   - Price: 3,830 TRY
   - Billing: Yearly

### 4. Webhook Setup

1. In Paddle Dashboard > Developer > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/paddle/webhooks`
3. Subscribe to events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.payment_succeeded`
   - `subscription.payment_failed`
   - `subscription.paused`
   - `subscription.resumed`

### 5. Database Migration

Run the migration:

```sql
-- File: supabase/migrations/20251128000001_add_paddle_integration.sql
```

### 6. Update Plans

Run the SQL update to add Paddle product IDs:

```sql
-- File: supabase/update_paddle_plans.sql
```

Remember to replace with actual Paddle product IDs!

## Testing

### Sandbox Testing

1. Use test card numbers from Paddle documentation
2. Test card: `4242 4242 4242 4242`
3. Test 3D Secure: `4000 0025 0000 3155`
4. Check webhook delivery in Paddle dashboard

### Test Scenarios

- ✅ Successful subscription creation
- ✅ Payment failure handling
- ✅ Subscription cancellation
- ✅ Plan upgrade/downgrade
- ✅ Webhook event processing

## Monitoring

### Key Metrics to Track

1. Conversion Rate
   - Checkout started → Completed
   - Cart abandonment rate

2. Subscription Metrics
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - Customer lifetime value

3. Payment Issues
   - Failed payment rate
   - Dunning success rate
   - Chargeback rate

### Logs to Monitor

```bash
# Check webhook logs
supabase db logs
  -n "paddle_webhook_events"

# Check subscription updates
supabase db logs
  -n "subscriptions" --since="1h"
```

## Troubleshooting

### Common Issues

1. **Webhook not received**
   - Check URL is accessible and HTTPS
   - Verify webhook secret matches
   - Check Paddle webhook logs

2. **Subscription not updating**
   - Check webhook processing logs
   - Verify database connection
   - Check for duplicate events

3. **Checkout not loading**
   - Verify Paddle script loads
   - Check API keys are correct
   - Ensure environment is set correctly

### Debug Commands

```sql
-- Check latest webhooks
SELECT * FROM paddle_webhook_events
ORDER BY created_at DESC
LIMIT 10;

-- Check subscription status
SELECT * FROM subscriptions
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;

-- Check Paddle customer mapping
SELECT * FROM paddle_customers
WHERE user_id = 'your-user-id';
```

## Security Considerations

1. **Never expose** secret keys on client-side
2. **Always verify** webhook signatures
3. **Use HTTPS** for all endpoints
4. **Log events** for auditing
5. **Handle errors** gracefully without exposing details

## Migration from PayTR

### Differences

| Feature | PayTR | Paddle |
|---------|-------|--------|
| Card Data | Passes through server | Never touches our servers |
| Tax | Manual calculation | Automatic global tax |
| Subscriptions | Manual management | Full subscription suite |
| Customer Portal | None | Built-in customer portal |
| Dunning | Manual | Automatic retry logic |

### Migration Steps

1. ✅ Install Paddle SDK
2. ✅ Update database schema
3. ✅ Create new checkout flow
4. ✅ Implement webhooks
5. ✅ Update subscription management
6. ⏳ Migrate existing subscriptions (manual)
7. ⏳ Remove PayTR code (after testing)

## Support

- Paddle Documentation: https://developer.paddle.com/
- Paddle Support: https://paddle.com/support/
- Internal: Check database logs for webhook events

## Production Deployment Checklist

- [ ] Use production Paddle keys
- [ ] Update webhook URL to production
- [ ] Test with real payment method
- [ ] Monitor first live transactions
- [ ] Set up alerts for failed webhooks
- [ ] Backup database before migration
- [ ] Have rollback plan ready