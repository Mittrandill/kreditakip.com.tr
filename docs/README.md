# Kredi Takip - Documentation

Bu klasör proje dokümantasyonu, kılavuzlar ve referans materyalleri içerir.

## Klasör Yapısı

```
docs/
├── README.md                    # Bu dosya
├── DOCUMENTATION.md             # Genel proje dokümantasyonu
├── UYGULAMA-DOKUMANTASYONU.md   # Türkçe uygulama dokümantasyonu
├── PADDLE_INTEGRATION.md        # Paddle ödeme entegrasyonu
├── LAZY_LOADING_PLAN.md         # Performans optimizasyon planı
├── Paddle/                      # Paddle referans dokümanları
│   ├── What is Paddle.md       # Paddle nedir
│   ├── Paddle.js reference.md  # Paddle.js API referansı
│   └── INTEGRATION_GUIDE.md    # Entegrasyon rehberi
└── security/                    # Güvenlik dokümanları
    ├── SECURITY_CHECKLIST.md   # Güvenlik kontrol listesi
    ├── SECURITY_IMPROVEMENTS.md # Güvenlik iyileştirmeleri
    └── TRUTHFUL_SECURITY_CLAIMS.md # Güvenlik beyanları
```

## Hızlı Bağlantılar

### Ödeme Sistemi (Paddle)
- [Paddle Entegrasyonu](./PADDLE_INTEGRATION.md) - Paddle ödeme sistemi kurulumu ve kullanımı
- [Paddle.js Referansı](./Paddle/Paddle.js%20reference.md) - Paddle.js API referansı
- [Entegrasyon Rehberi](./Paddle/INTEGRATION_GUIDE.md) - Adım adım entegrasyon

### Güvenlik
- [Güvenlik Kontrol Listesi](./security/SECURITY_CHECKLIST.md) - Güvenlik denetim listesi
- [Güvenlik İyileştirmeleri](./security/SECURITY_IMPROVEMENTS.md) - Uygulanan güvenlik önlemleri

### Performans
- [Lazy Loading Planı](./LAZY_LOADING_PLAN.md) - Bundle optimizasyonu ve code splitting

### Veritabanı
Veritabanı migration dosyaları: `/supabase/migrations/`

## Ödeme Sistemi

Uygulama **Paddle** ödeme sistemini kullanmaktadır:
- PCI-DSS uyumlu (kart bilgisi sunucuya ulaşmaz)
- Otomatik vergi hesaplama (KDV, GST vb.)
- Abonelik yönetimi (dunning, retry, grace period)
- Müşteri portalı (self-service)
- Webhook bildirimleri

### Abonelik Planları
- **Free**: Ücretsiz, sınırlı özellikler
- **Pro Monthly**: 199 TRY/ay
- **Pro Yearly**: 1.910 TRY/yıl (%20 indirim)
- **Premium Monthly**: 399 TRY/ay
- **Premium Yearly**: 3.830 TRY/yıl (%20 indirim)

## Geliştirme Ortamı

1. **Environment Variables**: `.env.local` dosyasında tanımlanmalı
2. **Veritabanı**: Supabase (PostgreSQL)
3. **Webhook**: Paddle webhooks için `/api/paddle/webhooks`

## Önemli Notlar

- Paddle credentials `.env.local` dosyasında saklanmalı (asla commit edilmemeli)
- Sandbox modda test için: `NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox`
- Production için: `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production`
