# Database Migrations

This folder contains SQL migration scripts for the Kredi Takip application.

## Migration Files

### PayTR Integration
- **`database-migration-paytr.sql`** - Initial PayTR tables setup (subscriptions, plans, billing)
- **`paytr-card-storage.sql`** - PayTR CAPI card storage tables (utoken, ctoken, recurring payments)

### Security & Fixes
- **`database-security-fixes.sql`** - Security hardening and RLS policies

### Notifications
- **`001-create-notification-preferences-trigger.sql`** - Notification preferences trigger
- **`002-update-notification-type-constraint.sql`** - Update notification type constraints

### Webhooks
- **`002_webhook_idempotency.sql`** - Webhook idempotency handling

## Running Migrations

### Local Development

1. Connect to your local Supabase instance:
```bash
psql -h localhost -p 54322 -U postgres
```

2. Run migration:
```sql
\i /path/to/migration.sql
```

### Supabase Dashboard

1. Go to SQL Editor in Supabase Dashboard
2. Copy migration file contents
3. Execute the query

## Migration Order

Run migrations in this order for fresh database:

1. `database-migration-paytr.sql` - Base PayTR tables
2. `paytr-card-storage.sql` - Card storage tables
3. `database-security-fixes.sql` - Security policies
4. `001-create-notification-preferences-trigger.sql` - Notifications
5. `002-update-notification-type-constraint.sql` - Notification constraints
6. `002_webhook_idempotency.sql` - Webhook handling

## Important Notes

- Always backup database before running migrations in production
- Test migrations in development/staging first
- Migrations are designed to be idempotent (safe to run multiple times)
- Check for RLS policies after running migrations

## PayTR Card Storage Tables

### `paytr_user_tokens`
Stores user tokens (utoken) - one per user for card storage.

### `paytr_saved_cards`
Stores saved card details (ctoken, last 4 digits, expiry, metadata).

### `paytr_recurring_payments`
Tracks automatic payment attempts for subscription renewals.

## Security

All tables have Row Level Security (RLS) enabled with policies:
- Users can only access their own records
- Service role has full access for backend operations

## Related Documentation

- [PayTR Direct API Integration](../../docs/paytr/PAYTR_DIRECT_API_INTEGRATION.md)
- [PayTR Card Storage Guide](../../docs/paytr/Paytr%20Kart%20Saklama.pdf)
- [Security Checklist](../../docs/security/SECURITY_CHECKLIST.md)
