# GitHub Actions Cron Jobs

Bu klasörde PayTR abonelik yönetimi için otomatik cron job'lar bulunur.

## 🤖 Aktif Cron Job'lar

### 1. Subscription Expiry Check
- **Dosya**: `cron-subscription-expiry.yml`
- **Çalışma Zamanı**: Her gün saat 02:00 UTC (Türkiye: 05:00)
- **Görev**: Süresi dolan abonelikleri free plana düşürür

### 2. Subscription Reminder
- **Dosya**: `cron-subscription-reminder.yml`
- **Çalışma Zamanı**: Her gün saat 09:00 UTC (Türkiye: 12:00)
- **Görev**:
  - 7 gün kala hatırlatma gönderir
  - 3 gün kala hatırlatma gönderir
  - 1 gün kala hatırlatma gönderir

## 🔐 GitHub Secrets Kurulumu

GitHub Actions'ın çalışması için aşağıdaki secret'ları eklemeniz gerekiyor:

### Adım 1: GitHub Repository'ye Git
1. GitHub'da repository sayfasını açın
2. **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret** butonuna tıklayın

### Adım 2: Secret'ları Ekleyin

#### 1️⃣ CRON_SECRET
- **Name**: CRON_SECRET
- **Value**: .env.local dosyanızdaki CRON_SECRET değeri

#### 2️⃣ APP_URL
- **Name**: APP_URL
- **Value**: Production URL'iniz
- **Örnek**: https://www.kreditakip.com.tr

## 🧪 Manuel Test

Workflow'ları manuel olarak test edebilirsiniz:

### GitHub Web Arayüzünden:
1. **Actions** sekmesine gidin
2. Sol taraftan workflow seçin
3. **Run workflow** butonuna tıklayın

## ⚠️ Önemli Notlar

1. **CRON_SECRET**: Her iki workflow da bu secret'ı kullanır
2. **APP_URL**: Production URL olmalı (localhost değil)
3. **Logs**: Actions sekmesinden her çalışmanın logunu görebilirsiniz
