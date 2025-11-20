# Database Migrations

Bu klasör veritabanı migration dosyalarını içerir.

## Migration'ları Çalıştırma

### Supabase Dashboard'dan:

1. Supabase Dashboard'a gidin
2. SQL Editor sekmesine tıklayın
3. "New Query" butonuna tıklayın
4. Migration dosyasının içeriğini kopyalayıp yapıştırın
5. "Run" butonuna tıklayın

### Supabase CLI ile:

```bash
# Migration'ı çalıştır
supabase db execute --file database-scripts/migrations/002_webhook_idempotency.sql
```

### psql ile (Doğrudan bağlantı):

```bash
# Supabase connection string ile
psql "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres" \
  -f database-scripts/migrations/002_webhook_idempotency.sql
```

## Mevcut Migration'lar

### 002_webhook_idempotency.sql
**Tarih:** 2025-11-20
**Amaç:** Webhook idempotency constraint ekler
**Etki:** `webhook_logs` tablosuna unique constraint eklenir, aynı webhook event'in birden fazla işlenmesini engeller

**Önemli:** Bu migration idempotent'tir (birden fazla çalıştırılabilir), mevcut constraint varsa atlar.

## Migration Kuralları

1. ✅ Her migration idempotent olmalı (tekrar çalıştırılabilir)
2. ✅ Dosya adı: `XXX_descriptive_name.sql` formatında
3. ✅ Her migration kendi başına çalışabilmeli
4. ✅ Rollback script'i olmayan migration'lar dikkatli oluşturulmalı
5. ✅ Production'da çalıştırmadan önce staging/dev'de test et

## Test Etme

Migration'ı çalıştırdıktan sonra doğrulama:

```sql
-- Constraint'in eklendiğini kontrol et
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'webhook_logs'::regclass
AND conname = 'unique_webhook_event';

-- Index'in oluşturulduğunu kontrol et
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'webhook_logs'
AND indexname = 'idx_webhook_logs_lookup';
```
