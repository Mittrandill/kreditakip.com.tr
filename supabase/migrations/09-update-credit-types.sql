-- Önce mevcut kredi türlerini temizle
DELETE FROM credit_types;

-- Yeni kredi türlerini ekle
INSERT INTO credit_types (name, description, category) VALUES
-- 🏠 Bireysel Krediler (Tüketici Kredileri)
('İhtiyaç Kredisi', 'Genel ihtiyaçlar için kullanılan tüketici kredisi', 'Bireysel Krediler'),
('Taşıt Kredisi', 'Araç alımı için kullanılan kredi', 'Bireysel Krediler'),
('Konut Kredisi', 'Ev alımı için kullanılan mortgage kredisi', 'Bireysel Krediler'),
('Eğitim Kredisi', 'Eğitim masrafları için kullanılan kredi', 'Bireysel Krediler'),
('Tatil Kredisi', 'Tatil ve seyahat masrafları için kredi', 'Bireysel Krediler'),
('Teknoloji Kredisi', 'Elektronik eşya alımı için kredi', 'Bireysel Krediler'),
('Borç Transfer Kredisi', 'Mevcut borçların konsolidasyonu için kredi', 'Bireysel Krediler'),

-- 🏢 Ticari Krediler (KOBİ ve Kurumsal)
('İşletme Kredisi', 'İşletme sermayesi ihtiyaçları için kredi', 'Ticari Krediler'),
('Spot Kredi', 'Kısa vadeli işletme finansmanı', 'Ticari Krediler'),
('Rotatif Kredi', 'Döner sermaye kredisi', 'Ticari Krediler'),
('Yatırım Kredisi', 'Sabit yatırımlar için uzun vadeli kredi', 'Ticari Krediler'),
('İhracat Kredisi', 'İhracat işlemleri için finansman', 'Ticari Krediler'),
('Hammadde Kredisi', 'Hammadde ve emtia alımı için kredi', 'Ticari Krediler'),

-- 🚜 Tarım Kredileri
('Tarımsal Girdi Kredisi', 'Tohum, gübre, mazot kredileri', 'Tarım Kredileri'),
('Hayvancılık Kredisi', 'Hayvancılık yatırımları için kredi', 'Tarım Kredileri'),
('Tarımsal Ekipman Kredisi', 'Traktör, biçerdöver vb. ekipman kredisi', 'Tarım Kredileri'),
('Genç Çiftçi Kredisi', 'Genç çiftçiler için özel destek kredisi', 'Tarım Kredileri'),
('Ziraat Destek Kredisi', 'Ziraat Bankası özel destek kredileri', 'Tarım Kredileri'),

-- 🕌 Katılım (Faizsiz) Kredileri
('İhtiyaç Finansmanı', 'Faizsiz ihtiyaç finansmanı', 'Katılım Kredileri'),
('Taşıt Finansmanı', 'Faizsiz araç finansmanı', 'Katılım Kredileri'),
('Konut Finansmanı', 'Faizsiz ev finansmanı', 'Katılım Kredileri'),
('Ticari Finansman', 'Faizsiz ticari finansman', 'Katılım Kredileri'),
('Leasing Finansmanı', 'Finansal kiralama', 'Katılım Kredileri'),
('Murabaha Finansmanı', 'İslami finans yöntemleri', 'Katılım Kredileri'),

-- 💳 Kredi Kartı ve Ek Hesap Kredileri
('Taksitli Nakit Avans', 'Kredi kartından taksitli nakit çekme', 'Kredi Kartı Kredileri'),
('Ekstra Taksit', 'Kredi kartı ekstra taksit / erteleme', 'Kredi Kartı Kredileri'),
('Kredili Mevduat Hesabı', 'KMH - Eksi bakiye imkanı', 'Kredi Kartı Kredileri'),
('Avans Hesap', 'Maaş avansı ve benzeri', 'Kredi Kartı Kredileri'),

-- 🌍 Dövizli ve Yurtdışı Krediler
('Döviz Kredisi', 'USD, EUR vb. dövizli krediler', 'Dövizli Krediler'),
('Yurtdışı Eğitim Kredisi', 'Yurtdışı eğitim için özel kredi', 'Dövizli Krediler'),
('Eximbank Kredisi', 'İhracat-ithalat finansmanı', 'Dövizli Krediler'),
('Uluslararası Ticaret Kredisi', 'Dış ticaret işlemleri için kredi', 'Dövizli Krediler'),

-- 🏗️ Proje ve Yatırım Kredileri
('Enerji Proje Kredisi', 'Enerji sektörü yatırım kredisi', 'Proje Kredileri'),
('Yenilenebilir Enerji Kredisi', 'Güneş, rüzgar vb. enerji kredisi', 'Proje Kredileri'),
('Altyapı Proje Kredisi', 'Büyük altyapı projesi finansmanı', 'Proje Kredileri'),
('Gayrimenkul Geliştirme Kredisi', 'Gayrimenkul projesi finansmanı', 'Proje Kredileri'),

-- 🛠️ Alternatif Finansman Yöntemleri
('Finansal Kiralama', 'Leasing - ekipman kiralaması', 'Alternatif Finansman'),
('Faktoring', 'Alacak devri finansmanı', 'Alternatif Finansman'),
('Forfaiting', 'Uluslararası alacak finansmanı', 'Alternatif Finansman');
