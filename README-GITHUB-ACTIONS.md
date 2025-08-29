# GitHub Actions Cron Job Kurulumu

Bu proje artık Vercel cron job yerine GitHub Actions kullanarak ücretsiz olarak zamanlanmış görevleri çalıştırıyor.

## Kurulum Adımları

### 1. GitHub Repository Secret'ı Ekleyin

GitHub repository'nizde **Settings > Secrets and variables > Actions** bölümüne gidin ve şu secret'ı ekleyin:

- **Name**: `CRON_SECRET`
- **Value**: Vercel projenizde tanımlı olan `CRON_SECRET` environment variable'ının değeri

### 2. Workflow'u Test Edin

- GitHub repository'nizde **Actions** sekmesine gidin
- "Send Payment Notifications" workflow'unu bulun
- **Run workflow** butonuna tıklayarak manuel test yapın

### 3. Çalışma Zamanları

Workflow günde 2 kez çalışır:
- **09:00 UTC** (Türkiye saati 12:00)
- **18:00 UTC** (Türkiye saati 21:00)

### 4. Monitoring

- GitHub Actions sekmesinden workflow çalışma geçmişini görebilirsiniz
- Her çalışmada kaç e-posta gönderildiği loglanır
- Hata durumunda workflow fail olur ve bildirim alırsınız

## Avantajlar

✅ **Ücretsiz**: GitHub Actions 2000 dakika/ay ücretsiz  
✅ **Güvenilir**: GitHub'ın altyapısı üzerinde çalışır  
✅ **Monitoring**: Detaylı loglar ve hata bildirimleri  
✅ **Flexible**: Manuel tetikleme ve kolay değişiklik imkanı
