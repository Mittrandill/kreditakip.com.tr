# PayTR Kart Saklama Debug Rehberi

## Sorun
Test modunda ödeme başarılı oluyor ancak `paytr_user_tokens`, `paytr_saved_cards`, `paytr_recurring_payments` tablolarına kayıt yapılmıyor.

## Kontrol Listesi

### 1. Frontend Kontrolü
- [ ] Ödeme yaparken "Kartımı güvenli bir şekilde sakla" checkbox'ı işaretlendi mi?
- [ ] Browser Console'da network tab'inde `/api/subscription/checkout/direct` isteğine bakın
- [ ] Request body'de `storeCard: true` var mı?

### 2. Backend Log Kontrolü
Callback endpoint'ine şu logları ekleyin (callback/route.ts satır 265'ten sonra):

```typescript
// Debug: Kart saklama parametrelerini logla
console.log("[DEBUG] utoken:", utoken)
console.log("[DEBUG] ctoken:", ctoken)
console.log("[DEBUG] saveCard checkbox:", storeCard)
console.log("[DEBUG] All callback params:", Object.fromEntries(body.entries()))
```

### 3. PayTR Test Modu Kısıtlamaları
PayTR test modunda bazı özellikler çalışmayabilir:
- CAPI (Kart Saklama) özelliği test modunda kısıtlı olabilir
- Sadece canlı merchant hesaplarında tam aktif olabilir

**Çözüm:** PayTR destek ile iletişime geçin ve test hesabınızda CAPI özelliğinin aktif olup olmadığını sorun.

### 4. PayTR Hesap Ayarları
- [ ] PayTR panel > Entegrasyonlar > CAPI bölümünü kontrol edin
- [ ] "Kart Saklama" özelliği aktif mi?
- [ ] Test modunda izin veriliyor mu?

### 5. Callback Parametrelerini Kontrol
PayTR callback'te şu parametreler gelmiyor olabilir:
- `utoken`: Kullanıcı token (user token)
- `ctoken`: Kart token (card token)

Bu parametreler gelmiyorsa PayTR kart saklamayı desteklemiyor demektir.

## Test Senaryosu

### Manuel Test
1. Ödeme sayfasına gidin
2. "Kartımı güvenli bir şekilde sakla" checkbox'ını işaretleyin
3. Ödemeyi tamamlayın
4. Vercel/Sunucu loglarına bakın ve şu loglara dikkat edin:
   - `[paytr-callback] utoken saved successfully for user:`
   - `[paytr-callback] Saved card info successfully for user:`
   - `[paytr-callback] Recurring payment record created for user:`

### Beklenen Sonuç
Eğer loglar görünmüyorsa:
- `utoken` ve `ctoken` PayTR'den gelmiyor demektir
- Bu durumda PayTR desteğe başvurun

## PayTR Dökümantasyonu
PayTR CAPI özellikleri için:
- `docs/paytr/Paytr Kart Saklama.pdf` dosyasına bakın
- PayTR destek: destek@paytr.com

## Geçici Çözüm
Kart saklama çalışmıyorsa:
1. Kullanıcılar her seferinde kart bilgilerini girecek
2. Otomatik yenileme çalışmayacak, kullanıcı manuel ödeme yapacak
3. Abonelik süresi dolmadan e-posta ile hatırlatma gönderin

## Kalıcı Çözüm
1. PayTR ile iletişime geçin
2. CAPI özelliğini aktif ettirin (canlı hesap gerekebilir)
3. Test edin ve doğrulayın

## Kod Konumları
- **Frontend:** `components/payment/payment-form.tsx:167` - storeCard parametresi
- **Backend Token:** `app/api/subscription/checkout/direct/route.ts:191` - store_card gönderimi
- **Callback:** `app/api/subscription/checkout/callback/route.ts:264-343` - Kart saklama kayıtları
- **Database:** `database-scripts/migrations/paytr-card-storage.sql` - Tablolar
