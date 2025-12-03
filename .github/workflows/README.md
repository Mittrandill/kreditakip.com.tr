# GitHub Actions Workflows

Bu klasörde otomatik ödeme özeti e-postaları için GitHub Actions workflow'ları bulunmaktadır.

## Workflows

### 1. Monthly Payment Summary (`monthly-payment-summary.yml`)
**Ne yapar:** Her ayın 1'inde kullanıcılara o ayki tüm ödemelerini içeren özet e-posta gönderir.

**Çalışma Zamanı:** Her ayın 1'i saat 09:00 UTC (Türkiye saati 12:00)

**Cron Expression:** `0 9 1 * *`

### 2. Weekly Payment Summary (`weekly-payment-summary.yml`)
**Ne yapar:** Her Pazartesi kullanıcılara o haftaki ödemelerini içeren hatırlatıcı e-posta gönderir.

**Çalışma Zamanı:** Her Pazartesi saat 09:00 UTC (Türkiye saati 12:00)

**Cron Expression:** `0 9 * * 1`

## Kurulum

### GitHub Secret Ekleme

1. GitHub repository'nize gidin
2. **Settings** > **Secrets and variables** > **Actions** sayfasına gidin
3. **New repository secret** butonuna tıklayın
4. Secret ekleyin:
   - **Name:** `CRON_SECRET`
   - **Value:** Güvenli bir secret key (örn: rastgele 32 karakter)

### Environment Variable Ekleme (Vercel/Production)

Aynı `CRON_SECRET` değerini production environment'ınıza da eklemelisiniz:

**Vercel:**
1. Vercel Dashboard > Project > Settings > Environment Variables
2. Yeni environment variable ekleyin:
   - **Key:** `CRON_SECRET`
   - **Value:** GitHub'da kullandığınız aynı değer
   - **Environment:** Production (ve diğerleri)

## Manuel Tetikleme (Test)

Her iki workflow da manuel olarak test edilebilir:

1. GitHub'da **Actions** sekmesine gidin
2. Sol menüden workflow'u seçin (Monthly veya Weekly)
3. **Run workflow** butonuna tıklayın
4. **Run workflow** ile onaylayın

## Workflow Detayları

### Adımlar:
1. ✅ Code checkout
2. ✅ API endpoint'e POST request gönderme
3. ✅ Başarı/hata logları

### API Endpoint'leri:
- Monthly: `POST https://kreditakip.com.tr/api/email/monthly-summary`
- Weekly: `POST https://kreditakip.com.tr/api/email/weekly-summary`

### Authorization:
Her istek `Authorization: Bearer ${CRON_SECRET}` header'ı ile korunur.

## Kullanıcı Ayarları

Kullanıcılar bu e-postaları **Ayarlar** sayfasından açıp kapatabilir:
- **Aylık Ödeme Özeti** switch (`email_monthly_summary`)
- **Haftalık Ödeme Hatırlatıcısı** switch (`email_weekly_summary`)

## Troubleshooting

### Workflow Çalışmıyor
- **Actions** sekmesinden workflow log'larını kontrol edin
- `CRON_SECRET` değerinin hem GitHub hem Vercel'de aynı olduğundan emin olun
- API endpoint'in erişilebilir olduğunu kontrol edin

### E-postalar Gönderilmiyor
- API endpoint'i manuel test edin:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer YOUR_CRON_SECRET" \
    https://kreditakip.com.tr/api/email/monthly-summary
  ```
- Supabase'de `email_monthly_summary` veya `email_weekly_summary` field'larını kontrol edin
- Email service (Resend) API key'inin doğru olduğundan emin olun

## Maliyet

GitHub Actions ücretsiz tier:
- **2,000 dakika/ay** (Public repositories için sınırsız)
- Her workflow çalıştırması ~1 dakika sürer
- Monthly: 12 çalıştırma/yıl
- Weekly: 52 çalıştırma/yıl
- **Toplam:** ~64 dakika/yıl (Tamamen ücretsiz!)

## Güvenlik

- ✅ CRON_SECRET ile korunan endpoint'ler
- ✅ Sadece authenticated requests kabul edilir
- ✅ Secret'lar GitHub Secrets ile saklanır
- ✅ Workflow log'larında secret'lar maskelenir
