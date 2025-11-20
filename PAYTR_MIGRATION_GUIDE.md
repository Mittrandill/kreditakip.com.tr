# PayTR Migration Guide

Bu rehber, Iyzico'dan PayTR'ye geçiş için gerekli adımları içermektedir.

## 1. Veritabanı Migration

Supabase SQL Editor'de aşağıdaki SQL dosyasını çalıştırın:

```bash
# Dosya konumu
database-migration-paytr.sql
```

Bu migration:
- `subscriptions` tablosundaki `iyzico_*` kolonlarını `paytr_*` veya generic isimlerle değiştirir
- `payment_transactions` tablosundaki `iyzico_*` kolonlarını `paytr_*` ile değiştirir
- Mevcut kayıtları günceller
- Performans için index'ler ekler

### Değişen Kolonlar:

**subscriptions table:**
- `iyzico_subscription_id` → `paytr_order_id`
- `iyzico_subscription_reference` → `payment_subscription_reference`
- `iyzico_payment_id` → `payment_id`

**payment_transactions table:**
- `iyzico_payment_id` → `paytr_order_id`
- `iyzico_conversation_id` → `paytr_conversation_id`

## 2. Environment Variables

`.env.local` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
# PayTR Payment Gateway
PAYTR_MERCHANT_ID=your-paytr-merchant-id
PAYTR_MERCHANT_KEY=your-paytr-merchant-key
PAYTR_MERCHANT_SALT=your-paytr-merchant-salt
PAYTR_TEST_MODE=1  # Production için 0, Test için 1
```

### PayTR Credentials Nasıl Alınır?

1. https://www.paytr.com adresine gidin
2. Hesap oluşturun veya giriş yapın
3. Panel > Entegrasyon bölümünden:
   - Merchant ID
   - Merchant Key
   - Merchant Salt
   değerlerini alın

## 3. Vercel/Production Deployment

Production ortamında aşağıdaki environment variables'ları ayarlayın:

```
PAYTR_MERCHANT_ID=<production-merchant-id>
PAYTR_MERCHANT_KEY=<production-merchant-key>
PAYTR_MERCHANT_SALT=<production-merchant-salt>
PAYTR_TEST_MODE=0
```

## 4. PayTR Panel Ayarları

PayTR panel'inde aşağıdaki URL'leri ayarlayın:

**Callback URL (Bildirim URL):**
```
https://yourdomain.com/api/subscription/checkout/callback
```

**Başarılı Ödeme Dönüş URL:**
```
https://yourdomain.com/api/subscription/checkout/callback
```

**Başarısız Ödeme Dönüş URL:**
```
https://yourdomain.com/uygulama/ayarlar?payment=failed
```

## 5. Test Etme

### Test Modu:
```env
PAYTR_TEST_MODE=1
```

Test kartları:
- Kart No: 4355084355084358
- Son Kullanma: 12/26
- CVV: 000

### Production Modu:
```env
PAYTR_TEST_MODE=0
```

Production'da gerçek kart bilgileri kullanılır.

## 6. Önemli Notlar

### PayTR vs Iyzico Farkları:

1. **Recurring Subscription:**
   - Iyzico: Otomatik tekrarlayan ödemeler destekler
   - PayTR: Manuel tekrarlayan ödemeler (kullanıcı her dönem ödeme yapar)

2. **Ödeme Akışı:**
   - Iyzico: Embedded checkout form
   - PayTR: External iframe redirect

3. **Callback:**
   - PayTR callback'i POST request olarak gelir
   - Hash doğrulaması zorunludur (güvenlik)

4. **Para Birimi:**
   - PayTR kuruş cinsinden çalışır (örn: 199.00 TL = 19900 kuruş)

## 7. Rollback Planı

Eğer sorun yaşarsanız:

1. Git üzerinden eski commit'e dönün:
```bash
git log --oneline  # commit hash'ini bulun
git revert <commit-hash>
```

2. Database migration'ı geri alın:
```sql
-- Kolon isimlerini geri değiştir
ALTER TABLE subscriptions RENAME COLUMN paytr_order_id TO iyzico_subscription_id;
-- vs.
```

3. Environment variables'ları eski haline getirin

## 8. Monitoring

Migration sonrası kontrol edilmesi gerekenler:

- [ ] Yeni subscription satın alımları çalışıyor mu?
- [ ] PayTR callback'leri geliyor mu?
- [ ] Subscription status'lar doğru güncelleniyor mu?
- [ ] Payment transactions kaydediliyor mu?
- [ ] Invoice'lar oluşturuluyor mu?
- [ ] Email bildirimleri gönderiliyor mu?

## 9. Destek

Sorun yaşarsanız:
- PayTR Destek: destek@paytr.com
- PayTR Dokümantasyon: https://www.paytr.com/entegrasyon
