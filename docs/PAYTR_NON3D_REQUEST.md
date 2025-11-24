# PayTR Non3D ve Direkt API Yetkilendirme Talebi

## Gönderilecek Mesaj

---

**Konu:** Direkt API, Non3D ve Kart Saklama (CAPI) Yetkilendirme Talebi

Sayın PayTR Destek Ekibi,

Daha önce kart saklama ve otomatik ödeme alma konusunda bilgi talep etmiştim. Verdiğiniz detaylı açıklamalar için teşekkür ederim. Riskleri değerlendirdik ve aşağıdaki model ile ilerlemek istiyoruz:

### Talep Ettiğimiz Yetkiler

1. **Direkt API** - Kendi ödeme sayfamızda işlem yapabilmek için
2. **Non3D Yetkisi** - Recurring (tekrarlayan) ödemeler için
3. **CAPI (Card Storage)** - Kart saklama sistemi

### İş Modelimiz

**Platform:** kreditakip.com.tr
**Sektör:** Finans teknolojileri / Kredi takip yazılımı
**Abonelik Sistemi:** Aylık/Yıllık premium üyelik

### Ödeme Akışımız

#### 1. İlk Ödeme (Signup) - 3D SECURE İLE ✅
- Kullanıcı kayıt olurken **3D Secure** ile güvenli ödeme yapacak
- Ödeme formumuzda açık onay alacağız:
  - ✅ "Kartımı güvenli bir şekilde sakla" (CAPI için)
  - ✅ "Aboneliğimi otomatik yenile" (Recurring için)
  - ✅ Kullanım Koşulları ve Gizlilik Politikası onayı

#### 2. Kart Saklama - CAPI
- İlk başarılı ödeme sonrası kart bilgileri PayTR CAPI sistemi ile saklanacak
- `utoken` ve `ctoken` bilgileri veritabanımızda tutulacak

#### 3. Otomatik Yenileme - Non3D (Recurring)
- Abonelik süresi dolmadan **3 gün önce** kullanıcıya email bildirimi gönderilecek
- Email içeriği: "Aboneliğiniz X tarihinde otomatik yenilenecektir. İptal etmek isterseniz..."
- Kullanıcı itiraz etmezse, cron job ile kayıtlı karttan **Non3D** ödeme alınacak
- Başarılı/başarısız ödeme sonrası email bildirimi gönderilecek

### Güvenlik ve Risk Yönetimi

#### Non3D Risklerini Nasıl Azaltacağız?

1. **Açık Kullanıcı Onayı**
   - İlk ödemede açık checkbox ile onay
   - Terms of Service ile yasal koruma
   - Her yenilemeden önce email bildirimi

2. **Detaylı Logging**
   - Her işlem için IP adresi, device fingerprint, timestamp kaydı
   - Kullanıcı aktivite logları
   - Chargeback durumlarında ispat için belgeler

3. **Fraud Detection**
   - Şüpheli işlem tespiti (uzun süredir giriş yapmayan kullanıcı + ödeme)
   - Risk skorlama algoritması
   - Yüksek riskli işlemler için manuel kontrol

4. **Bildirim Sistemi**
   - 3 gün önceden email bildirimi
   - Başarılı ödeme bildirimi
   - Başarısız ödeme bildirimi
   - İptal/değişiklik bildirimi

5. **İlk 6 Ay Dikkatli Yaklaşım**
   - Sadece aktif kullanıcılar için otomatik yenileme
   - Pasif kullanıcılara email ile manuel onay talebi
   - Fraud monitoring sürekli aktif

### Teknik Altyapı

✅ Direkt API entegrasyonu tamamlandı
✅ CAPI (kart saklama) entegrasyonu tamamlandı
✅ Recurring payment fonksiyonu hazır
✅ Cron job sistemi kurulu (her gün 09:00 UTC)
✅ Email bildirim sistemi aktif
✅ PCI-DSS uyumlu (kart bilgileri sunucumuza gelmiyor)

### Risk Kabul Beyanı

3D Secure kullanmadan yapılacak recurring ödemelerde:
- Kartın izinsiz kullanımı durumunda ispat yükümlülüğünü kabul ediyoruz
- Chargeback durumlarında sorumluluk tarafımızda olacaktır
- "Ben yapmadım" itirazlarında ispat sorumluluğunu üstleniyoruz

Ancak yukarıda belirttiğimiz güvenlik önlemleri ile bu riski minimize edeceğimize inanıyoruz.

### Sorularım

1. Non3D yetkisi için onay süreci ne kadardır?
2. Test ortamında CAPI özelliği çalışıyor mu? (Test işlemlerimizde `utoken` gelmiyor)
3. Recurring payment için ek bir komisyon oranı var mı?
4. Chargeback durumunda PayTR'den destek alabilir miyiz?

### İletişim Bilgileri

**Firma:** [Firma adı]
**Mağaza ID:** [PayTR Merchant ID]
**Web:** kreditakip.com.tr
**Yetkili:** [Adınız]
**Email:** [Email]
**Telefon:** [Telefon]

Talebimizin değerlendirilerek olumlu dönüş yapılmasını umuyoruz. Ek bilgi veya belge gerekiyorsa lütfen bildirin.

Saygılarımla,
[Adınız]
[Firma Adı]

---

## PayTR'ye Göndermeden Önce Hazırlanması Gerekenler

### 1. Kullanıcı Sözleşmesi (Avukat ile)
```markdown
## Otomatik Abonelik Yenileme Koşulları

1. Aboneliğiniz otomatik olarak yenilenecektir
2. İlk ödemeniz 3D Secure ile güvenli yapılmıştır
3. Yenileme ödemeleri Non3D (3D Secure olmadan) yapılacaktır
4. Her yenilemeden 3 gün önce email bildirimi alacaksınız
5. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz
6. İptal için: Ayarlar > Abonelik > İptal Et

### Risk Bildirimi
Non3D (3D Secure olmayan) ödemeler, kartınızın izinsiz kullanımına karşı daha az koruma sağlar.
Bu ödemeleri kabul ederek, bu riski anladığınızı ve kabul ettiğinizi beyan edersiniz.
```

### 2. Privacy Policy Güncellemesi
```markdown
## Ödeme Bilgileri ve Kart Saklama

- Kart bilgileriniz PayTR güvenli altyapısında saklanır
- Sunucularımızda kart bilgisi tutulmaz (PCI-DSS uyumlu)
- Sadece PayTR token'ları (utoken, ctoken) saklanır
- Otomatik yenileme için açık onay gereklidir
- İstediğiniz zaman kartınızı silebilirsiniz
```

### 3. Email Template'leri Hazırla

**Yenileme Öncesi (3 gün önce):**
```
Konu: Aboneliğiniz 3 Gün Sonra Yenilenecek

Sayın [Ad],

kreditakip.com.tr Premium aboneliğiniz [TARİH] tarihinde otomatik olarak yenilenecektir.

Yenileme Detayları:
- Plan: [PLAN ADI]
- Tutar: [TUTAR] TL
- Kartınızın son 4 hanesi: **** [LAST4]

İptal etmek isterseniz: [İPTAL LINK]

Teşekkürler,
Kredi Takip Ekibi
```

### 4. Risk Monitoring Dashboard
```typescript
// Günlük kontrol edilecek metrikler
const riskMetrics = {
  chargebackRate: 0, // Hedef: < %0.5
  fraudAttempts: 0,
  failedPayments: 0,
  disputedPayments: 0,
  inactiveUserPayments: 0, // Uyarı: 30 gün giriş yapmayan
}
```

## Sonuç

PayTR'ye gönderilecek mesajı yukarıdaki formatta hazırlayın ve gönderin. Non3D yetkisi onayını beklerken:

1. ✅ Kullanıcı sözleşmesini hazırlayın
2. ✅ Email template'lerini tamamlayın
3. ✅ Fraud detection sistemini kurun
4. ✅ Test ortamında CAPI'yi deneyin

PayTR'den olumlu dönüş aldıktan sonra production'a geçebiliriz.
