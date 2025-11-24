# PayTR Non3D ve Recurring Payment Stratejisi

## PayTR'den Gelen Bilgiler

### Önemli Noktalar
1. ✅ Direkt API + Non3D yetkisi ile kart saklama sağlanıyor
2. ⚠️ Otomatik çekim sistemi YOK - biz manuel istek göndereceğiz (cron job ile)
3. ⚠️ Non3D yetkisi için PayTR onayı gerekiyor
4. ⚠️ 3D Secure olmadan ödeme almak riskli:
   - Kartın izinsiz kullanımında ispat yükümlülüğü
   - Chargeback durumlarında sorumluluk
   - "Ben yapmadım" itirazlarında ispat sorumluluğu

## Mevcut Sistemimiz

### Yapı
```
İlk Ödeme (signup)
  ↓ (3D Secure ile güvenli)
Kart Saklanıyor (CAPI)
  ↓
Cron Job (her gün 09:00)
  ↓
Süre dolmak üzere olan abonelikler
  ↓
Recurring Payment (Non3D)
  ↓
Abonelik yenileniyor
```

### Güvenlik Önlemleri

#### 1. Kullanıcı Onayı (Kritik)
- [x] İlk ödemede "Kartımı sakla" checkbox (mandatory)
- [x] Kullanıcı onayı kaydediliyor
- [ ] **EKLENMELİ:** "Otomatik yenileme" onayı ayrı bir checkbox
- [ ] **EKLENMELİ:** Kullanıcı sözleşmesi (Terms of Service)

#### 2. İspat Belgeleri
Chargeback durumlarında kullanmak için:

**Kaydetmemiz gerekenler:**
- [x] İlk ödeme 3D Secure logları (PayTR'de mevcut)
- [x] Kullanıcı onay tarihi (created_at)
- [x] Kart saklama onayı (storeCard flag)
- [ ] **EKLENMELİ:** IP adresi (her ödeme için)
- [ ] **EKLENMELİ:** Browser fingerprint
- [ ] **EKLENMELİ:** Cihaz bilgisi
- [ ] **EKLENMELİ:** Kullanıcı aktivite logları

#### 3. Bildirim Sistemi
- [x] Yenileme öncesi email (3 gün önceden)
- [x] Başarılı ödeme bildirimi
- [x] Başarısız ödeme bildirimi
- [ ] **EKLENMELİ:** SMS bildirimi (opsiyonel)
- [ ] **EKLENMELİ:** In-app bildirim

## Önerilen Yaklaşımlar

### Yaklaşım 1: Hibrit Model (ÖNERİLEN) ✅

**İlk Ödeme:** 3D Secure (güvenli)
**Yenileme:** Non3D (otomatik) + Kullanıcı onayı

**Avantajlar:**
- İlk ödeme güvenli (3D Secure)
- Kullanıcı deneyimi iyi (otomatik yenileme)
- Yasal açıdan güçlü (açık onay var)

**Riskler:**
- Recurring ödemeler Non3D (chargeback riski)
- İspat yükümlülüğü

**Risk Azaltma:**
1. Açık kullanıcı onayı al
2. Her işlem için log tut
3. Email/SMS bildirim gönder
4. İlk 3 ay için fraud monitoring

**Kod değişiklikleri:**

```typescript
// 1. Ödeme formuna ek onay ekle
interface PaymentConsent {
  storeCard: boolean
  autoRenewal: boolean // YENİ
  termsAccepted: boolean // YENİ
  timestamp: string
  ipAddress: string // YENİ
  userAgent: string // YENİ
}

// 2. Recurring payment öncesi kullanıcıya email gönder
async function sendRenewalNotice(userId: string, daysUntilRenewal: number) {
  // 3 gün önceden "X gün sonra kartınızdan Y TL çekilecek" bildirimi
  // Kullanıcı isterse iptal edebilir
}

// 3. Fraud detection
async function checkFraudRisk(payment: RecurringPayment): Promise<boolean> {
  // - Ödeme geçmişi kontrol et
  // - Şüpheli aktivite var mı?
  // - Kullanıcı hesabı aktif mi?
  // - Son girişi ne zaman?
  return isLowRisk
}
```

### Yaklaşım 2: Her Yenileme İçin 3D Secure (ULTRA GÜVENLİ) 🔒

**Tüm ödemeler:** 3D Secure

**Avantajlar:**
- Hiç chargeback riski yok
- İspat sorumluluğu yok
- Yasal açıdan en güvenli

**Dezavantajlar:**
- ❌ Otomatik yenileme YOK
- ❌ Kullanıcı her seferinde kart bilgisi girmeli
- ❌ Kullanıcı deneyimi kötü
- ❌ Yenileme oranları düşük olabilir

**Kullanım senaryosu:**
```
Abonelik dolmadan 7 gün önce:
  ↓
Email: "Aboneliğinizi yenilemek için tıklayın"
  ↓
Kullanıcı ödeme sayfasına gider
  ↓
3D Secure ile ödeme yapar
  ↓
Abonelik yenilenir
```

### Yaklaşım 3: Manuel Onay Sistemi (ORTA YOL) ⚖️

**İlk ödeme:** 3D Secure
**Yenileme isteği:** Email/SMS ile link gönder
**Kullanıcı onayı:** Link'e tıklarsa Non3D ödeme al

**Avantajlar:**
- Her yenileme için açık onay
- İspat daha kolay
- Chargeback riski düşük

**Dezavantajlar:**
- Tam otomatik değil
- Kullanıcı aksiyonu gerekli
- Email açma oranına bağlı

## Risk Değerlendirmesi

### Chargeback Riski Yüksek Olan Durumlar
1. 🔴 Yüksek tutarlar (>500 TL)
2. 🔴 Yeni müşteriler (< 3 ay)
3. 🔴 Sık şikayet alan kullanıcılar
4. 🔴 Anormal kullanım paterni

### Düşük Risk Profili
1. 🟢 Düzenli ödeyen müşteriler (> 6 ay)
2. 🟢 Aktif kullanıcılar (son 7 gün içinde giriş)
3. 🟢 Düşük tutarlar (< 200 TL)
4. 🟢 Referans ile gelen müşteriler

## Önerilen Aksiyon Planı

### Kısa Vadede (1-2 Hafta)
1. [ ] PayTR'den Non3D yetkisi talep et
2. [ ] Kullanıcı sözleşmesi hazırla (avukat ile)
3. [ ] Otomatik yenileme onay checkbox'ı ekle
4. [ ] IP adresi ve device tracking ekle
5. [ ] Fraud detection sistemi kur

### Orta Vadede (1 Ay)
1. [ ] Email/SMS bildirim sistemini güçlendir
2. [ ] Chargeback yönetim süreci oluştur
3. [ ] İspat belgeleri arşivleme sistemi
4. [ ] Risk skorlama algoritması

### Uzun Vadede (3 Ay)
1. [ ] Machine learning fraud detection
2. [ ] Alternatif ödeme yöntemleri (eft, banka kartı)
3. [ ] Yıllık ödeme indirimi (chargeback riskini azaltır)

## Yasal Koruma İçin Yapılacaklar

### 1. Kullanıcı Sözleşmesi
```
Otomatik Yenileme Koşulları:

- Aboneliğiniz otomatik olarak yenilenecektir
- Kayıtlı kartınızdan [TUTAR] TL çekilecektir
- 3 gün önceden email bildirimi gönderilecektir
- İstediğiniz zaman iptal edebilirsiniz
- İlk ödeme 3D Secure ile güvenli yapılmıştır
- Recurring ödemeler Non3D (güvenli olmayan) yöntemle yapılacaktır
- Kartınızın izinsiz kullanımı durumunda ispat yükümlülüğü size aittir
```

### 2. Email Onay Trail
Her adımda email gönder ve kaydet:
1. Kayıt olurken
2. İlk ödeme sonrası (kart saklama onayı)
3. Her yenilemeden 3 gün önce
4. Yenileme sonrası
5. İptal işlemi sonrası

### 3. Monitoring ve Alerting
```typescript
// Şüpheli durumları tespit et
const alerts = [
  'Kullanıcı son 30 gündür giriş yapmadı ama ödemesi alındı',
  'Aynı karttan farklı hesaplara ödeme',
  'Kullanıcı destek ekibiyle itiraz konusunda konuştu',
  'Kartın sahibi adı ile kullanıcı adı farklı',
]
```

## Sonuç ve Öneri

**ÖNERIM: Yaklaşım 1 (Hibrit Model) + Güçlü Risk Yönetimi**

**Neden?**
1. ✅ Kullanıcı deneyimi iyi (otomatik yenileme)
2. ✅ Yasal açıdan makul (açık onay var)
3. ✅ Chargeback riski yönetilebilir
4. ✅ PayTR'nin önerdiği model bu

**Kritik Şartlar:**
- PayTR Non3D yetkisi onayı alınmalı
- Kullanıcı sözleşmesi hazırlanmalı
- Fraud detection sistemi kurulmalı
- Her işlem için detaylı log tutulmalı

**Alternatif:**
Eğer chargeback riskinden endişe ediliyorsa, **ilk 6 ay Yaklaşım 3 (Manuel Onay)** ile başlanıp, sonra Yaklaşım 1'e geçilebilir.
