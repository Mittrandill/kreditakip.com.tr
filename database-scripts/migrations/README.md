# Database Migrations

This folder contains SQL migration scripts for the Kredi Takip application.

## Migration Files

### PayTR Integration
- **`database-migration-paytr.sql`** - Initial PayTR tables setup (subscriptions, plans, billing)
- **`paytr-card-storage.sql`** - PayTR CAPI card storage tables (utoken, ctoken, recurring payments)
- **`add_payment_security_tracking.sql`** - 🆕 **ÖNEMLİ! Fraud detection, IP logging, chargeback tracking**

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
7. **`add_payment_security_tracking.sql`** - 🆕 **Fraud detection & security tracking (ÇALIŞTIRILMASİ GEREKİYOR!)**

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
Tracks automatic payment attempts for subscription renewals. **YENİ:** IP adresi, device fingerprint ve risk skoru da kaydediliyor.

## Fraud Detection & Security Tables (🆕 YENİ!)

### `payment_security_logs`
Her ödeme eventi için detaylı güvenlik logu tutar:
- IP adresi, user agent, device fingerprint
- Risk skoru ve risk faktörleri
- Browser bilgileri, lokasyon bilgileri

### `payment_chargebacks`
Chargeback (ödeme iptali) takibi:
- Chargeback nedeni, tutar, durum
- İtiraz kanıtları (evidence)
- Çözüm tarihi ve sonuç

### `fraud_detection_rules`
Konfigüre edilebilir fraud detection kuralları:
- 7 adet default kural (inactive user, multiple failed attempts, vb.)
- Risk skoru etkisi
- Aktif/pasif durumu

## Security

All tables have Row Level Security (RLS) enabled with policies:
- Users can only access their own records
- Service role has full access for backend operations

## Fraud Detection Default Rules

Migration çalıştırıldıktan sonra otomatik olarak eklenen kurallar:

1. ✅ **inactive_user_payment** (Risk: 25) - 30+ gün giriş yapmayan kullanıcı
2. ✅ **multiple_failed_attempts** (Risk: 30) - 24 saat içinde 3+ başarısız deneme
3. ✅ **high_amount** (Risk: 15) - 1000 TL üzeri ödeme
4. ✅ **new_user_large_payment** (Risk: 20) - Yeni kullanıcı + 500 TL üzeri
5. ✅ **ip_location_mismatch** (Risk: 10) - IP lokasyonu fatura adresinden farklı
6. ✅ **multiple_cards_same_ip** (Risk: 20) - 24 saat içinde aynı IP'den 3+ kart
7. ✅ **vpn_detected** (Risk: 15) - VPN/proxy kullanımı

## Related Documentation

- [PayTR Direct API Integration](../../docs/paytr/PAYTR_DIRECT_API_INTEGRATION.md)
- [PayTR Card Storage Guide](../../docs/paytr/Paytr%20Kart%20Saklama.pdf)
- [Security Checklist](../../docs/security/SECURITY_CHECKLIST.md)
