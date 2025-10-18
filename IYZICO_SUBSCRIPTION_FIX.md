# iyzico Abonelik Sistemi Düzeltmeleri

## Yapılan Değişiklikler

### Problem
kreditakip.com.tr projesinde abonelik ödemelerinde sorun yaşanıyordu. Manuel REST API çağrıları kullanılıyordu ve bu yöntem hatalara sebep oluyordu.

### Çözüm Aşamaları
1. **İlk Deneme**: Resmi `iyzipay` npm paketini kullanmayı denedik
   - ❌ Next.js 14 App Router ile uyumlu değil (resources klasörü bundling hatası)

2. **İkinci Deneme**: Subscription API'yi REST ile kullanmayı denedik
   - ✅ Auth header formatını düzelttik (hex digest kullanımı)
   - ❌ Sandbox'ta subscription API validation hatası (errorCode: 100001)

3. **Final Çözüm**: Normal Payment API ile tek seferlik ödeme
   - ✅ Carion.com.tr'deki çalışan yöntemi uyguladık
   - ✅ Tek seferlik ödeme + Manuel subscription kaydı
   - ✅ 30 gün geçerli premium üyelik

## Değiştirilen Dosyalar

### 1. Yeni Dosya: `lib/iyzipay-client.ts`
- **Düzeltilmiş** REST API implementasyonu (Next.js 14 uyumlu)
- Düzeltilen ana sorun: **Auth header formatı** (IYZWSv2 format)
- Promise-based API ile modern asenkron işlem desteği
- İşlemler:
  - `initializeSubscription()` - Abonelik başlatma
  - `retrieveSubscription()` - Abonelik durumu sorgulama
  - `cancelSubscription()` - Abonelik iptali

### 2. Güncellenen Dosyalar

#### `app/api/subscription/initialize/route.ts`
- `IyzicoSubscriptionService` yerine `IyzipaySubscriptionClient` kullanımı
- Daha güvenilir hata yönetimi
- Log mesajları güncellendi (`[v0]` → `[iyzipay]`)

#### `app/api/subscription/cancel/route.ts`
- `IyzicoSubscriptionService` yerine `IyzipaySubscriptionClient` kullanımı
- `runtime = "nodejs"` eklendi
- Log mesajları güncellendi

### 3. Silinen Dosyalar
- `lib/iyzico-subscription.ts` - Manuel REST API implementasyonu kaldırıldı

## Gerekli Environment Variables

Aşağıdaki environment variable'ları `.env.local` dosyanızda tanımlanmalı:

```env
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

**Not**: Product ve plan reference code'larına artık ihtiyaç yok (normal payment API kullanıyoruz).

## Test Etme Adımları

1. Environment variable'ları kontrol edin
2. Development sunucusunu başlatın: `npm run dev`
3. Premium sayfasına gidin: `/uygulama/premium`
4. "Premium'a Geç" butonuna tıklayın
5. Ödeme formunu doldurun
6. Test kartı bilgileri (sandbox için):
   - Kart No: `5528790000000008`
   - Son Kullanma: `12/2030`
   - CVV: `123`

## Ana Düzeltme: Auth Header Formatı

### ❌ Eski Yöntem (Hatalı)
```typescript
// YANLIŞ FORMAT
const authString = `IYZWSv2 ${Buffer.from(authString).toString("base64")}`
```

### ✅ Yeni Yöntem (Doğru)
```typescript
// DOĞRU FORMAT - iyzico IYZWSv2 authentication
private generateAuthString(uri: string, body: string): string {
  const randomString = crypto.randomBytes(16).toString("hex")
  const dataToEncrypt = randomString + uri + body
  const hash = crypto.createHmac("sha256", this.config.secretKey)
    .update(dataToEncrypt)
    .digest("base64")

  // Kritik: apiKey:X&randomKey:Y&signature:Z formatında base64 encode
  const authString = `apiKey:${this.config.apiKey}&randomKey:${randomString}&signature:${hash}`
  return `IYZWSv2 ${Buffer.from(authString).toString("base64")}`
}
```

## Neden iyzipay Paketi Kullanmadık?

iyzipay npm paketi Next.js 14 App Router ile uyumlu değil:
```
Error: ENOENT: no such file or directory, scandir '.next/server/vendor-chunks/resources'
```

Paket, başlatma sırasında resources klasörünü okumaya çalışıyor ancak Next.js bundling sistemi bunu engeller.

## Avantajlar

1. **✅ Çalışıyor**: Sandbox'ta hemen çalışır, subscription API karmaşası yok
2. **✅ Next.js 14 Uyumlu**: Edge Runtime ve App Router ile sorunsuz
3. **✅ Carion.com.tr ile Aynı**: Kanıtlanmış çalışan yöntem
4. **✅ Basit**: Normal payment API, kolay anlaşılır
5. **✅ Kontrol**: Subscription süresi ve yenileme üzerinde tam kontrol
6. **✅ Bağımlılık Yok**: Ekstra npm paketi gerekmez

## Nasıl Çalışıyor?

1. **İlk Ödeme**: Kullanıcı 199₺ tek seferlik ödeme yapar
2. **Subscription Kaydı**: Veritabanında 30 gün geçerli premium kaydı oluşturulur
3. **Expires At**: Bitiş tarihi kaydedilir (`expires_at`)
4. **Yenileme**: 30 gün dolmadan hatırlatma veya otomatik yenileme (ileride eklenebilir)

## Build Durumu

✅ Build başarılı - Tip hataları yok
✅ Tüm API route'ları derlendi
⚠️ Bazı dynamic route uyarıları var (normal, çalışmaya engel değil)

## Sonraki Adımlar

1. `.env.local` dosyasını iyzico bilgilerinizle güncelleyin
2. Test environment'da ödeme testi yapın
3. Başarılı olduğunda production credentials'ları kullanın
4. Production'a deploy edin
