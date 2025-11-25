-- Kredi kartı türleri tablosunu oluştur
CREATE TABLE IF NOT EXISTS credit_card_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  card_network VARCHAR(100) NOT NULL,
  program VARCHAR(100),
  segment VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  card_type VARCHAR(100) NOT NULL,
  description TEXT,
  annual_fee_info VARCHAR(255),
  special_features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikalarını etkinleştir
ALTER TABLE credit_card_types ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir politikası
CREATE POLICY "Anyone can read credit card types" ON credit_card_types
  FOR SELECT USING (is_active = true);

-- Kredi kartı türlerini ekle
INSERT INTO credit_card_types (name, bank_name, card_network, program, segment, category, card_type, description, annual_fee_info, special_features) VALUES

-- Akbank Kartları
('Axess', 'Akbank', 'Visa/Mastercard', 'Axess', 'Standart/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Akbank''ın ana kredi kartı. Axess programı sayesinde taksitli alışveriş ve chip-para puan kazanma imkânı sunar.', 'Yıllık aidat var', ARRAY['Chip-para puan kazanma', 'Taksitli alışveriş', 'Axess kampanyaları']),
('Axess Free', 'Akbank', 'Visa/Mastercard', 'Axess', 'Standart', 'Aidatsız Kartlar', 'Aidatsız kredi kartı', 'Axess programlı, yıllık aidat ücreti olmayan versiyonudur.', 'Aidatsız', ARRAY['Chip-para kazanma', 'Taksit imkânı', 'Axess kampanyaları']),
('Wings', 'Akbank', 'Mastercard', 'Wings', 'Standart/Black', 'Seyahat Kartları', 'Seyahat kartı', 'Akbank''ın uçuş mili kazandıran kredi kartı. Wings Mil puanı biriktirerek uçak bileti alabilirsiniz.', 'Yıllık aidat var', ARRAY['Wings Mil kazanma', 'THY entegrasyonu', 'Lounge erişimi']),
('Axess Öğrenci', 'Akbank', 'Visa/Mastercard', 'Axess', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kredi kartı', '18–26 yaş arası üniversite öğrencilerine özeldir. İlk yıl aidat alınmaz.', 'İlk yıl aidatsız', ARRAY['Öğrenci kampanyaları', 'Düşük limit', 'Chip-para kazanma']),

-- Albaraka Türk Kartları
('Albaraka World', 'Albaraka Türk', 'Visa/Mastercard', 'World', 'Klasik/Gold/Platinum', 'Katılım Kartları', 'Katılım kredi kartı', 'Albaraka Türk''ün Worldcard kredi kartlarıdır. Faizsiz çalışma prensibi ile borçlara kâr payı uygulanır.', 'Yıllık aidat var', ARRAY['Worldpuan kazanma', 'Faizsiz çalışma', 'Taksitli alışveriş']),
('World Eflatun', 'Albaraka Türk', 'Visa/Mastercard', 'World', 'Kadın Kart', 'Kadın Kartları', 'Katılım kredi kartı', 'Albaraka''nın kadın müşterilere yönelik özel World kredi kartıdır.', 'Yıllık aidat var', ARRAY['Kadınlara özel kampanyalar', 'Worldpuan kazanma', 'Giyim-sağlık avantajları']),
('World Trend', 'Albaraka Türk', 'Visa/Mastercard', 'World', 'Genç Kart', 'Öğrenci Kartları', 'Katılım kredi kartı', 'Genç müşteriler için tasarlanmış Worldcard kredi kartıdır.', 'Düşük aidat/Aidatsız', ARRAY['Gençlere özel kampanyalar', 'Worldpuan kazanma', 'Taksit imkânı']),

-- Alternatifbank Kartları
('Alternatif Bonus', 'Alternatifbank', 'Visa/Mastercard', 'Bonus', 'Classic/Gold/Premium', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Alternatifbank''ın Bonus özellikli kredi kartıdır. Harcamalardan Bonus puan kazandırır.', 'Yıllık aidat var', ARRAY['Bonus puan kazanma', 'Taksitli alışveriş', 'Bonus kampanyaları']),
('Alternatif Bonus Aidatsız', 'Alternatifbank', 'Visa/Mastercard', 'Bonus', 'Standart', 'Aidatsız Kartlar', 'Aidatsız kredi kartı', 'Yıllık kart ücreti ödemek istemeyen müşteriler için aidatsız Bonus kart seçeneğidir.', 'Aidatsız', ARRAY['Bonus puan kazanma', 'Taksit imkânı', 'Aidat yok']),

-- DenizBank Kartları
('DenizBank Bonus', 'DenizBank', 'Visa/Mastercard', 'Bonus', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'DenizBank''ın sunduğu Bonus kart ailesi. Bonus programı ile taksit ve puan kazandırma özellikleri vardır.', 'Yıllık aidat var', ARRAY['Bonus puan kazanma', 'Taksitli alışveriş', 'Geniş üye işyeri ağı']),
('GS Bonus', 'DenizBank', 'Visa/Mastercard', 'Bonus', 'Taraftar Kart', 'Ortak Markalı Kartlar', 'Ortak markalı kart', 'DenizBank''ın Galatasaray taraftar kartı. Takımına destek için ekstra katkı payı içerir.', 'Yıllık aidat var', ARRAY['Galatasaray kampanyaları', 'Bonus puan kazanma', 'Takım desteği']),
('FB Bonus', 'DenizBank', 'Visa/Mastercard', 'Bonus', 'Taraftar Kart', 'Ortak Markalı Kartlar', 'Ortak markalı kart', 'Fenerbahçe taraftar kartı. Harcamaların bir kısmı kulübe destek olur.', 'Yıllık aidat var', ARRAY['Fenerbahçe kampanyaları', 'Bonus puan kazanma', 'Kulüp desteği']),
('BJK Bonus', 'DenizBank', 'Visa/Mastercard', 'Bonus', 'Taraftar Kart', 'Ortak Markalı Kartlar', 'Ortak markalı kart', 'Beşiktaş taraftar kartı. BJK''ye özel fırsatlar içerir.', 'Yıllık aidat var', ARRAY['Beşiktaş kampanyaları', 'Maç bileti önceliği', 'Bonus puan kazanma']),
('DenizBank Afili Bonus', 'DenizBank', 'Visa/Mastercard', 'Bonus', 'Platinum', 'Premium Kredi Kartları', 'Premium kart', 'DenizBank''ın "Afili Bankacılık" müşterilerine özel premium Bonus kartı.', 'Yüksek aidat', ARRAY['Lounge erişimi', 'Concierge hizmeti', 'Premium avantajlar']),
('D-Şarj Bonus', 'DenizBank', 'Visa/Mastercard', 'Bonus', 'Genç Kart', 'Öğrenci Kartları', 'Gençlere özel kart', 'DenizBank''ın gençlere yönelik Bonus kartı. Üniversite öğrencileri için tasarlanmıştır.', 'Düşük aidat', ARRAY['Gençlik kampanyaları', 'Bonus puan kazanma', 'Düşük ücret']),

-- Enpara Kartları
('Enpara.com Kredi Kartı', 'QNB Finansbank', 'Mastercard', 'Özel', 'Standart', 'Dijital Kartlar', 'Dijital bankacılık kartı', 'Yıllık kart aidatı olmayan bir kredi kartıdır. Nakit ödül veren ilk kart olmuştur.', 'Aidatsız + Nakit ödül', ARRAY['Yıllık 50 TL nakit ödül', 'Sonradan taksitlendirme', 'Dijital yönetim']),

-- Garanti BBVA Kartları
('Bonus Card', 'Garanti BBVA', 'Visa/Mastercard', 'Bonus', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Türkiye''de ilk çok markalı kart olan Bonus Card. Her alışverişte Bonus puan kazandırır.', 'Yıllık aidat var', ARRAY['Bonus puan kazanma', 'Geniş üye işyeri ağı', 'Taksitli alışveriş']),
('Bonus Flexi', 'Garanti BBVA', 'Visa/Mastercard', 'Bonus', 'Kişiselleştirilebilir', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Garanti''nin özelleştirilebilir Bonus kartıdır. Müşteri kartın özelliklerini kendisi belirleyebilir.', 'Değişken aidat', ARRAY['Kişiselleştirilebilir', 'Esnek ücret', 'Bonus avantajları']),
('Shop&Fly', 'Garanti BBVA', 'Visa/Mastercard/Amex', 'Miles&Smiles', 'Platinum', 'Seyahat Kartları', 'Seyahat kartı', 'Türk Hava Yolları ile ortak markalı seyahat kartıdır. Harcamalardan Mil puan kazanır.', 'Yüksek aidat', ARRAY['THY mil kazanma', 'Lounge erişimi', 'Seyahat sigortası']),
('American Express', 'Garanti BBVA', 'American Express', 'Membership Rewards', 'Green/Gold/Platinum', 'Premium Kredi Kartları', 'Premium kredi kartı', 'Garanti BBVA''nın American Express kartları. Membership Rewards programı ile puan kazandırır.', 'Yüksek aidat', ARRAY['Membership Rewards', 'Premium hizmetler', 'Metal kart seçeneği']),
('Money Bonus', 'Garanti BBVA', 'Visa/Mastercard', 'Bonus', 'Ortak Markalı', 'Ortak Markalı Kartlar', 'Mağaza ortak kartı', 'Migros ve iştiraklerinde avantajlı alışveriş için Bonus ile Migros Money programının birleşimi.', 'Yıllık aidat var', ARRAY['Migros avantajları', 'Money puan kazanma', 'Özel taksitler']),
('Bonus Genç', 'Garanti BBVA', 'Visa/Mastercard', 'Bonus', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kredi kartı', 'Garanti''nin 18-25 yaş arası gençlere sunduğu düşük aidatlı Bonus karttır.', 'Düşük aidat/Aidatsız', ARRAY['Gençlere özel kampanyalar', 'Harçlık avans', 'Festival indirimleri']),

-- Halkbank Kartları
('Paraf', 'Halkbank', 'Visa/Mastercard', 'Paraf', 'Standart/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Halkbank''ın Paraf kart ailesinin temel ürünleri. ParafPara puan kazanma imkânı sunar.', 'Yıllık aidat var', ARRAY['ParafPara kazanma', 'Temassız ödeme', 'Geniş üye işyeri ağı']),
('Parafly', 'Halkbank', 'Visa/Mastercard', 'Paraf', 'Seyahat/Platinum', 'Seyahat Kartları', 'Seyahat odaklı kart', 'Paraf programının uçuş ve seyahat odaklı özel kartıdır. Seyahat harcamalarından daha fazla puan kazanılır.', 'Yüksek aidat', ARRAY['Seyahat puanları', 'Lounge hizmeti', 'Seyahat sigortası']),
('Paraf Genç', 'Halkbank', 'Visa/Mastercard', 'Paraf', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kredi kartı', '18-26 yaş arası gençler ve üniversite öğrencileri için özel Paraf karttır.', 'Aidatsız/Düşük aidat', ARRAY['Gençlere özel indirimler', 'Eğitim taksitleri', 'ParafPara kazanma']),
('Paraf Kadın', 'Halkbank', 'Visa/Mastercard', 'Paraf', 'Kadın Kart', 'Kadın Kartları', 'Özel segment kartı', 'Kadın müşterilere yönelik tasarlanmış Paraf kredi kartıdır.', 'Standart aidat', ARRAY['Kadınlara özel kampanyalar', 'Sağlık taksitleri', 'Kozmetik indirimleri']),
('Paraf Doğal', 'Halkbank', 'Visa/Mastercard', 'Paraf', 'Yeşil Kart', 'Özel Segment Kartları', 'Özel amaçlı kart', 'Doğa ve çevre dostu tüketimi teşvik eden özel Paraf kartıdır.', 'Standart aidat', ARRAY['Çevreci bağışlar', 'Yeşil kampanyalar', 'Fidan bağışı']),
('Halkcard', 'Halkbank', 'Visa/Mastercard', 'Yok', 'Standart', 'Aidatsız Kartlar', 'Aidatsız kredi kartı', 'Halkbank''ın yıllık aidatı olmayan kredi kartıdır.', 'Aidatsız', ARRAY['Aidat yok', 'Taksitli alışveriş', 'Temel ihtiyaçlar']),
('Paraf Emekli', 'Halkbank', 'Visa/Mastercard', 'Paraf', 'Emekli Kart', 'Özel Segment Kartları', 'Özel segment kartı', 'Emeklilere özel ayrıcalıklar sunan Paraf kredi kartıdır.', 'Aidatsız/Düşük aidat', ARRAY['Emekli avantajları', 'Sağlık indirimleri', 'Fatura bonusu']),
('Paraf Sanal', 'Halkbank', 'Sanal Kart', 'Paraf', 'Sanal Kart', 'Dijital Kartlar', 'Sanal kredi kartı', 'Mevcut Paraf kredi kartına bağlı sanal karttır. İnternet alışverişlerinde güvenli ödeme için kullanılır.', 'Aidat yok', ARRAY['İnternet güvenliği', 'Esnek limit', 'ParafPara kazanma']),

-- HSBC Kartları
('Advantage Classic', 'HSBC', 'Visa/Mastercard', 'Advantage', 'Classic', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'HSBC''nin Advantage programlı temel kredi kartı. Advantage Para puan kazandırır.', 'Standart aidat', ARRAY['Advantage puan kazanma', 'Geniş üye işyeri ağı', 'Taksitli alışveriş']),
('Advantage Gold', 'HSBC', 'Visa/Mastercard', 'Advantage', 'Gold', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Classic''in bir üst segmentidir. Belirli sektörlerde ekstra puan avantajı sunar.', 'Orta seviye aidat', ARRAY['%25 fazla puan', 'Özel kampanyalar', 'Yüksek limit']),
('Advantage Platinum', 'HSBC', 'Visa/Mastercard', 'Advantage', 'Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'HSBC''nin üst segment kartı. Yüksek harcamalarda daha fazla puan kazanma imkânı.', 'Yüksek aidat', ARRAY['%50 fazla puan', 'Seyahat indirimleri', 'Premium avantajlar']),
('HSBC Premier Card', 'HSBC', 'Visa/Mastercard', 'Advantage/Premier', 'Premium', 'Premium Kredi Kartları', 'Premium kredi kartı', 'HSBC Premier müşterilerine özel kredi kartı. Visa Signature seviyesindedir.', 'Premier müşterilere özel', ARRAY['Global lounge erişimi', 'Concierge hizmeti', 'Premier avantajları']),

-- ING Kartları
('ING Bonus Card', 'ING', 'Visa/Mastercard', 'Bonus', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'ING Bank''ın Bonus özellikli kredi kartı. Taksitli borç transferi kampanyalarıyla öne çıkar.', 'Yıllık aidat var', ARRAY['Bonus puan kazanma', 'Borç transferi', 'Düşük faiz kampanyaları']),
('ING Pegasus BolBol Classic', 'ING', 'Mastercard', 'Pegasus BolBol', 'Classic', 'Ortak Markalı Kartlar', 'Ortak markalı kart', 'Pegasus Hava Yolları ile ING işbirliğindeki kredi kartı. BolPuan kazandırır.', 'Düşük aidat', ARRAY['Pegasus BolPuan', 'Uçak bileti avantajları', 'Ek bagaj']),
('ING Pegasus BolBol Premium', 'ING', 'Mastercard World Elite', 'Pegasus BolBol', 'Premium', 'Seyahat Kartları', 'Ortak markalı kart', 'Pegasus BolBol programının premium kredi kartı. Mastercard World Elite seviyesindedir.', 'Yüksek aidat', ARRAY['Fazla BolPuan', 'Lounge giriş hakkı', 'Koltuk yükseltme']),

-- Kuveyt Türk Kartları
('Sağlam Kart', 'Kuveyt Türk', 'Visa/Mastercard/Troy', 'Altın Puan', 'Standart/Gold/Platinum', 'Katılım Kartları', 'Katılım kredi kartı', 'Kuveyt Türk''ün faizsiz kredi kartıdır. Yıllık aidat ücreti yoktur.', 'Aidatsız + 50 TL hediye', ARRAY['Yıllık 50 TL Altın Puan hediye', 'Faizsiz çalışma', 'Eğitim-sağlık taksitleri']),
('Sağlam Kart Üniversite', 'Kuveyt Türk', 'Visa/Troy', 'Altın Puan', 'Genç Kart', 'Öğrenci Kartları', 'Katılım kredi kartı', 'Öğrencilere özel Sağlam Kart versiyonudur. 18-25 yaş arası gençlere sunulur.', 'Aidatsız', ARRAY['Harçlık avans', 'KYK bursu desteği', 'Faizsiz nakit çekim']),
('Miles&Smiles Kuveyt Türk', 'Kuveyt Türk', 'Visa Platinum', 'THY Miles&Smiles', 'Platinum', 'Seyahat Kartları', 'Seyahat kartı', 'Kuveyt Türk''ün Türk Hava Yolları ile ortak kredi kartı. Miles&Smiles programına mil kazandırır.', 'Yüksek aidat', ARRAY['THY mil kazanma', 'Lounge erişimi', 'Faizsiz mil taksitlendirme']),

-- Odeabank Kartları
('Bank''O Card', 'Odeabank', 'Visa/Mastercard', 'Yok', 'Standart/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Odeabank''ın kendi markasıyla sunduğu kredi kartıdır.', 'Aidatsız seçenek var', ARRAY['Güvenli alışveriş', 'Taksitli nakit avans', 'Esnek ödemeler']),
('Bank''O Axess', 'Odeabank', 'Visa/Mastercard', 'Axess', 'Standart', 'Ortak Markalı Kartlar', 'Ortak markalı kart', 'Odeabank ve Akbank işbirliğiyle sunulan Axess programlı kredi kartıdır.', 'Standart aidat', ARRAY['Axess chip-para', 'Axess kampanyaları', 'Taksit avantajları']),

-- QNB Finansbank Kartları
('CardFinans', 'QNB Finansbank', 'Visa/Mastercard', 'CardFinans', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'QNB Finansbank''ın geleneksel kredi kartı serisidir. ParaPuan kazandıran program kullanır.', 'Yıllık aidat var', ARRAY['ParaPuan kazanma', 'Taksitli alışveriş', 'Fatura talimatı bonusu']),
('CardFinans Xtra', 'QNB Finansbank', 'Visa/Mastercard', 'CardFinans', 'Standart', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'CardFinans ailesinin alışveriş harcamalarına ek taksit ve indirim sunan versiyonu.', 'Standart aidat', ARRAY['Ek taksit imkânı', '% indirim kampanyaları', 'ParaPuan kazanma']),
('Fix Card', 'QNB Finansbank', 'Visa/Mastercard', 'CardFinans', 'Standart', 'Aidatsız Kartlar', 'Aidatsız kredi kartı', 'Yıllık ücret ödemek istemeyenler için Finansbank''ın sunduğu aidatsız kredi kartıdır.', 'Aidatsız', ARRAY['Aidat yok', 'ParaPuan kazanma', 'Küçük hizmet ücreti']),
('CardFinans GO', 'QNB Finansbank', 'Visa/Mastercard', 'CardFinans', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kredi kartı', 'Üniversite öğrencilerine özel düşük limitli CardFinans kartıdır.', 'İlk yıl aidatsız', ARRAY['Gençlere özel kampanyalar', 'Toplu taşıma indirimi', 'Esnek ödeme']),
('Trendyol QNB Finansbank', 'QNB Finansbank', 'Mastercard', 'Trendyol', 'Standart', 'Dijital Kartlar', 'Ortak markalı dijital kart', 'QNB Finansbank''ın Trendyol ile çıkardığı kredi kartıdır.', 'Ömür boyu aidatsız', ARRAY['Trendyol indirimleri', 'Dijital başvuru', 'E-ticaret avantajları']),
('Miles&Smiles QNB', 'QNB Finansbank', 'Visa/Mastercard', 'THY Miles&Smiles', 'Classic/Privé', 'Seyahat Kartları', 'Seyahat kartı', 'QNB Finansbank''ın Türk Hava Yolları ile Miles&Smiles kredi kartları.', 'Yıllık aidat var', ARRAY['THY mil kazanma', 'LoungeKey erişimi', 'Seyahat sigortası']),

-- Şekerbank Kartları
('Şeker Bonus Kart', 'Şekerbank', 'Visa/Mastercard', 'Bonus', 'Classic/Gold', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Şekerbank''ın Bonus anlaşmalı kredi kartıdır. Bonus programının tüm özelliklerini sunar.', 'E-ekstre ile indirimli', ARRAY['Bonus puan kazanma', 'Memur-Sen aidatsız seçenek', 'Kamu çalışanı avantajları']),

-- TEB Kartları
('TEB Bonus Card', 'TEB', 'Visa/Mastercard', 'Bonus', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'TEB''in sunduğu Bonus Card. Garanti BBVA Bonus programının tüm özelliklerini barındırır.', 'Segment bazlı aidat', ARRAY['Bonus puan kazanma', 'Geniş kampanya portföyü', 'Market-akaryakıt indirimleri']),
('TEB She Card', 'TEB', 'Visa/Mastercard', 'Bonus', 'Kadın Kart', 'Kadın Kartları', 'Özel segment kartı', 'Kadın müşterilere özel tasarlanmış Bonus özellikli karttır.', 'Standart aidat', ARRAY['%5 ekstra bonus puan', 'Sağlık faizsiz taksit', 'Kadın yaşam stili avantajları']),
('TEB Platinum Card', 'TEB', 'Visa/Mastercard', 'Bonus', 'Platinum', 'Premium Kredi Kartları', 'Premium kredi kartı', 'TEB''in üst gelir grubu müşterilerine sunduğu Bonus Platinum kartıdır.', 'Yüksek aidat', ARRAY['Concierge hizmetleri', 'Havalimanı transferi', 'Premium bonus kazanımı']),
('TEB Signature Card', 'TEB', 'Visa', 'Bonus', 'Premium', 'Premium Kredi Kartları', 'Premium kredi kartı', 'TEB Yıldız müşterilerine yönelik, Visa Signature seviyesinde bir kredi kartıdır.', 'Yüksek aidat', ARRAY['Lounge erişimi', 'Kişisel asistans', 'Yüksek kredi limiti']),
('TEB Infinite Card', 'TEB', 'Visa', 'Bonus', 'Premium', 'Premium Kredi Kartları', 'Ultra-premium kredi kartı', 'TEB''in en seçkin müşterilerine sunduğu Visa Infinite seviyesindeki kredi kartıdır.', 'Çok yüksek aidat', ARRAY['VIP hizmetler', 'Özel etkinlik erişimi', 'Concierge hizmeti']),
('CEPTETEB Dijital Kart', 'TEB', 'Mastercard', 'Bonus', 'Standart', 'Dijital Kartlar', 'Dijital kredi kartı', 'TEB''in dijital bankacılık markası CEPTETEB kapsamında sunulan kredi kartıdır.', 'Aidatsız', ARRAY['Fiziksel kart yok', 'Mobil yönetim', 'Dijital güvenlik']),
('TEB Sade Kart', 'TEB', 'Visa/Mastercard', 'Bonus', 'Standart', 'Aidatsız Kartlar', 'Aidatsız kredi kartı', 'Yıllık kart aidatı olmayan TEB kredi kartıdır.', 'Aidatsız', ARRAY['Aidat yok', 'Bonus avantajları', 'Taksit imkânı']),
('TEB Yıldız Priority Card', 'TEB', 'Mastercard World', 'Bonus', 'Premium', 'Premium Kredi Kartları', 'Premium kredi kartı', 'TEB''in varlıklı "Yıldız Bankacılık" müşterilerine sunduğu Mastercard World seviyesinde karttır.', 'Yüksek aidat', ARRAY['Restoran indirimleri', 'Özel müşteri temsilcisi', 'World avantajları']),
('TEB Özel World Elite', 'TEB', 'Mastercard World Elite', 'World Elite', 'Premium', 'Premium Kredi Kartları', 'Ultra-premium kredi kartı', 'TEB Özel müşterilerine özeldir. Mastercard World Elite statüsündeki bu kart.', 'Davetli segment', ARRAY['Seçkin otel indirimleri', 'Kişiye özel ayrıcalıklar', 'En üst düzey hizmetler']),
('TEB Bonus Emekli Card', 'TEB', 'Visa/Mastercard', 'Bonus', 'Emekli Kart', 'Özel Segment Kartları', 'Özel segment kartı', 'TEB''in emekli maaş müşterilerine sunduğu Bonus karttır.', 'Aidatsız/Düşük aidat', ARRAY['Emeklilere özel taksitler', 'Otomatik fatura bonusu', 'Market ek taksiti']),
('TEB Bonus Sanal Kart', 'TEB', 'Sanal Kart', 'Bonus', 'Sanal Kart', 'Dijital Kartlar', 'Sanal kredi kartı', 'TEB''in online alışverişler için güvenli ödeme aracı olan sanal kartıdır.', 'Aidat yok', ARRAY['İnternet güvenliği', 'Esnek limit', 'Bonus puan kazanma']),

-- Türkiye Finans Kartları
('Happy Card Classic', 'Türkiye Finans', 'Visa/Mastercard', 'Bonus', 'Classic', 'Katılım Kartları', 'Katılım kredi kartı', 'Türkiye Finans Katılım Bankası''nın kredi kartı markası Happy Card''tır.', 'Makul aidat', ARRAY['Happy Bonus puan', 'Faizsiz çalışma', 'Kâr payı sistemi']),
('Happy Card Gold', 'Türkiye Finans', 'Visa/Mastercard', 'Bonus', 'Gold', 'Katılım Kartları', 'Katılım kredi kartı', 'Happy Card''ın bir üst segmenti. Umre harcamalarına taksit erteleme gibi özel kampanyalar sunar.', 'Orta seviye aidat', ARRAY['Umre taksit erteleme', 'Ek Bonus kampanyaları', 'Yüksek limit']),
('Happy Card Platinum', 'Türkiye Finans', 'Visa/Mastercard', 'Bonus', 'Platinum', 'Katılım Kartları', 'Katılım kredi kartı', 'En üst seviye Happy Card. Platinum müşterilere özel asistans hizmetleri sağlanır.', 'Yüksek aidat', ARRAY['Özel asistans', 'Havalimanı transfer indirimi', 'Faizsiz taksit']),
('Happy Zero Card', 'Türkiye Finans', 'Visa/Mastercard', 'Bonus', 'Standart', 'Aidatsız Kartlar', 'Aidatsız katılım kartı', 'Türkiye Finans''ın yıllık aidat almayan kredi kartıdır.', 'Aidatsız', ARRAY['Aidat yok', 'Happy Bonus puan', 'İlk yıl kampanyaları']),

-- VakıfBank Kartları
('VakıfBank Worldcard', 'VakıfBank', 'Visa/Mastercard', 'World', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'VakıfBank, Yapı Kredi''nin World programına dahil kredi kartları sunmaktadır.', 'Segment bazlı aidat', ARRAY['Worldpuan kazanma', 'Geniş kampanya yelpazesi', 'Market-akaryakıt avantajları']),
('Platinum Plus', 'VakıfBank', 'Visa/Mastercard', 'World/MilPlus', 'Platinum Plus', 'Seyahat Kartları', 'Seyahat odaklı premium kart', 'VakıfBank''ın MilPlus özellikli premium kartıdır. Yıllık kart aidatı yoktur.', 'Aidatsız', ARRAY['2 kat değerli puan kullanımı', 'Seyahat sigortası', 'Lounge hizmeti']),
('MilPlus Platinum', 'VakıfBank', 'Visa/Mastercard', 'World/MilPlus', 'Platinum', 'Seyahat Kartları', 'Seyahat kartı', 'VakıfBank World kartlarının seyahat ayrıcalıklı versiyonudur.', 'Standart aidat', ARRAY['1.5 kat değerli mil', 'Lounge erişimi', 'Otel taksit imkânı']),
('Like Card', 'VakıfBank', 'Visa/Mastercard', 'World', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kredi kartı', 'VakıfBank''ın üniversite öğrencilerine özel Worldcard''ıdır.', 'E-ekstre ile aidatsız', ARRAY['Gençlere özel kampanyalar', 'Sinema bileti indirimleri', 'Kefilsiz alınabilir']),
('Kampüs Kart', 'VakıfBank', 'Visa/Mastercard', 'World', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kartı', 'VakıfBank''ın anlaşmalı üniversitelerdeki öğrencilere sunduğu karttır.', 'Aidatsız', ARRAY['Öğrenci kimlik entegrasyonu', 'Harç ödemelerinde taksit', 'Kampüs avantajları']),
('Tercih Kart', 'VakıfBank', 'Visa/Mastercard', 'World', 'Standart', 'Aidatsız Kartlar', 'Aidatsız kredi kartı', 'Yıllık kart aidatı ödemek istemeyen müşteriler için VakıfBank''ın çözümüdür.', 'Aidatsız', ARRAY['Aidat yok', 'Worldcard özellikleri', 'Bazı hizmetlerden feragat']),

-- Vakıf Katılım Kartları
('VKart', 'Vakıf Katılım', 'Troy', 'Yok', 'Standart', 'Katılım Kartları', 'Katılım kredi kartı', 'Vakıf Katılım Bankası''nın kredi kartıdır. Yerli ve milli ödeme ağı Troy logolu olarak sunulur.', 'Aidatsız + masrafsız', ARRAY['Troy yerli ağ', 'Faiz uygulanmaz', 'Vakıf bağışı modeli']),
('Troy Dijital Kart', 'Vakıf Katılım', 'Troy', 'Yok', 'Dijital Kart', 'Dijital Kartlar', 'Sanal kredi kartı', 'Vakıf Katılım''ın fiziksel basılmayan, tamamen dijital olarak kullanılan kredi kartıdır.', 'Aidatsız', ARRAY['Tamamen dijital', 'Anında oluşturma', 'Esnek limit']),

-- Yapı Kredi Kartları
('Worldcard', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Türkiye''nin en yaygın kredi kartı programlarından World''ün Yapı Kredi''ye ait kartları.', 'Segment bazlı aidat', ARRAY['Worldpuan kazanma', '100.000+ üye işyeri', 'Taksit kampanyaları']),
('World Crystal', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Crystal', 'Premium Kredi Kartları', 'Premium kredi kartı', 'Yapı Kredi''nin varlıklı müşterilerine Crystal kartlar sunar. Metal özellikli ultra premium kart.', 'Çok yüksek aidat', ARRAY['Metal kart', 'Concierge hizmeti', '%5 otel indirimi']),
('World Signia/Privé', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Privé', 'Premium Kredi Kartları', 'Premium kredi kartı', 'Özel bankacılık müşterilerine World Signia/Privia kartlar sunar.', 'Davetli/Yüksek aidat', ARRAY['VIP ayrıcalıklar', 'Özel etkinlik davetleri', '7/24 asistans']),
('Adios', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Standart', 'Seyahat Kartları', 'Seyahat kartı', 'Seyahat temalı World kartıdır. Worldpuan''ların değerini seyahat harcamalarında artırır.', 'Yüksek aidat', ARRAY['Seyahat puan katsayısı', 'Yurt dışı ekstra puan', 'Tur şirketi indirimleri']),
('Adios Premium', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Premium', 'Seyahat Kartları', 'Seyahat kartı', 'Adios kartın premium versiyonudur. En yüksek kat sayıyla puan kullanımı sağlar.', 'Çok yüksek aidat', ARRAY['En yüksek puan katsayısı', '9 aya varan taksit', '7/24 seyahat asistansı']),
('Play Card', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kredi kartı', 'Yapı Kredi''nin gençlere ve öğrencilere yönelik kredi kartıdır.', 'Aidatsız/Düşük aidat', ARRAY['Play Harçlık özelliği', 'Festival bilet indirimi', 'Gençlik fırsatları']),
('Opet Worldcard', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Ortak Markalı', 'Ortak Markalı Kartlar', 'Ortak markalı kart', 'Yapı Kredi ve Opet işbirliğiyle sunulan kredi kartıdır.', 'Standart aidat', ARRAY['Akaryakıt ekstra puanı', 'Ücretsiz oto yıkama', 'Opet özel indirim günleri']),
('Hepsiburada Premium Worldcard', 'Yapı Kredi', 'Mastercard', 'World', 'Ortak Markalı', 'Ortak Markalı Kartlar', 'Ortak markalı kart', 'Hepsiburada online platformu ile Yapı Kredi''nin çıkardığı kredi kartı.', 'Yıllık aidat var', ARRAY['%5''e varan indirimler', 'Premium üyelik', 'Kargo bedava']),
('Taksitçi Kart', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Standart', 'Özel Segment Kartları', 'Özel amaçlı kart', 'Peşin alışverişleri sonradan taksitlendirmeye odaklı bir World kredi kartıdır.', 'Yıllık aidat var', ARRAY['Sonradan taksitlendirme', '+1-3 ek taksit', 'Taksit odaklı avantajlar']),
('TLcard', 'Yapı Kredi', 'Visa/Mastercard', 'World', 'Hibrit', 'Özel Segment Kartları', 'Banka+Kredi kartı', 'Aslında bir banka kartı olmakla beraber vadesiz hesaba bağlı harcamalarda Worldpuan kazandıran özel karttır.', 'Hibrit ücretlendirme', ARRAY['Debit+Kredi hibrit', 'Otomatik ek hesap', 'Worldpuan kazanma']),

-- Ziraat Bankası Kartları
('Bankkart', 'Ziraat Bankası', 'Visa/Mastercard', 'Maximum', 'Classic/Gold/Platinum', 'Klasik Kredi Kartları', 'Klasik kredi kartı', 'Ziraat Bankası''nın Maximum programlı kredi kartıdır.', 'Segment bazlı aidat', ARRAY['Maximum puan kazanma', 'Geniş şube ağı', 'Kamu çalışanı avantajları']),
('Bankkart Aidatsız', 'Ziraat Bankası', 'Visa/Mastercard', 'Maximum', 'Standart', 'Aidatsız Kartlar', 'Aidatsız kredi kartı', 'Ziraat Bankası''nın yıllık aidatı olmayan kredi kartıdır.', 'Aidatsız', ARRAY['Aidat yok', 'Maximum avantajları', 'Temel ihtiyaçlar']),
('Bankkart Genç', 'Ziraat Bankası', 'Visa/Mastercard', 'Maximum', 'Genç Kart', 'Öğrenci Kartları', 'Öğrenci kredi kartı', 'Ziraat Bankası''nın gençlere özel kredi kartıdır.', 'Düşük aidat/Aidatsız', ARRAY['Gençlere özel kampanyalar', 'Eğitim taksitleri', 'Maximum puan kazanma']);

-- Güncelleme trigger''ı oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credit_card_types_updated_at BEFORE UPDATE
    ON credit_card_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
