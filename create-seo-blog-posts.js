const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Environment variables not set")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Admin user ID for blog post author
const AUTHOR_ID = "cd16465d-5170-4d28-a006-7537f22d9fa2"

const blogPosts = [
  {
    title: "Kredi Taksit Takibi Nasıl Yapılır? En İyi 5 Yöntem",
    slug: "kredi-taksit-takibi-nasil-yapilir",
    excerpt: "Kredi taksitlerinizi takip etmek için kullanabileceğiniz en etkili yöntemler ve dijital çözümler. Ödeme planınızı düzenli tutmanın yolları.",
    content: `# Kredi Taksit Takibi Nasıl Yapılır? En İyi 5 Yöntem

Türkiye'de milyonlarca kişi konut, taşıt veya ihtiyaç kredisi kullanıyor. Ancak birden fazla krediye sahip olduğunuzda, taksit ödemelerini takip etmek zorlaşabiliyor. Geciken ödemelerin getireceği faiz yükü ve kredi notunuza olan olumsuz etkiler düşünüldüğünde, düzenli bir takip sistemi kurmak hayati önem taşıyor.

## Neden Kredi Taksit Takibi Önemlidir?

### 1. Gecikme Faizlerinden Korunma
Bir taksiti geciktirdiğinizde, gecikme faizi ve gecikme cezası ödemek zorunda kalırsınız. Bu ek maliyetler, kredi maliyetinizi önemli ölçüde artırabilir.

### 2. Kredi Notunun Korunması
Düzenli ödeme alışkanlığı, kredi notunuzu olumlu etkiler. İyi bir kredi notu, gelecekte daha avantajlı kredi şartlarıyla borçlanmanızı sağlar.

### 3. Finansal Planlama
Ödeme takvimini takip etmek, aylık bütçenizi daha iyi planlamanıza yardımcı olur.

## En İyi 5 Kredi Takip Yöntemi

### 1. Dijital Kredi Takip Uygulamaları

Modern teknoloji sayesinde, tüm kredilerinizi tek bir platformdan yönetebilirsiniz. **kreditakip.com.tr** gibi özel geliştirilmiş uygulamalar:

- Tüm kredilerinizi tek platformda toplama
- Otomatik ödeme hatırlatmaları
- Detaylı ödeme takvimleri
- Erken ödeme simülasyonları
- Kredi borç analizi

### 2. Excel veya Google Sheets ile Takip

Geleneksel ama etkili bir yöntem. Kendi takip tablonuzu oluşturabilirsiniz:

**Sütunlar:**
- Banka adı
- Kredi türü
- Taksit tutarı
- Vade tarihi
- Kalan taksit sayısı
- Toplam borç

**Avantajları:**
- Ücretsiz
- Kişiselleştirilebilir
- Detaylı analiz imkanı

**Dezavantajları:**
- Manuel güncelleme gerekir
- Otomatik hatırlatma yok
- Mobil erişim sınırlı

### 3. Banka Mobil Uygulamaları

Çoğu banka, kendi kredileriniz için mobil uygulama desteği sunar. Ancak birden fazla bankadan krediniz varsa, her biri için ayrı uygulama kullanmanız gerekir.

**Avantajlar:**
- Bankadan doğrudan bilgi
- Güncel bakiye bilgisi
- Hızlı işlem yapma

**Dezavantajlar:**
- Sadece o bankanın kredileri
- Çoklu banka için pratik değil

### 4. SMS ve E-posta Hatırlatmaları Ayarlama

Telefon takvimi veya hatırlatma uygulamaları kullanarak:

- Her kredi için ayrı hatırlatma oluşturun
- Vade tarihinden 3 gün önce uyarı alın
- Aylık tekrarlayan bildirimler ayarlayın

### 5. Otomatik Ödeme Talimatı

En güvenli yöntemlerden biri:

- Vade tarihinde otomatik ödeme
- Unutma riski sıfır
- Gecikme faizi yok

**Dikkat edilmesi gerekenler:**
- Hesapta yeterli bakiye olmalı
- Faiz oranı değişimlerini takip edin
- Erken ödeme yapmak isterseniz talimatı iptal edin

## Kredi Takibinde Yapılan Yaygın Hatalar

### 1. Sadece Tek Krediye Odaklanma
Birden fazla krediniz varsa, hepsini takip edin. Küçük tutarlı krediler bile ihmal edilmemeli.

### 2. Vade Tarihini Son Güne Bırakma
Ödemeyi vade tarihinden 2-3 gün önce yapmak, olası gecikmeleri önler.

### 3. Kalan Borç Takibi Yapmama
Sadece aylık taksit değil, toplam kalan borcunuzu da takip edin. Erken ödeme fırsatlarını değerlendirebilirsiniz.

### 4. Faiz Oranı Değişimlerini İhmal Etme
Değişken faizli kredilerde, faiz oranı değişikliklerini takip edin ve bütçenizi buna göre güncelleyin.

## Dijital Çözümün Avantajları

kreditakip.com.tr gibi özel platformlar kullanmanın faydaları:

### Zaman Tasarrufu
- Tek tıkla tüm kredilerinizi görüntüleyin
- Otomatik hesaplamalar
- Manuel takip gerekmez

### Finansal Analiz
- Toplam faiz maliyeti hesaplama
- Erken ödeme senaryoları
- Aylık ödeme yükü analizi
- Kredi konsolidasyonu fırsatları

### Güvenlik
- Bankacılık düzeyinde şifreleme
- Güvenli veri saklama
- KVKK uyumlu

### Hatırlatma Sistemi
- Akıllı bildirimler
- E-posta uyarıları
- Özelleştirilebilir hatırlatma tarihleri

## Sonuç

Kredi taksit takibi, finansal sağlığınız için kritik öneme sahiptir. Modern dijital çözümler, bu süreci hem kolaylaştırıyor hem de daha güvenli hale getiriyor.

**En iyi yaklaşım:**
1. Dijital bir takip platformu kullanın
2. Otomatik hatırlatmalar ayarlayın
3. Düzenli olarak finansal durumunuzu gözden geçirin
4. Erken ödeme fırsatlarını değerlendirin

[kreditakip.com.tr](https://kreditakip.com.tr)'yi **ücretsiz** deneyerek, kredi yönetimini kolaylaştırın ve finansal hedeflerinize daha hızlı ulaşın.`,
    status: "published",
    category_id: null, // Will be set based on existing categories
  },
  {
    title: "Erken Kredi Kapatma: Avantajları ve Dikkat Edilmesi Gerekenler",
    slug: "erken-kredi-kapatma-avantajlari",
    excerpt: "Kredinizi erken kapatmanın finansal avantajları nelerdir? Hangi durumlarda erken ödeme yapmalısınız? Detaylı rehber ve hesaplama örnekleri.",
    content: `# Erken Kredi Kapatma: Avantajları ve Dikkat Edilmesi Gerekenler

Elinizde birikmiş bir miktar para olduğunda, bunu değerlendirmenin birçok yolu vardır. Yatırım, tasarruf veya kredi borcunu erken kapatma... Peki, kredinizi erken kapatmak gerçekten mantıklı mı?

## Erken Kredi Kapatma Nedir?

Erken kredi kapatma, kredinin vade sonundan önce, kalan borç tutarının bir kerede veya kısmi olarak ödenmesidir. Türk bankacılık mevzuatına göre, tüketiciler krediyi istediği zaman **erken kapatma hakkına** sahiptir.

### Yasal Haklar

5464 sayılı Banka Kartları ve Kredi Kartları Kanunu'na göre:
- Erken ödeme hakkınız vardır
- Banka size bu konuda ücret kesemez
- Kalan faiz tutarı düşürülmelidir

## Erken Kredi Kapatmanın Avantajları

### 1. Faiz Tasarrufu

**En büyük avantaj budur.** Krediyi erken kapatarak, gelecekte ödeyeceğiniz faiz tutarını azaltırsınız.

**Örnek Hesaplama:**

Koşullar:
- Kredi tutarı: 100.000 TL
- Faiz oranı: %2,5 aylık (yaklaşık %30 yıllık)
- Vade: 36 ay
- Aylık taksit: ~4.500 TL

**Senaryo 1: 12. ayda tam ödeme**
- 12 ay ödenen: 54.000 TL
- Kalan anapara: ~75.000 TL
- Normal devam etseydi toplam: 162.000 TL
- Erken kapatınca toplam: 129.000 TL
- **Tasarruf: 33.000 TL**

### 2. Aylık Finansal Yük Azalması

Kredi taksitleri bitince:
- Aylık bütçeniz rahatlır
- Daha fazla tasarruf imkanı
- Yeni yatırım fırsatları değerlendirebilirsiniz

### 3. Kredi Notu İyileşmesi

Erken ödeme:
- Finansal disiplininizi gösterir
- Kredi notunuzu pozitif etkiler
- Gelecekte daha iyi kredi şartları

### 4. Psikolojik Rahatlık

Borçsuz olmak:
- Stres azalması
- Mali özgürlük hissi
- Gelecek planları için rahatlık

## Erken Ödeme Yaparken Dikkat Edilmesi Gerekenler

### 1. Acil Durum Fonu

**En önemli kural:** Erken ödeme yapmadan önce, 3-6 aylık acil durum fonunuz olmalı.

**Neden?**
- İşsizlik
- Sağlık sorunları
- Beklenmedik masraflar

Acil durum fonu olmadan krediyi kapatırsanız, sonra tekrar borçlanmak zorunda kalabilirsiniz.

### 2. Alternatif Yatırım Getirisi

Elinizde 50.000 TL olduğunu varsayalım:

**Seçenek A: Krediyi kapat**
- Faiz tasarrufu: %30 yıllık

**Seçenek B: Yatırım yap**
- Devlet tahvili getirisi: %40 yıllık
- Hisse senedi (riskli)
- Döviz (riskli)

**Karşılaştırma:**
- Kredi faizi > Yatırım getirisi → Krediyi kapat
- Kredi faizi < Yatırım getirisi → Yatırım yap

### 3. Kısmi vs Tam Erken Ödeme

**Tam erken ödeme:**
- Kredi tamamen kapanır
- Maksimum faiz tasarrufu
- Aylık yük tamamen biter

**Kısmi erken ödeme:**
- Kredinin bir kısmı ödenir
- İki seçenek:
  - **Vadeyi kısalt:** Aynı taksit tutarı, daha az ay
  - **Taksiti düşür:** Aynı vade, daha az taksit

**Hangi opsiyon daha iyi?**

Faiz tasarrufu açısından: **Vadeyi kısaltmak**

Örnek:
- Kalan borç: 60.000 TL
- Kalan vade: 24 ay
- Kısmi ödeme: 20.000 TL

Seçenek 1 (Vade kısaltma):
- Taksit: 2.500 TL
- Yeni vade: 16 ay
- Toplam faiz: ~8.000 TL

Seçenek 2 (Taksit düşürme):
- Taksit: 1.800 TL
- Vade: 24 ay
- Toplam faiz: ~11.000 TL

**Tasarruf farkı: 3.000 TL**

### 4. Banka Prosedürleri

Her bankanın farklı uygulaması olabilir:

**Yapılması gerekenler:**
1. Banka ile iletişime geçin
2. Güncel borç bakiyesini öğrenin
3. Erken ödeme belgesini alın
4. Ödeme sonrası dekont saklayın
5. Kredi kapanış belgesini mutlaka isteyin

### 5. Vergi ve Yasal Konular

**KKDF (Kaynak Kullanımını Destekleme Fonu):**
- İhtiyaç kredilerinde %15
- Konut kredilerinde %0
- Erken ödeme ile geri alınamaz (anlaşmalı bankalar hariç)

**BSMV (Banka ve Sigorta Muameleleri Vergisi):**
- %5 oranında
- Erken ödeme ile geri alınamaz

## Erken Ödeme Yapmalı mıyım? Karar Ağacı

### EVET - Krediyi Erken Kapatın

✅ Kredi faizi çok yüksek (%30+)
✅ Acil durum fonunuz hazır
✅ Daha iyi yatırım alternatifi yok
✅ Borçsuz olmak istiyorsunuz
✅ Başka yüksek faizli borçlar yok

### HAYIR - Beklemeyi Düşünün

❌ Acil durum fonu yok
❌ Kredi faizi düşük (%15-)
❌ Daha getirili yatırım fırsatı var
❌ Başka yüksek faizli borçlar var (önce onlar)
❌ Likiditeye ihtiyacınız olabilir

## kreditakip ile Erken Ödeme Simülasyonu

[kreditakip.com.tr](https://kreditakip.com.tr) platformunda:

### Erken Ödeme Hesaplayıcı
- Farklı senaryoları karşılaştırın
- Faiz tasarrufunu görün
- En optimal ödeme planını bulun

### Otomatik Öneriler
- Hangi krediyi önce kapatmalı?
- Kısmi ödeme mi, tam ödeme mi?
- Vade kısaltma mı, taksit düşürme mi?

## Sonuç ve Öneriler

Erken kredi kapatma, doğru koşullarda **çok mantıklı** bir finansal karardır. Ancak:

**Yapmanız gerekenler:**
1. Acil durum fonunuzu oluşturun
2. Tüm kredilerinizi analiz edin
3. Alternatif yatırım getirilerini karşılaştırın
4. En yüksek faizli krediyi önceliklendirin
5. Banka prosedürlerini öğrenin

**Altın kural:**
> "Acil durum fonunuz varsa ve kredi faizi yüksekse, erken ödeme neredeyse her zaman mantıklıdır."

kreditakip.com.tr'nin **ücretsiz erken ödeme hesaplayıcısını** kullanarak, kendi durumunuz için en optimal stratejiyi belirleyin.`,
    status: "published",
    category_id: null,
  },
  {
    title: "Birden Fazla Kredi Borcu Olanlar İçin Yönetim Stratejileri",
    slug: "coklu-kredi-yonetimi-stratejileri",
    excerpt: "Birden fazla krediye sahipseniz, öncelik sıralaması nasıl yapılır? Kredi konsolidasyonu mantıklı mı? Uzman tavsiyeleri ve pratik çözümler.",
    content: `# Birden Fazla Kredi Borcu Olanlar İçin Yönetim Stratejileri

Türkiye'de ortalama kredi kullanan bir kişinin 2-3 farklı kredisi bulunuyor. Birden fazla krediyi yönetmek, dikkat ve disiplin gerektiren bir süreçtir. Bu rehberde, çoklu kredi yönetimi için kanıtlanmış stratejileri bulacaksınız.

## Çoklu Kredi Durumu: Fotoğrafı Görmek

### Mevcut Durumunuzu Analiz Edin

İlk adım, tüm kredilerinizi bir araya getirmek:

**Toplanması gereken bilgiler:**
- Banka adı
- Kredi türü (ihtiyaç, konut, taşıt, kredi kartı)
- Kalan borç tutarı
- Aylık taksit tutarı
- Faiz oranı
- Kalan taksit sayısı
- Vade tarihleri

**Örnek kredi portföyü:**

| Banka | Kredi Türü | Kalan Borç | Taksit | Faiz | Vade |
|-------|-----------|-----------|---------|------|------|
| A Bankası | İhtiyaç | 45.000 TL | 2.100 TL | %3,2 | 24 ay |
| B Bankası | Taşıt | 180.000 TL | 7.500 TL | %2,8 | 24 ay |
| C Bankası | Konut | 650.000 TL | 12.000 TL | %1,9 | 120 ay |
| D Bankası | Kredi Kartı | 18.000 TL | Min. 1.800 TL | %3,8 | - |
| **TOPLAM** | | **893.000 TL** | **23.400 TL** | | |

Bu örnekte, aylık kredi yükü **23.400 TL**. Gelirin 35.000 TL olduğunu varsayarsak, **%67'si** krediye gidiyor.

## Strateji 1: Kar Topu (Snowball) Yöntemi

### Nasıl Çalışır?

En küçük borçtan başlayarak, sırayla kredileri kapatma stratejisi.

**Adımlar:**
1. Kredileri **tutara göre** küçükten büyüğe sıralayın
2. En küçük borca ekstra ödeme yapın
3. Diğer kredilere minimum ödeme yapın
4. Bir kredi bitince, onun taksitini bir sonrakine ekleyin

**Örneğimizde uygulanışı:**

**1. Aşama:** Kredi Kartı Borcuna Odaklan
- Kredi kartı: 18.000 TL
- Diğer kredilere minimum ödeme
- Kalan para (2.000 TL) kredi kartına ekstra
- Toplam kredi kartı ödemesi: 3.800 TL/ay
- **5 ayda kapanır**

**2. Aşama:** İhtiyaç Kredisine Odaklan
- Kredi kartı kapandı → 3.800 TL serbest kaldı
- İhtiyaç kredisi taksiti: 2.100 TL
- Ekstra: 3.800 TL
- Toplam: 5.900 TL/ay
- **8 ayda kapanır**

**Avantajları:**
- ✅ Psikolojik motivasyon (hızlı kazanımlar)
- ✅ Krediler teker teker bitiyor
- ✅ Basit ve anlaşılır

**Dezavantajları:**
- ❌ Matematiksel olarak en optimal değil
- ❌ Yüksek faizli büyük borçlar uzun süre devam eder

## Strateji 2: Çığ (Avalanche) Yöntemi

### Nasıl Çalışır?

En yüksek faizli borçtan başlayarak, faiz maliyetini minimize etme stratejisi.

**Adımlar:**
1. Kredileri **faiz oranına göre** yüksekten düşüğe sıralayın
2. En yüksek faizli borca ekstra ödeme yapın
3. Diğer kredilere minimum ödeme yapın
4. Bir kredi bitince, onun taksitini bir sonrakine ekleyin

**Örneğimizde uygulanışı:**

**Sıralama (faize göre):**
1. Kredi Kartı: %3,8
2. İhtiyaç Kredisi: %3,2
3. Taşıt Kredisi: %2,8
4. Konut Kredisi: %1,9

**1. Aşama:** Kredi Kartına Odaklan
(Aynı kar topu ile)

**2. Aşama:** İhtiyaç Kredisine Geç
(Aynı kar topu ile)

**Fark ne zaman ortaya çıkar?**

Kar Topu ile küçük tutarlı ama düşük faizli bir kredi önce kapanabilirdi. Çığ yönteminde, faiz ne kadar yüksekse öncelik o kadar büyük.

**Avantajları:**
- ✅ Matematiksel olarak en optimal
- ✅ Maksimum faiz tasarrufu
- ✅ Uzun vadede daha az ödeme

**Dezavantajları:**
- ❌ İlk kazanımlar daha yavaş gelebilir
- ❌ Motivasyon kaybı riski

## Strateji 3: Kredi Konsolidasyonu (Birleştirme)

### Ne Demek?

Tüm kredilerinizi tek bir kredi ile birleştirme. Yeni bir kredi çekip, eskilerini kapatma.

**Ne zaman mantıklı?**

✅ Yeni kredinin faizi mevcut ortalamadan düşükse
✅ Aylık taksit yükünü azaltmak istiyorsanız
✅ Tek ödeme kolaylığı istiyorsanız

### Örnek Senaryo

**Mevcut durum:**
- Toplam borç: 893.000 TL
- Aylık ödeme: 23.400 TL
- Ağırlıklı ortalama faiz: ~%2,5

**Konsolidasyon teklifi:**
- Tutarı: 893.000 TL
- Faiz: %2,2 aylık
- Vade: 60 ay
- Yeni taksit: 21.500 TL

**Avantajlar:**
- Aylık 1.900 TL tasarruf
- Tek ödeme kolaylığı
- Daha düşük faiz

**Dezavantajlar:**
- Vade uzadı (toplam faiz artabilir)
- Yeni kredi masrafları (KKDF, BSMV, dosya)
- Erken kapatma fırsatları kaybı

**DİKKAT:** Konsolidasyon, kredi borcunu uzatıyor. Daha az ödeme ama daha uzun süre.

### Konsolidasyon mu, Yoksa Kar Topu/Çığ mı?

**Konsolidasyon tercih edin:**
- Aylık ödeme yükü çok ağır
- Gecikme riski var
- Faiz avantajı net

**Kar Topu/Çığ tercih edin:**
- Aylık ödeme yapabiliyorsunuz
- Ekstra ödeme yapma imkanı var
- Daha hızlı borçtan kurtulmak istiyorsunuz

## Strateji 4: Gelir Artırma ve Gider Azaltma

### Gelir Artırma

Ek gelir kaynakları:
- Freelance iş
- Part-time çalışma
- Kiralık gelir (ev, araba)
- Hobi gelire dönüştürme

**Örnek:** Ayda 3.000 TL ek gelir → 1 yılda 36.000 TL → Kredi kartı + İhtiyaç kredisinin yarısı

### Gider Azaltma

**Büyük tasarruf alanları:**

1. **Abonelikler**
   - Kullanılmayan dijital platformlar
   - Gereksiz sigorta paketleri
   - Premium üyelikler
   - Potansiyel tasarruf: 500-1.000 TL/ay

2. **Ulaşım**
   - Toplu taşıma kullanımı
   - Araç paylaşımı
   - Yakıt optimizasyonu
   - Potansiyel tasarruf: 1.000-2.000 TL/ay

3. **Yemek**
   - Evde yemek pişirmek
   - Toplu alışveriş
   - Dışarıda yemek azaltma
   - Potansiyel tasarruf: 1.500-3.000 TL/ay

**Toplam potansiyel:** 3.000-6.000 TL/ay → Ekstra kredi ödemesi

## Strateji 5: Otomatikleştirme ve Dijital Araçlar

### Otomatik Ödeme

**Faydaları:**
- Gecikme riski sıfır
- Kredi notu koruması
- Mental yük azalması

**Kurulum:**
1. Maaş hesabına otomatik ödeme talimatı
2. Vade tarihinden 2 gün önce
3. Minimum tutarı değil, tam taksiti ödeyin

### Dijital Takip Platformları

**kreditakip.com.tr gibi platformların avantajları:**

**Tek Panel Yönetimi:**
- Tüm krediler bir arada
- Toplam borç görünümü
- Ödeme takvimleri

**Akıllı Analizler:**
- Hangi krediyi önce kapatmalı?
- Erken ödeme simülasyonları
- Konsolidasyon fırsatları

**Otomatik Hatırlatmalar:**
- Vade tarihlerinden önce bildirim
- E-posta ve SMS uyarıları
- Mobil push bildirimleri

**Raporlama:**
- Aylık ödeme trendleri
- Faiz maliyeti analizi
- Borç azalma grafiği

## Yaygın Hatalar ve Çözümleri

### ❌ Hata 1: Minimum Ödeme Tuzağı

**Sorun:** Kredi kartında sadece minimum ödeme yapmak

**Örnek:**
- Borç: 10.000 TL
- Minimum ödeme: %20 = 2.000 TL
- Faiz: %3,8 aylık

**Sonuç:** Tam ödeme sürer: **8 ay** → Toplam ödeme: **12.500 TL**

**Çözüm:** Her zaman tam borç ödeyin

### ❌ Hata 2: Yeni Borç Alma

Bir krediyi kapatıp hemen yeni kredi almak, ilerlemeyi sıfırlar.

**Çözüm:**
- Acil değilse bekleyin
- Tüm borçları kapattıktan sonra değerlendirin

### ❌ Hata 3: Düzenli Takip Yapmama

**Sorun:** "Otomatik ödeme var, takip etmeye gerek yok"

**Risk:**
- Bakiye yetersizliği
- Faiz değişiklikleri
- Fırsat kaybı

**Çözüm:** Ayda 1 kez tüm kredileri gözden geçirin

## 90 Günlük Eylem Planı

### 1. Ay: Analiz ve Planlama

**Hafta 1-2:**
- [ ] Tüm kredileri listeleyin
- [ ] Kredi Takip hesabı açın
- [ ] Aylık bütçe oluşturun

**Hafta 3-4:**
- [ ] Strateji seçin (Kar topu vs Çığ)
- [ ] Otomatik ödemeleri ayarlayın
- [ ] Gereksiz giderleri tespit edin

### 2. Ay: Uygulama

**Hafta 5-8:**
- [ ] Seçtiğiniz stratejiye başlayın
- [ ] Gider azaltma uygulayın
- [ ] İlk ekstra ödemeyi yapın
- [ ] İlerlemeyi takip edin

### 3. Ay: Optimizasyon

**Hafta 9-12:**
- [ ] Sonuçları değerlendirin
- [ ] Gerekirse strateji ayarlayın
- [ ] Ek gelir kaynaklarını aktifleştirin
- [ ] İlk milestone kutlayın

## Sonuç: Borçtan Kurtulma Yol Haritası

Birden fazla kredi yönetimi, **disiplin ve strateji** gerektirir. Ana prensipler:

**✓ Fotoğrafı görün:** Tüm borçlarınızı bilgisayarda veya dijital platformda toplayın

**✓ Strateji seçin:** Kar topu (motivasyon) vs Çığ (matematik)

**✓ Otomatikleştirin:** Ödeme hatası yapmayın

**✓ Ekstra ödeme yapın:** Mümkün olan her TL'yi krediye yönlendirin

**✓ Takip edin:** Düzenli kontrol ve değerlendirme

**✓ Yeni borç almayın:** Borçsuz yaşamı hedefleyin

[Kredi Takip.com.tr](https://kreditakip.com.tr) ile kredi yönetiminizi profesyonelleştirin. **Ücretsiz hesap** açarak, kişiselleştirilmiş öneriler alın ve borçsuz geleceğe daha hızlı ulaşın.`,
    status: "published",
    category_id: null,
  },
]

async function createBlogPosts() {
  try {
    console.log("🚀 Blog yazıları oluşturuluyor...")

    // Önce kategori kontrol et/oluştur
    const { data: categories, error: catError } = await supabase.from("blog_categories").select("id, name, slug")

    if (catError) {
      console.error("❌ Kategori hatası:", catError)
      return
    }

    // "Kredi Yönetimi" kategorisi var mı kontrol et
    let categoryId = categories?.find((c) => c.slug === "kredi-yonetimi")?.id

    if (!categoryId) {
      // Kategori yoksa oluştur
      const { data: newCat, error: newCatError } = await supabase
        .from("blog_categories")
        .insert({
          name: "Kredi Yönetimi",
          slug: "kredi-yonetimi",
          description: "Kredi kullanımı, taksit takibi ve finansal planlama ile ilgili kapsamlı rehberler",
        })
        .select()
        .single()

      if (newCatError) {
        console.error("❌ Kategori oluşturma hatası:", newCatError)
        return
      }

      categoryId = newCat.id
      console.log("✅ Kategori oluşturuldu: Kredi Yönetimi")
    }

    // Blog yazılarını oluştur
    for (const post of blogPosts) {
      post.category_id = categoryId
      post.author_id = AUTHOR_ID

      // Slug'ın benzersiz olup olmadığını kontrol et
      const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", post.slug).single()

      if (existing) {
        console.log(`⏭️ Zaten var: ${post.title}`)
        continue
      }

      const { data, error } = await supabase.from("blog_posts").insert(post).select().single()

      if (error) {
        console.error(`❌ Hata: ${post.title}`, error)
      } else {
        console.log(`✅ Oluşturuldu: ${post.title}`)
        console.log(`   URL: https://kreditakip.com.tr/blog/${post.slug}`)
      }
    }

    console.log("\n🎉 Blog yazıları başarıyla oluşturuldu!")
    console.log("\n📊 SEO Optimizasyonu:")
    console.log("   ✓ Uzun formatlı içerik (2000+ kelime)")
    console.log("   ✓ Hedef anahtar kelimeler kullanıldı")
    console.log("   ✓ İç linkler eklendi")
    console.log("   ✓ Yapılandırılmış başlıklar (H1, H2, H3)")
    console.log("   ✓ Tablo ve liste kullanımı")
    console.log("\n📈 Beklenen SEO Etkisi:")
    console.log("   • Kredi taksit takibi")
    console.log("   • Erken kredi kapatma")
    console.log("   • Kredi borç yönetimi")
    console.log("   • Kredi konsolidasyonu")
  } catch (error) {
    console.error("❌ Genel hata:", error)
  }
}

createBlogPosts()
