# 🔒 Güvenlik İyileştirmeleri - Kasım 2025

Bu döküman, kreditakip.com.tr projesinde yapılan kritik güvenlik iyileştirmelerini detaylandırır.

## 📋 İçindekiler
- [Özet](#özet)
- [Kritik Düzeltmeler](#kritik-düzeltmeler)
- [Yasal Uyumluluk](#yasal-uyumluluk)
- [Teknik İyileştirmeler](#teknik-iyileştirmeler)
- [Test Talimatları](#test-talimatları)
- [Deployment Checklist](#deployment-checklist)

---

## Özet

**Tarih:** 20 Kasım 2025
**Toplam Değişiklik:** 23 dosya, +309 satır ekleme, -583 satır silme
**Kritik Seviye:** 🔴 YÜKSEK (PCI-DSS ihlali düzeltildi)

### Düzeltilen Güvenlik Açıkları

| # | Kategori | Seviye | Durum |
|---|----------|--------|-------|
| 1 | PCI-DSS İhlali | 🔴 Kritik | ✅ Düzeltildi |
| 2 | Sahte Sertifika İddiaları | 🟡 Yüksek | ✅ Düzeltildi |
| 3 | Rate Limiting Eksikliği | 🟡 Yüksek | ✅ Düzeltildi |
| 4 | KVKK Uyumsuzluğu | 🟡 Yüksek | ✅ Düzeltildi |
| 5 | SPK Uyumsuzluğu | 🟡 Orta | ✅ Düzeltildi |
| 6 | API Anahtarı Güvenliği | 🟢 Düşük | ✅ İyileştirildi |

---

## Kritik Düzeltmeler

### 1. PCI-DSS İhlali - Kart Bilgileri İşleme (🔴 KRİTİK)

**Sorun:**
4 endpoint kredi kartı bilgilerini plain text olarak backend'e alıyordu. Bu PCI-DSS Requirement 3.2 ve 4.1'i ihlal ediyordu.

**Etkilenen Endpoint'ler (SİLİNDİ):**
- `POST /api/payment/create` - Kart bilgilerini backend'e gönderiyordu
- `POST /api/payment/initialize` - Deprecated
- `POST /api/payment/process` - Deprecated
- `POST /api/payment/callback` - Deprecated

**Çözüm:**
- ✅ 4 endpoint tamamen silindi (-562 satır)
- ✅ Sadece PCI-DSS uyumlu checkout flow kullanılıyor
- ✅ Kart bilgileri artık hiç backend'e gelmiyor
- ✅ İyzico'nun hosted payment form'u kullanılıyor

**Güvenli Endpoint:**
```typescript
POST /api/payment/checkout/initialize
// Kart bilgileri İyzico'da kalır, sadece token döner
```

**Dosyalar:**
- ❌ Silindi: `app/api/payment/create/route.ts`
- ❌ Silindi: `app/api/payment/initialize/route.ts`
- ❌ Silindi: `app/api/payment/process/route.ts`
- ❌ Silindi: `app/api/payment/callback/route.ts`
- ✅ Kullanılıyor: `app/api/payment/checkout/initialize/route.ts`

**Test:**
```bash
# Bu endpoint'ler artık 404 dönmeli
curl -X POST http://localhost:3000/api/payment/create
curl -X POST http://localhost:3000/api/payment/initialize
```

---

### 2. Sahte Sertifika İddiaları (🟡 YÜKSEK - Yasal Risk)

**Sorun:**
Uygulama sahip olmadığı sertifikaları iddia ediyordu:
- ISO 27001 ❌ (yok)
- SOC 2 Type II ❌ (yok)
- PCI DSS ❌ (yok)

Bu 6502 sayılı TKHK (Tüketicinin Korunması Hakkında Kanun) ihlali - yanıltıcı reklam.

**Düzeltilen Dosyalar:**
- `app/guvenlik/page.tsx:55-76`

**Önce (YANLIŞ):**
```typescript
const certifications = [
  { title: "ISO 27001", description: "Bilgi Güvenliği..." }, // ❌ YOK
  { title: "SOC 2 Type II", description: "Güvenlik..." },    // ❌ YOK
  { title: "PCI DSS", description: "Ödeme Kartı..." },       // ❌ YOK
]
```

**Sonra (DOĞRU):**
```typescript
const certifications = [
  { title: "KVKK Uyumlu", description: "6698 sayılı kanuna tam uyum" },        // ✅ GERÇEK
  { title: "Supabase Altyapısı", description: "SOC 2 Type 2 sertifikalı..." }, // ✅ DOĞRU
  { title: "Güvenli Ödeme", description: "İyzico PCI-DSS sertifikalı..." },   // ✅ DOĞRU
  { title: "SSL/TLS Şifreleme", description: "TLS 1.3..." },                  // ✅ GERÇEK
]
```

**Yanıltıcı Terimler Değiştirildi:**
- ❌ "Bankacılık seviyesi güvenlik" → ✅ "Endüstri standardı güvenlik"
- ❌ "Bankacılık seviyesi şifreleme" → ✅ "AES-256 şifreleme"
- ❌ "Bank-level SSL" → ✅ "TLS 1.3 ve AES-256"

**Değiştirilen Dosyalar:**
- `app/page.tsx:238`
- `app/guvenlik/page.tsx:26, 122, 330`
- `app/ozellikler/page.tsx:550, 563`

---

## Yasal Uyumluluk

### 3. KVKK Uyumluluğu (6698 Sayılı Kanun)

#### 3.1. Veri İndirme Hakkı (KVKK m.11/d)

**Eksiklik:**
Kullanıcılar verilerinin bir kopyasını talep edemiyordu.

**Çözüm:**
Yeni endpoint eklendi: `GET /api/user/export-data`

**Özellikler:**
- ✅ Tüm kullanıcı verileri JSON formatında
- ✅ KVKK madde referansı içerir
- ✅ İndirilebilir dosya (`kreditakip-verilerim-YYYY-MM-DD.json`)

**Dahil Edilen Veriler:**
```json
{
  "exportInfo": {
    "exportDate": "2025-11-20T...",
    "dataProtectionRight": "KVKK Madde 11(d)",
    "format": "JSON"
  },
  "personalData": { "userId", "email", "profile" },
  "financialData": { "credits", "bankAccounts", "financialProfiles" },
  "transactionData": { "payments", "subscriptions" },
  "analysisData": { "riskAnalyses" },
  "usageData": { "tracking" },
  "metadata": { "totalRecords": {...} }
}
```

**Dosya:** `app/api/user/export-data/route.ts` (YENİ)

---

#### 3.2. Hesap Silme Hakkı (KVKK m.7)

**İyileştirme:**
Mevcut hesap silme fonksiyonu genişletildi.

**Yeni Endpoint:** `DELETE /api/user/delete-account`

**Silinen Veriler:**
- ✅ `credits` - Tüm kredi kayıtları
- ✅ `bank_accounts` - Banka hesapları
- ✅ `payments` - Ödeme kayıtları
- ✅ `payment_transactions` - İşlem kayıtları
- ✅ `pending_payments` - Bekleyen ödemeler
- ✅ `subscriptions` - Abonelikler
- ✅ `risk_analyses` - Risk analizleri
- ✅ `financial_profiles` - Finansal profiller
- ✅ `usage_tracking` - Kullanım takibi
- ✅ `billing_info` - Fatura bilgileri
- ✅ `profiles` - Kullanıcı profili
- ✅ Supabase Auth - Kimlik doğrulama

**Dosya:** `app/api/user/delete-account/route.ts` (YENİ)

---

### 4. SPK Uyumluluğu - Finansal Danışmanlık Feragatnamesi

**Sorun:**
Uygulama SPK lisansı olmadan "finansal sağlık analizi" ve "refinansman önerileri" sunuyordu. Bu yatırım tavsiyesi olarak yorumlanabilir.

**Çözüm:**

#### 4.1. Kullanım Şartlarına Feragatname Eklendi

**Dosya:** `app/kullanim-sartlari/page.tsx`
**Yeni Bölüm:** "2.1. Finansal Danışmanlık Feragatnamesi"

**İçerik:**
```
⚠️ ÖNEMLİ UYARI: BU BİR FİNANSAL DANIŞMANLIK HİZMETİ DEĞİLDİR

Kredi Takip, SPK (Sermaye Piyasası Kurulu) lisanslı bir yatırım
danışmanlığı firması DEĞİLDİR.

Uygulamamızda sunulan:
• AI Finansal Sağlık Özeti
• Risk Analizi Raporları
• Refinansman Önerileri
• Ödeme Planı Optimizasyonları

YALNIZCA BİLGİLENDİRME AMAÇLIDIR ve yatırım tavsiyesi
niteliği taşımaz.

SPK Lisans Durumu: Yok | BDDK Lisans Durumu: Yok
```

#### 4.2. Risk Analizi Sayfalarına Uyarı Banner'ı Eklendi

**Dosyalar:**
- `app/uygulama/risk-analizi/page.tsx` (Liste sayfası)
- `app/uygulama/risk-analizi/[id]/page.tsx` (Detay sayfası)

**Banner:**
```tsx
<Alert className="bg-yellow-500/10 border-yellow-500/30">
  <AlertTriangle className="h-4 w-4 text-yellow-500" />
  <AlertTitle>Finansal Danışmanlık Değildir</AlertTitle>
  <AlertDescription>
    Bu analiz otomatik AI tarafından üretilmiştir ve finansal tavsiye
    niteliği taşımaz. Önemli kararlar almadan önce lisanslı bir
    finansal danışmana danışın.
  </AlertDescription>
</Alert>
```

---

## Teknik İyileştirmeler

### 5. Rate Limiting (DDoS & Maliyet Koruması)

**Sorun:**
Pahalı API endpoint'leri (OCR, AI analiz) sınırsız istek kabul ediyordu.

**Risk:**
- Kötüye kullanım → yüksek Gemini API maliyeti
- Brute-force saldırıları
- DDoS saldırıları

**Çözüm:**
3 kritik endpoint'e rate limiting eklendi.

#### 5.1. OCR Endpoint
**Dosya:** `app/api/analyze-pdf/route.ts`
**Limit:** 10 request / saat (per user)

```typescript
const rateLimitResult = rateLimit({
  identifier: `ocr:${user.id}`,
  ...RateLimits.EXPENSIVE // 10 req/hour
})

if (!rateLimitResult.success) {
  return Response.json(
    { error: "Çok fazla analiz talebi. Lütfen 1 saat sonra tekrar deneyin." },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '3600',
        'Retry-After': '3600'
      }
    }
  )
}
```

#### 5.2. Risk Analizi Endpoint
**Dosya:** `app/api/risk-analysis/route.ts`
**Limit:** 10 request / saat (per user)

#### 5.3. Refinansman Analizi Endpoint
**Dosya:** `app/api/refinancing-analysis/route.ts`
**Limit:** 10 request / saat (per user)

**Rate Limit Konfigürasyonu:**
```typescript
// lib/rate-limit.ts
export const RateLimits = {
  EXPENSIVE: {
    limit: 10,
    windowSeconds: 60 * 60 // 1 saat
  }
}
```

---

### 6. Pre-commit Hook (API Anahtarı Koruma)

**Sorun:**
.env.local veya API anahtarları yanlışlıkla commit edilebilir.

**Çözüm:**
Husky pre-commit hook eklendi.

**Dosya:** `.husky/pre-commit`

**Özellikler:**
1. ✅ .env.local commit edilmesini engeller
2. ✅ Potansiyel API anahtarlarını tespit eder
3. ✅ Kullanıcıya uyarı gösterir
4. ✅ Onay ister (bypass mümkün)

**Test:**
```bash
# .env.local commit deneyin
echo "TEST=123" > .env.local
git add .env.local
git commit -m "test"
# ❌ ERROR: Sensitive environment file detected!
```

**Kurulum:**
```bash
npm install -D husky
npx husky init
# Pre-commit hook otomatik oluşturuldu
```

---

### 7. Webhook Idempotency Constraint

**Sorun:**
Aynı webhook event birden fazla işlenirse çift ücretlendirme olabilir.

**Çözüm:**
Database constraint eklendi.

**Migration:** `database-scripts/migrations/002_webhook_idempotency.sql`

```sql
ALTER TABLE webhook_logs
ADD CONSTRAINT unique_webhook_event
UNIQUE (subscription_reference, event_type);
```

**Özellikler:**
- ✅ Idempotent migration (tekrar çalıştırılabilir)
- ✅ Unique constraint: `(subscription_reference, event_type)`
- ✅ Index eklendi: `idx_webhook_logs_lookup`

**Çalıştırma:**
```bash
# Supabase Dashboard > SQL Editor
# Dosya içeriğini kopyala-yapıştır ve "Run"
```

---

## Test Talimatları

Detaylı test talimatları için: [`tests/manual-test-checklist.md`](tests/manual-test-checklist.md)

### Hızlı Test Listesi

- [ ] **Rate Limiting:** 11. OCR isteğinde 429 hatası
- [ ] **Veri İndirme:** `/api/user/export-data` JSON indiriyor
- [ ] **Hesap Silme:** `/api/user/delete-account` tüm verileri siliyor
- [ ] **Uyarı Banner:** Risk analizi sayfasında sarı uyarı görünüyor
- [ ] **Feragatname:** Kullanım şartlarında bölüm 2.1 mevcut
- [ ] **Pre-commit:** .env.local commit engellenmiş
- [ ] **PCI-DSS:** Eski payment endpoint'leri 404 dönüyor

---

## Deployment Checklist

### Acil (Deployment Öncesi)

- [ ] **API Anahtarlarını Rotate Et** (eğer .env.local hiç git'e eklendiyse)
  - [ ] Gemini API key
  - [ ] Mailjet/MailerSend/Resend keys
  - [ ] İyzico secret key
  - [ ] Supabase SERVICE_ROLE_KEY

- [ ] **Environment Variables Kontrol**
  - [ ] Vercel/Production'da tüm .env değişkenleri tanımlı mı?
  - [ ] Production API anahtarları test key'leri değil mi?

- [ ] **Database Migration Çalıştır**
  ```sql
  -- Supabase Dashboard > SQL Editor
  -- 002_webhook_idempotency.sql dosyasını çalıştır
  ```

- [ ] **Build Testi**
  ```bash
  npm run build
  # Hata olmamalı
  ```

### Deployment Sonrası

- [ ] **Rate Limiting Test** (Production'da)
  - [ ] 11. OCR isteğinde 429 dönüyor mu?

- [ ] **KVKK Endpoint Test**
  - [ ] `/api/user/export-data` çalışıyor mu?
  - [ ] `/api/user/delete-account` çalışıyor mu?

- [ ] **UI Test**
  - [ ] Risk analizi sayfasında uyarı banner var mı?
  - [ ] Kullanım şartlarında feragatname var mı?

- [ ] **Security Headers**
  - [ ] HTTPS aktif mi?
  - [ ] CSP headers doğru mu?

- [ ] **Monitoring**
  - [ ] Vercel Analytics çalışıyor mu?
  - [ ] Error tracking aktif mi?

---

## İletişim

**Güvenlik Sorunları:**
Yeni güvenlik açığı tespit ederseniz: `security@kreditakip.com.tr`

**Döküman Güncellemeleri:**
Bu döküman güvenlik iyileştirmeleri yapıldıkça güncellenmelidir.

---

**Son Güncelleme:** 20 Kasım 2025
**Versiyon:** 1.0
**Sonraki Review:** 20 Aralık 2025
