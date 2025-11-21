# PayTR Direct API Test Rehberi

## 🎯 Test Sayfasına Erişim

Test sayfasını başlatmak için:

```bash
npm run dev
# veya
pnpm dev
```

Tarayıcınızda:
```
http://localhost:3000/test/paytr-direct
```

## ⚠️ Önemli Notlar

1. **Test Modu Aktif Olmalı**
   ```bash
   PAYTR_TEST_MODE=1
   ```

2. **PayTR Credentials Gerekli**
   ```bash
   PAYTR_MERCHANT_ID=your_merchant_id
   PAYTR_MERCHANT_KEY=your_merchant_key
   PAYTR_MERCHANT_SALT=your_merchant_salt
   ```

3. **Test Sayfası Production'da Silinmeli**
   - `/app/test/paytr-direct/`
   - `/app/api/test/paytr-direct/`

## 🧪 Test Senaryoları

### 1. Kart Validasyon Testleri

Test sayfasının "Validasyon" sekmesinde:

#### A) Kart Numarası Validasyonu
**Test Kartları:**
- ✅ Geçerli: `4355084355084358` (Visa)
- ✅ Geçerli: `5406675406675403` (Mastercard)
- ✅ Geçerli: `9792030394440796` (Troy)
- ❌ Geçersiz: `1234567890123456`

**Beklenen Sonuç:**
```json
{
  "success": true,
  "isValid": true,
  "message": "Kart numarası geçerli"
}
```

#### B) CVV Validasyonu
**Test Değerleri:**
- ✅ Geçerli: `000`
- ✅ Geçerli: `123`
- ❌ Geçersiz: `12` (2 haneli)
- ❌ Geçersiz: `1234` (4 haneli)
- ❌ Geçersiz: `abc` (rakam değil)

#### C) Son Kullanma Tarihi Validasyonu
**Test Değerleri:**
- ✅ Geçerli: Ay=`12`, Yıl=`24`
- ✅ Geçerli: Ay=`06`, Yıl=`25`
- ❌ Geçersiz: Ay=`13`, Yıl=`24` (geçersiz ay)
- ❌ Geçersiz: Ay=`12`, Yıl=`23` (geçmiş tarih)

### 2. Token Oluşturma Testi

Test sayfasının "Token" sekmesinde:

**Adımlar:**
1. Tutar girin (örn: 199.00)
2. "Token Oluştur" butonuna tıklayın
3. Sonucu inceleyin

**Beklenen Sonuç:**
```json
{
  "success": true,
  "token": "generated_token_here",
  "orderId": "TEST1234567890",
  "formData": {
    "merchant_id": "123456",
    "user_ip": "85.34.78.112",
    "merchant_oid": "TEST1234567890",
    "email": "test@example.com",
    "payment_type": "card",
    "payment_amount": "199.00",
    "installment_count": "0",
    "currency": "TL",
    "test_mode": "1",
    "non_3d": "0",
    "user_name": "Test Kullanıcı",
    "user_address": "Test Adres",
    "user_phone": "+905551234567",
    "user_basket": "base64_encoded_basket",
    "paytr_token": "generated_token",
    "client_lang": "tr",
    "debug_on": "1",
    "merchant_ok_url": "http://localhost:3000/api/subscription/checkout/callback?merchant_oid=TEST1234567890",
    "merchant_fail_url": "http://localhost:3000/api/subscription/checkout/callback?merchant_oid=TEST1234567890&status=failed"
  },
  "paytrUrl": "https://www.paytr.com/odeme"
}
```

**Kontrol Edilecekler:**
- ✅ Token oluşturuldu mu?
- ✅ formData tüm gerekli alanları içeriyor mu?
- ✅ test_mode "1" mi?
- ✅ merchant_ok_url ve merchant_fail_url doğru mu?

### 3. Tam Ödeme Akışı Testi

Test sayfasının "Tam Ödeme" sekmesinde:

**Test Kartı Bilgileri:**
```
Kart Sahibi: PAYTR TEST
Kart No: 4355 0843 5508 4358
Ay: 12
Yıl: 24
CVV: 000
```

**Adımlar:**

1. **Form Doldurma**
   - Tutar: `199.00`
   - Ad Soyad: `Test Kullanıcı`
   - Email: `test@example.com`
   - Telefon: `+905551234567`
   - Şehir: `İstanbul`
   - Adres: `Test Adres`
   - Kart bilgileri (yukarıdaki test kartı)

2. **Ödemeyi Başlat**
   - "Ödemeyi Başlat" butonuna tıklayın
   - Onay dialogunda "OK" deyin
   - PayTR sayfasına yönlendirileceksiniz

3. **PayTR 3D Secure**
   - PayTR test sayfası açılacak
   - 3D Secure doğrulaması yapılacak
   - Test modunda otomatik geçer

4. **Callback**
   - Ödeme tamamlandığında callback endpoint'inize POST gelir
   - Kullanıcı success/fail sayfasına yönlendirilir

### 4. Callback Test

Callback'i manuel test etmek için:

**Test Callback Request:**
```bash
curl -X POST http://localhost:3000/api/subscription/checkout/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "merchant_oid=TEST123456789" \
  -d "status=success" \
  -d "total_amount=19900" \
  -d "hash=generated_hash" \
  -d "test_mode=1" \
  -d "payment_type=card" \
  -d "currency=TRY" \
  -d "payment_amount=19900"
```

**Not:** Hash'i doğru hesaplamanız gerekir!

## 🔍 Debugging

### Console Log'larını Takip Edin

**Backend logs:**
```bash
# Terminal'de dev server'ı çalıştırırken log'ları göreceksiniz
npm run dev
```

**Frontend logs:**
```javascript
// Browser console'da network tab'ı açın
// F12 > Network > XHR
```

### PayTR Panel'de Kontrol

1. PayTR Mağaza Paneli'ne giriş yapın
2. **İşlemler** sayfasını açın
3. Test işlemlerinizi görebilirsiniz
4. **Detay** linkinden webhook durumunu kontrol edin

### Common Issues

#### 1. "Invalid hash"
**Neden:** Hash hesaplama sırası yanlış veya credentials yanlış
**Çözüm:**
- merchant_key ve merchant_salt'ı kontrol edin
- Hash hesaplama sırasını dokümana göre kontrol edin

#### 2. "Bildirim URL'den OK yanıtı alınamadı"
**Neden:** Callback endpoint OK dönmüyor
**Çözüm:**
- Callback endpoint'in sonunda `return new Response("OK")` olmalı
- HTML veya başka içerik dönülmemeli

#### 3. "Token creation failed"
**Neden:** PayTR credentials eksik veya yanlış
**Çözüm:**
- .env.local dosyasını kontrol edin
- PAYTR_MERCHANT_ID, KEY, SALT değerlerini kontrol edin

#### 4. "CORS error"
**Neden:** PayTR'ye direkt fetch yapıyorsunuz
**Çözüm:**
- PayTR'ye form POST yapın, fetch değil
- Client-side'dan DOĞRUDAN PayTR'ye POST edilmeli

## 📊 Test Checklist

### Validation Tests
- [ ] Geçerli kart numarası testi
- [ ] Geçersiz kart numarası testi
- [ ] Luhn algoritması testi
- [ ] CVV validasyonu
- [ ] Son kullanma tarihi (geçerli)
- [ ] Son kullanma tarihi (geçmiş tarih)
- [ ] Son kullanma tarihi (gelecek tarih)

### Token Generation Tests
- [ ] Token başarıyla oluşturuldu
- [ ] FormData tüm alanları içeriyor
- [ ] test_mode aktif
- [ ] Merchant URLs doğru
- [ ] User basket base64 encoded

### Payment Flow Tests
- [ ] Form validation çalışıyor
- [ ] Token generation başarılı
- [ ] PayTR'ye yönlendirme çalışıyor
- [ ] 3D Secure tamamlanıyor
- [ ] Callback alınıyor
- [ ] Hash doğrulama çalışıyor
- [ ] Subscription oluşturuluyor
- [ ] Success sayfasına yönlendiriliyor

### Error Handling Tests
- [ ] Geçersiz kart numarası hatası
- [ ] Geçersiz CVV hatası
- [ ] Ödeme başarısız senaryosu
- [ ] Kullanıcı iptal etme
- [ ] Network hatası
- [ ] Rate limiting

### Security Tests
- [ ] Kart bilgileri sunucuya gönderilmiyor
- [ ] Hash doğrulama çalışıyor
- [ ] Rate limiting aktif
- [ ] Idempotency kontrolü
- [ ] SQL injection koruması
- [ ] XSS koruması

## 🎉 Başarılı Test Kriterleri

Tüm testler başarılı ise:

1. ✅ Validasyon methodları doğru çalışıyor
2. ✅ Token başarıyla oluşturuluyor
3. ✅ PayTR'ye form POST ediliyor
4. ✅ 3D Secure tamamlanıyor
5. ✅ Callback alınıyor ve işleniyor
6. ✅ Hash doğrulama çalışıyor
7. ✅ Subscription database'e kaydediliyor
8. ✅ User success sayfasına yönlendiriliyor
9. ✅ PayTR Panel'de işlem "Başarılı" görünüyor

## 🚀 Production'a Geçiş

Test'ler başarılı olduktan sonra:

1. **Test dosyalarını sil:**
   ```bash
   rm -rf app/test/paytr-direct
   rm -rf app/api/test/paytr-direct
   ```

2. **Environment variables güncelle:**
   ```bash
   PAYTR_TEST_MODE=0  # Canlı moda geç
   ```

3. **PayTR Panel'de ayarlar:**
   - Bildirim URL'i HTTPS olmalı
   - Test modunu kapat
   - Canlı işlem yap

4. **Monitor et:**
   - İlk birkaç gerçek işlemi yakından takip et
   - Log'ları kontrol et
   - PayTR Panel'de işlemleri takip et

## 📝 Test Sonuçları Kaydetme

Her test sonrasında şunları kaydedin:

```markdown
## Test Tarihi: 2025-XX-XX

### Test Edilen Senaryolar:
- [x] Kart validasyonu
- [x] Token generation
- [x] Full payment flow
- [x] Callback handling

### Test Sonuçları:
- Başarılı: X/Y
- Başarısız: Y/X
- Sorunlar: [Liste]

### Notlar:
- [Özel notlar]
```

## 🆘 Yardım

Sorun yaşıyorsanız:

1. **Dokümantasyonu okuyun:**
   - `/docs/PAYTR_DIRECT_API_INTEGRATION.md`
   - `/docs/paytr/` (PayTR resmi dökümanlar)

2. **Log'ları kontrol edin:**
   - Browser console
   - Server logs
   - PayTR Panel > İşlemler > Detay

3. **PayTR Destek:**
   - Mağaza Paneli > Destek
   - https://www.paytr.com

---

**Test başarıyla tamamlandıktan sonra bu dosyayı ve test dosyalarını production'dan silin!**
