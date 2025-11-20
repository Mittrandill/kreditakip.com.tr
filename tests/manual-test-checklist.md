# Manual Test Checklist - Güvenlik İyileştirmeleri

Bu checklist, güvenlik iyileştirmelerinin doğru çalıştığını test etmek için kullanılır.

## ✅ 1. Rate Limiting Testleri

### 1.1 OCR Rate Limiting (10 req/hour)
**Endpoint:** `POST /api/analyze-pdf`

**Test Adımları:**
1. Giriş yapın
2. Kredi ekle sayfasına gidin ve PDF yükleyin
3. 10 kez ardı ardına PDF analizi yapın
4. 11. denemede `429 Too Many Requests` hatası almalısınız

**Beklenen Yanıt (11. deneme):**
```json
{
  "error": "Çok fazla analiz talebi. Lütfen 1 saat sonra tekrar deneyin.",
  "retryAfter": 3600
}
```

**Headers:**
```
Status: 429
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 3600
Retry-After: 3600
```

---

### 1.2 Risk Analizi Rate Limiting (10 req/hour)
**Endpoint:** `POST /api/risk-analysis`

**Test Adımları:**
1. `/uygulama/risk-analizi` sayfasına gidin
2. "Kapsamlı Analizi Başlat" butonuna 10 kez tıklayın
3. 11. denemede rate limit hatası almalısınız

**Beklenen Yanıt (11. deneme):**
```json
{
  "error": "Çok fazla risk analizi talebi. Lütfen 1 saat sonra tekrar deneyin.",
  "retryAfter": 3600
}
```

---

## ✅ 2. KVKK Endpoint Testleri

### 2.1 Veri İndirme (KVKK m.11)
**Endpoint:** `GET /api/user/export-data`

**Test Adımları:**
1. Giriş yapın
2. Tarayıcıda şu URL'yi açın: `http://localhost:3000/api/user/export-data`
3. Veya Postman/curl ile:
```bash
curl -X GET http://localhost:3000/api/user/export-data \
  -H "Cookie: your-session-cookie"
```

**Beklenen Sonuç:**
- ✅ JSON dosyası indirilmeli
- ✅ Dosya adı: `kreditakip-verilerim-YYYY-MM-DD.json`
- ✅ İçerik şunları içermeli:
  - `exportInfo` (export tarihi, KVKK maddesi)
  - `personalData` (kullanıcı bilgileri)
  - `financialData` (krediler, banka hesapları)
  - `transactionData` (ödemeler, abonelikler)
  - `analysisData` (risk analizleri)
  - `usageData` (kullanım takibi)
  - `metadata` (toplam kayıt sayıları)

**Örnek JSON Yapısı:**
```json
{
  "exportInfo": {
    "exportDate": "2025-11-20T...",
    "exportedBy": "user@example.com",
    "dataProtectionRight": "KVKK Madde 11(d) - Kişisel verilerin bir kopyasını talep etme hakkı",
    "format": "JSON"
  },
  "personalData": {
    "userId": "...",
    "email": "user@example.com",
    "profile": {...}
  },
  "financialData": {
    "credits": [...],
    "bankAccounts": [...]
  },
  "metadata": {
    "totalRecords": {
      "credits": 5,
      "payments": 2,
      ...
    }
  }
}
```

---

### 2.2 Hesap Silme (KVKK m.7)
**Endpoint:** `DELETE /api/user/delete-account`

**⚠️ DİKKAT:** Bu test geri döndürülemez! Test hesabı kullanın.

**Test Adımları:**
1. **Test hesabı** ile giriş yapın (gerçek hesap kullanmayın!)
2. Postman/curl ile:
```bash
curl -X DELETE http://localhost:3000/api/user/delete-account \
  -H "Cookie: your-session-cookie"
```

**Beklenen Sonuç:**
```json
{
  "success": true,
  "message": "Hesabınız ve tüm verileriniz kalıcı olarak silindi (KVKK m.7)"
}
```

**Doğrulama (Supabase Dashboard):**
1. `profiles` tablosunda kullanıcı kaydı YOK olmalı
2. `credits` tablosunda kullanıcıya ait kayıt YOK olmalı
3. `payments` tablosunda kullanıcıya ait kayıt YOK olmalı
4. `subscriptions` tablosunda kullanıcıya ait kayıt YOK olmalı
5. Auth'da kullanıcı silindi olmalı

---

## ✅ 3. Finansal Danışmanlık Uyarısı Testleri

### 3.1 Risk Analizi Liste Sayfası
**Sayfa:** `/uygulama/risk-analizi`

**Test Adımları:**
1. Giriş yapın
2. Risk analizi sayfasına gidin
3. Sayfanın üst kısmında sarı uyarı banner'ı görmeli

**Beklenen Görünüm:**
```
⚠️ Finansal Danışmanlık Değildir
Bu analiz otomatik AI tarafından üretilmiştir ve finansal tavsiye
niteliği taşımaz. Önemli kararlar almadan önce lisanslı bir
finansal danışmana danışın.
```

**Kontrol Noktaları:**
- ✅ Banner sarı renkte (bg-yellow-500/10)
- ✅ AlertTriangle ikonu var
- ✅ Başlık kalın yazı
- ✅ Açıklama metni okunabilir

---

### 3.2 Risk Analizi Detay Sayfası
**Sayfa:** `/uygulama/risk-analizi/[id]`

**Test Adımları:**
1. Herhangi bir risk analizine tıklayın
2. Detay sayfasında üst kısımda aynı uyarı banner'ını görmeli

---

### 3.3 Kullanım Şartları
**Sayfa:** `/kullanim-sartlari`

**Test Adımları:**
1. Kullanım şartları sayfasına gidin
2. "2.1. Finansal Danışmanlık Feragatnamesi" bölümünü bulun

**Beklenen İçerik:**
```
⚠️ ÖNEMLİ UYARI: BU BİR FİNANSAL DANIŞMANLIK HİZMETİ DEĞİLDİR

Kredi Takip, SPK (Sermaye Piyasası Kurulu) lisanslı bir yatırım
danışmanlığı firması DEĞİLDİR. Uygulamamızda sunulan:

• AI Finansal Sağlık Özeti
• Risk Analizi Raporları
• Ödeme Planı Optimizasyonları

YALNIZCA BİLGİLENDİRME AMAÇLIDIR ve yatırım tavsiyesi
niteliği taşımaz.

SPK Lisans Durumu: Yok | BDDK Lisans Durumu: Yok
```

**Kontrol Noktaları:**
- ✅ Kırmızı arka plan (bg-red-500/10)
- ✅ Kırmızı border
- ✅ Kalın başlık
- ✅ 3 madde liste halinde
- ✅ Lisans durumu belirtilmiş

---

## ✅ 4. Pre-commit Hook Testi

### Test 1: .env.local Commit Engelleme
```bash
# 1. Sahte .env.local oluştur
echo "TEST_KEY=test123" > .env.local

# 2. Stage et
git add .env.local

# 3. Commit dene (BAŞARISIZ olmalı)
git commit -m "test"

# Beklenen Çıktı:
# ❌ ERROR: Sensitive environment file detected!
# You attempted to commit:
# .env.local
```

### Test 2: API Key Detection
```bash
# 1. Sahte API key içeren dosya oluştur
echo "const API_KEY = 'fake_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'" > test.js

# 2. Stage et
git add test.js

# 3. Commit dene (UYARI almalısınız)
git commit -m "test"

# Beklenen Çıktı:
# ⚠️  WARNING: Potential API key or secret detected!
# Do you want to continue anyway? (yes/no):
```

### Temizlik
```bash
# Test dosyalarını sil
git reset HEAD test.js .env.local
rm test.js .env.local
```

---

## ✅ 5. PCI-DSS Uyumluluk Testi

### Test: Deprecated Endpoint'lerin Silindiğini Doğrula

**Şu endpoint'ler ARTıK MEVCUT OLMAMALI (404 dönmeli):**
```bash
# 1. Direct payment endpoint (DEPRECATED)
curl -X POST http://localhost:3000/api/payment/create
# Beklenen: 404 Not Found

# 2. Old initialize endpoint (DEPRECATED)
curl -X POST http://localhost:3000/api/payment/initialize
# Beklenen: 404 Not Found

# 3. Old process endpoint (DEPRECATED)
curl -X POST http://localhost:3000/api/payment/process
# Beklenen: 404 Not Found

# 4. Old callback endpoint (DEPRECATED)
curl -X POST http://localhost:3000/api/payment/callback
# Beklenen: 404 Not Found
```

**Şu endpoint ÇALIŞMALI (PCI-DSS uyumlu):**
```bash
# Güvenli checkout endpoint (ÇALIŞMALI)
curl -X POST http://localhost:3000/api/payment/checkout/initialize
# Beklenen: 401 Unauthorized (auth gerekli) veya 400 Bad Request (parametreler eksik)
```

---

## 🔍 Ek Kontroller

### Console'da Hata Kontrolü
1. Browser DevTools Console'u açın
2. Hiçbir sayfada JavaScript hatası OLMAMALI
3. API anahtarı GÖRÜNMEMELI

### Network Tab Kontrolü
1. DevTools Network sekmesini açın
2. API isteklerine bakın
3. Kart bilgileri plain text OLARAK GÖNDERİLMEMELİ (sadece token/checkout URL olmalı)

---

## 📋 Test Raporu Şablonu

Test tamamlandığında şu tabloyu doldurun:

| Test | Durum | Notlar |
|------|-------|--------|
| OCR Rate Limiting | ⬜ Pass / ❌ Fail | |
| Risk Analizi Rate Limiting | ⬜ Pass / ❌ Fail | |
| Veri İndirme API | ⬜ Pass / ❌ Fail | |
| Hesap Silme API | ⬜ Pass / ❌ Fail | |
| Risk Analizi Uyarı Banner | ⬜ Pass / ❌ Fail | |
| Kullanım Şartları Feragatname | ⬜ Pass / ❌ Fail | |
| Pre-commit Hook (.env) | ⬜ Pass / ❌ Fail | |
| Pre-commit Hook (API key) | ⬜ Pass / ❌ Fail | |
| Deprecated Endpoints 404 | ⬜ Pass / ❌ Fail | |

---

**Test Tarihi:** _______________
**Test Eden:** _______________
**Ortam:** ⬜ Development / ⬜ Staging / ⬜ Production
