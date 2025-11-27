# Abonelik Sistemi Dokümantasyonu

## Plan Yapısı

### 1. Free Plan
- **Fiyat**: 0 TL
- **Özellikler**:
  - Sınırsız OCR kredi döküm analizi
  - AI Finansal Sağlık Analizi yok (0 adet)
  - Manuel kredi takibi
  - Basit raporlar

### 2. Pro Plan
**Aylık - 199 TL**
- 10 adet OCR kredi döküm analizi (aylık)
- 5 adet AI Finansal Sağlık Analizi (aylık)
- Gelişmiş raporlar
- Reklamsız deneyim
- Öncelikli destek

**Yıllık - 1.910 TL** (%20 indirim)
- Normal fiyat: 2.388 TL (199 × 12)
- İndirimli fiyat: 1.910 TL
- Tüm aylık özelliklere ek olarak:
  - Yıllık fatura kolaylığı

### 3. Premium Plan
**Aylık - 399 TL**
- Sınırsız OCR kredi döküm analizi
- Sınırsız AI Finansal Sağlık Analizi
- Gelişmiş raporlar
- Reklamsız deneyim
- Öncelikli destek
- Premium badge

**Yıllık - 3.830 TL** (%20 indirim)
- Normal fiyat: 4.788 TL (399 × 12)
- İndirimli fiyat: 3.830 TL
- Tüm aylık özelliklere ek olarak:
  - Yıllık fatura kolaylığı

## Ödeme Sistemi

### PayTR Entegrasyonu
- **3D Secure**: KAPALI (`non_3d=1`)
- **Kart Saklama**: KAPALI (CAPI kullanılmıyor)
- **Ödeme Yöntemi**: Manuel, tek seferlik ödeme
- **Hatırlatma Sistemi**: Email ile manuel ödeme hatırlatması

### Ödeme Akışı
1. Kullanıcı plan seçer
2. Kart bilgilerini girer (3D Secure olmadan)
3. PayTR Direct API ile ödeme alınır
4. Başarılı ödemede abonelik aktif edilir
5. Kullanım limitleri set edilir

## Manuel Hatırlatma Sistemi

### Çalışma Prensibi

#### 1. Günlük Kontrol

**Vercel Cron Jobs** (Otomatik):
- `vercel.json` dosyasında tanımlı
- **09:00 UTC** → Hatırlatma Emaili Gönder (7 gün önceden)
- **10:00 UTC** → Süresi Dolan Abonelikleri Kontrol Et

**GitHub Actions** (Alternatif/Yedek):
- Workflow: `.github/workflows/subscription-reminder.yml`
- Her gün 09:00 UTC'de çalışır
- Vercel cron'lara yedek olarak kullanılabilir

#### 2. Hatırlatma Emaili (7 Gün Önceden)
**Endpoint**: `/api/cron/subscription-reminder`

**Koşullar**:
- Abonelik durumu: `active`
- Abonelik tipi: `premium`
- Bitiş tarihi: 7 gün sonra
- Hatırlatma gönderilmemiş: `reminder_sent_at IS NULL`

**İşlem**:
1. Kriterlere uyan abonelikleri bul
2. Her kullanıcıya hatırlatma emaili gönder
3. `reminder_sent_at` timestamp'ini güncelle

**Email İçeriği**:
- Abonelik bitiş tarihi
- Ödeme tutarı
- Manuel ödeme linki
- 7 gün kaldı uyarısı

#### 3. Abonelik Süresi Dolduğunda (7 Gün Grace Period)
**Endpoint**: `/api/cron/subscription-expiry-check`

**Koşullar**:
- Abonelik durumu: `active`
- Bitiş tarihi: Geçmiş
- Hatırlatma gönderilmiş: `reminder_sent_at NOT NULL`
- 7 gün geçmiş: `reminder_sent_at <= NOW() - 7 days`

**İşlem**:
1. Süresi dolmuş abonelikleri bul
2. Hatırlatmadan 7 gün geçmiş mi kontrol et
3. Evet ise:
   - Abonelik durumunu `expired` yap
   - Plan tipini `free` yap
   - Plan ID'yi `free` yap
   - Kullanım limitlerini free'ye düşür:
     - OCR: -1 (sınırsız)
     - Risk Analizi: 0 (erişim yok)

### Grace Period Zaman Çizelgesi

```
Gün 0  : Abonelik aktif, kullanıcı ödeme yapar
↓
Gün 23 : Abonelik sona ermesine 7 gün kala hatırlatma emaili gönderilir
         (reminder_sent_at timestamp set edilir)
↓
Gün 30 : Abonelik süresi dolar
         Kullanıcı hala premium özelliklerini kullanabilir (grace period)
↓
Gün 37 : Hatırlatma gönderilmesinin üzerinden 7 gün geçti
         → Abonelik free'ye düşürülür
         → Limitler free tier'a sıfırlanır
```

## GitHub Actions Kurulumu

### Gerekli Secrets

Repository → Settings → Secrets and variables → Actions → New repository secret

```
APP_URL=https://kreditakip.com.tr
CRON_SECRET=<güvenli-random-string>
```

### Manuel Tetikleme

GitHub Actions sekmesinden "Subscription Payment Reminder" workflow'unu manuel olarak çalıştırabilirsiniz:
- Actions → Subscription Payment Reminder → Run workflow

## Veritabanı Değişiklikleri

### subscription_plans Tablosu
```sql
-- Yeni planlar eklendi:
- free
- pro-monthly (199 TL)
- pro-yearly (1910 TL)
- premium-monthly (399 TL)
- premium-yearly (3830 TL)
```

### subscriptions Tablosu
```sql
-- Yeni kolon eklendi:
ALTER TABLE subscriptions
  ADD COLUMN reminder_sent_at timestamp with time zone;

-- Constraint güncellendi:
CHECK (plan_id IN ('free', 'pro-monthly', 'pro-yearly',
                   'premium-monthly', 'premium-yearly')
       OR plan_id IS NULL)
```

## Limit Kontrolü

### Metadata Yapısı
```json
{
  "ocr_limit": 10,              // -1 = sınırsız, null = free tier
  "risk_analysis_limit": 5       // -1 = sınırsız, 0 = erişim yok
}
```

### Kullanım Takibi
```typescript
// usage_tracking tablosundan limit_count kontrolü:
- limit_count: -1  → Sınırsız
- limit_count: 0   → Erişim yok
- limit_count: 10  → 10 adet limit
```

## API Endpoints

### Cron Jobs
```
POST /api/cron/subscription-reminder
  → 7 gün önceden hatırlatma emaili gönder

POST /api/cron/subscription-expiry-check
  → Süresi dolan abonelikleri free'ye düşür
```

### Abonelik İşlemleri
```
GET  /api/subscription/status
  → Mevcut abonelik ve kullanım durumu

POST /api/subscription/checkout/direct
  → PayTR ile yeni ödeme başlat

POST /api/subscription/checkout/callback
  → PayTR ödeme sonucu callback
```

## Email Şablonları

### Manuel Ödeme Hatırlatması
```typescript
sendManualPaymentReminder({
  userName: string,
  userEmail: string,
  planName: string,
  amount: number,
  currency: string,
  expiresAt: string,
  daysUntilExpiry: 7,
  paymentUrl: string
})
```

## Test Senaryoları

### 1. Yeni Abonelik Testi
```bash
# Pro Monthly plan alımı
- 199 TL ödeme yap
- Abonelik aktif mi?
- OCR limiti 10 mu?
- Risk analizi limiti 5 mi?
```

### 2. Hatırlatma Emaili Testi
```bash
# Manuel trigger
curl -X POST "https://kreditakip.com.tr/api/cron/subscription-reminder" \
  -H "Authorization: Bearer $CRON_SECRET"

# Kontrol:
- Email gönderildi mi?
- reminder_sent_at set edildi mi?
```

### 3. Grace Period Testi
```bash
# 7 gün geçtikten sonra
curl -X POST "https://kreditakip.com.tr/api/cron/subscription-expiry-check" \
  -H "Authorization: Bearer $CRON_SECRET"

# Kontrol:
- Abonelik free'ye düştü mü?
- OCR limiti -1 mi?
- Risk analizi limiti 0 mı?
```

## Güvenlik Notları

1. **CRON_SECRET**: Güçlü bir random string kullanın
2. **3D Secure Kapalı**: PCI-DSS compliance'a dikkat edin
3. **Kart Saklamıyor**: GDPR uyumlu
4. **Rate Limiting**: API endpoint'lerinde rate limit aktif

## Deployment Checklist

- [ ] Supabase migration çalıştırıldı mı?
- [ ] GitHub Secrets eklendi mi? (APP_URL, CRON_SECRET)
- [ ] GitHub Actions workflow aktif mi?
- [ ] Mailjet credentials set edildi mi?
- [ ] PayTR credentials set edildi mi?
- [ ] Test ödemesi yapıldı mı?
- [ ] Cron job manuel test edildi mi?

## Sorun Giderme

### Hatırlatma Emaili Gitmiyor
1. Mailjet credentials kontrolü
2. GitHub Actions logs kontrolü
3. Supabase logs kontrolü

### Abonelik Düşürülmüyor
1. CRON_SECRET doğru mu?
2. reminder_sent_at timestamp set edilmiş mi?
3. 7 gün geçmiş mi?

### Limitler Çalışmıyor
1. Plan metadata kontrolü
2. usage_tracking tablosu kontrolü
3. Callback route'u doğru çalışıyor mu?
