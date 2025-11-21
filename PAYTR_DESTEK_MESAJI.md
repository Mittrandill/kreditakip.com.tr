# PayTR Destek Mesajı - CAPI Aktivasyon Talebi

## E-posta Bilgileri
**Kime:** destek@paytr.com
**Konu:** CAPI (Kart Saklama) Özelliği Aktivasyon Talebi - Merchant ID: 641436

---

## Mesaj İçeriği

```
Sayın PayTR Destek Ekibi,

Merchant ID: 641436
Site: kreditakip.com.tr

Abonelik sistemi geliştiriyoruz ve tekrarlayan ödemeler (recurring payments) için
CAPI (Kart Saklama) özelliğini kullanmak istiyoruz.

## Mevcut Durum

Test ortamında ödeme formunda aşağıdaki parametreleri gönderiyoruz:
- store_card = 1
- user_basket (sepet bilgileri)

Ödeme başarılı şekilde tamamlanıyor ancak callback'te sadece "utoken" dönüyor,
"ctoken" parametresi dönmüyor.

## Test Detayları

Son test ödemesi:
- Merchant OID: SUB3a8eaaec0a53469f926d1763739540434
- Tarih: 21 Kasım 2025
- Durum: Başarılı (success)
- Alınan: utoken = d3faf1467ce6f02b92576c41b54edc045cc31e6db43af83238ed75a270d066a2
- Alınmayan: ctoken = null

## Talep

1. Test ortamında CAPI özelliğinin aktif olup olmadığını kontrol edebilir misiniz?
2. Test hesabımızda CAPI özelliğini aktif edebilir misiniz?
3. Eğer test ortamında CAPI desteklenmiyorsa, canlı ortamda aktif mi?

## Kullanım Amacı

Abonelik sistemimizde kullanıcıların kartlarını güvenli şekilde saklayıp,
abonelik yenileme dönemlerinde otomatik ödeme almak istiyoruz.

Dökümantasyonunuzu inceledik ve entegrasyonu doğru şekilde yaptık.
Callback'te ctoken'ın dönmemesi CAPI özelliğinin aktif olmadığını gösteriyor.

Yardımlarınız için şimdiden teşekkür ederiz.

İyi çalışmalar.
```

---

## Alternatif: Telefon ile İletişim

PayTR Destek Hattı: **0850 220 90 90**

Telefonda şunları belirt:
1. Merchant ID: **641436**
2. CAPI (Kart Saklama) özelliği aktif edilmesini istiyorsun
3. Test ortamında çalışması gerekiyor
4. store_card=1 gönderiyorsun ama ctoken dönmüyor

---

## Beklenen Yanıt Süresi

- E-posta: 1-2 iş günü
- Telefon: Anında yanıt

## Aktivasyon Sonrası Test

CAPI aktif edildikten sonra tekrar test ödeme yap ve şunu kontrol et:
- Callback'te hem utoken hem ctoken dönmeli
- Her iki değer de null olmamalı
- Kart bilgileri (last_4, card_brand, card_bank) dönmeli

Aktivasyonu ben test edebilirim, bana haber ver!
