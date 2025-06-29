-- Önce mevcut bankaları temizle
DELETE FROM public.banks;

-- Devlet Bankaları
INSERT INTO public.banks (name, logo_url, contact_phone, contact_email, website, category) VALUES
('Ziraat Bankası', '/placeholder.svg?height=48&width=48&text=ZB', '0312 123 45 67', 'info@ziraatbank.com.tr', 'https://ziraatbank.com.tr', 'Devlet Bankaları'),
('Halkbank', '/placeholder.svg?height=48&width=48&text=HB', '0312 789 01 23', 'info@halkbank.com.tr', 'https://halkbank.com.tr', 'Devlet Bankaları'),
('Vakıfbank', '/placeholder.svg?height=48&width=48&text=VB', '0212 890 12 34', 'info@vakifbank.com.tr', 'https://vakifbank.com.tr', 'Devlet Bankaları'),

-- Özel Sektör Bankaları
('Akbank', '/placeholder.svg?height=48&width=48&text=AB', '0212 567 89 01', 'info@akbank.com.tr', 'https://akbank.com.tr', 'Özel Sektör Bankaları'),
('Türkiye İş Bankası', '/placeholder.svg?height=48&width=48&text=İB', '0212 345 67 89', 'info@isbank.com.tr', 'https://isbank.com.tr', 'Özel Sektör Bankaları'),
('Yapı ve Kredi Bankası', '/placeholder.svg?height=48&width=48&text=YK', '0212 678 90 12', 'info@yapikredi.com.tr', 'https://yapikredi.com.tr', 'Özel Sektör Bankaları'),
('Türk Ekonomi Bankası', '/placeholder.svg?height=48&width=48&text=TEB', '0212 456 78 90', 'info@teb.com.tr', 'https://teb.com.tr', 'Özel Sektör Bankaları'),
('Şekerbank', '/placeholder.svg?height=48&width=48&text=ŞB', '0212 234 56 78', 'info@sekerbank.com.tr', 'https://sekerbank.com.tr', 'Özel Sektör Bankaları'),
('Anadolubank', '/placeholder.svg?height=48&width=48&text=ANB', '0212 345 67 89', 'info@anadolubank.com.tr', 'https://anadolubank.com.tr', 'Özel Sektör Bankaları'),
('Fibabanka', '/placeholder.svg?height=48&width=48&text=FB', '0212 456 78 90', 'info@fibabanka.com.tr', 'https://fibabanka.com.tr', 'Özel Sektör Bankaları'),
('Turkish Bank', '/placeholder.svg?height=48&width=48&text=TB', '0212 567 89 01', 'info@turkishbank.com.tr', 'https://turkishbank.com.tr', 'Özel Sektör Bankaları'),
('Adabank', '/placeholder.svg?height=48&width=48&text=ADB', '0212 678 90 12', 'info@adabank.com.tr', 'https://adabank.com.tr', 'Özel Sektör Bankaları'),

-- Yabancı Bankalar
('Türkiye Garanti Bankası', '/placeholder.svg?height=48&width=48&text=GB', '0216 456 78 90', 'info@garantibbva.com.tr', 'https://garantibbva.com.tr', 'Yabancı Bankalar'),
('Denizbank', '/placeholder.svg?height=48&width=48&text=DB', '0212 901 23 45', 'info@denizbank.com.tr', 'https://denizbank.com.tr', 'Yabancı Bankalar'),
('QNB Finansbank', '/placeholder.svg?height=48&width=48&text=QNB', '0212 234 56 78', 'info@qnbfinansbank.com.tr', 'https://qnbfinansbank.com.tr', 'Yabancı Bankalar'),
('ING Bank', '/placeholder.svg?height=48&width=48&text=ING', '0212 345 67 89', 'info@ing.com.tr', 'https://ing.com.tr', 'Yabancı Bankalar'),
('HSBC Bank', '/placeholder.svg?height=48&width=48&text=HSBC', '0212 456 78 90', 'info@hsbc.com.tr', 'https://hsbc.com.tr', 'Yabancı Bankalar'),
('Deutsche Bank', '/placeholder.svg?height=48&width=48&text=DB', '0212 567 89 01', 'info@db.com', 'https://db.com', 'Yabancı Bankalar'),
('Citibank', '/placeholder.svg?height=48&width=48&text=CB', '0212 678 90 12', 'info@citibank.com.tr', 'https://citibank.com.tr', 'Yabancı Bankalar'),
('Alternatif Bank', '/placeholder.svg?height=48&width=48&text=ALT', '0212 789 01 23', 'info@alternatifbank.com.tr', 'https://alternatifbank.com.tr', 'Yabancı Bankalar'),
('Burgan Bank', '/placeholder.svg?height=48&width=48&text=BUR', '0212 890 12 34', 'info@burgan.com.tr', 'https://burgan.com.tr', 'Yabancı Bankalar'),
('ICBC Turkey Bank', '/placeholder.svg?height=48&width=48&text=ICBC', '0212 901 23 45', 'info@icbc.com.tr', 'https://icbc.com.tr', 'Yabancı Bankalar'),
('Bank of China Turkey', '/placeholder.svg?height=48&width=48&text=BOC', '0212 234 56 78', 'info@bankofchina.com.tr', 'https://bankofchina.com.tr', 'Yabancı Bankalar'),
('Arap Türk Bankası', '/placeholder.svg?height=48&width=48&text=ATB', '0212 345 67 89', 'info@atbank.com.tr', 'https://atbank.com.tr', 'Yabancı Bankalar'),
('Turkland Bank', '/placeholder.svg?height=48&width=48&text=TLB', '0212 456 78 90', 'info@turklandbank.com.tr', 'https://turklandbank.com.tr', 'Yabancı Bankalar'),
('Odea Bank', '/placeholder.svg?height=48&width=48&text=OB', '0212 567 89 01', 'info@odeabank.com.tr', 'https://odeabank.com.tr', 'Yabancı Bankalar'),
('Rabobank', '/placeholder.svg?height=48&width=48&text=RB', '0212 678 90 12', 'info@rabobank.com.tr', 'https://rabobank.com.tr', 'Yabancı Bankalar'),
('MUFG Bank Turkey', '/placeholder.svg?height=48&width=48&text=MUFG', '0212 789 01 23', 'info@mufg.com.tr', 'https://mufg.com.tr', 'Yabancı Bankalar'),

-- Katılım Bankaları
('Ziraat Katılım Bankası', '/placeholder.svg?height=48&width=48&text=ZK', '0312 234 56 78', 'info@ziraatkatilim.com.tr', 'https://ziraatkatilim.com.tr', 'Katılım Bankaları'),
('Vakıf Katılım Bankası', '/placeholder.svg?height=48&width=48&text=VK', '0212 345 67 89', 'info@vakifkatilim.com.tr', 'https://vakifkatilim.com.tr', 'Katılım Bankaları'),
('Türkiye Emlak Katılım Bankası', '/placeholder.svg?height=48&width=48&text=EK', '0212 456 78 90', 'info@emlakkatilim.com.tr', 'https://emlakkatilim.com.tr', 'Katılım Bankaları'),
('Türkiye Finans Katılım Bankası', '/placeholder.svg?height=48&width=48&text=TF', '0212 567 89 01', 'info@turkiyefinans.com.tr', 'https://turkiyefinans.com.tr', 'Katılım Bankaları'),
('Albaraka Türk Katılım Bankası', '/placeholder.svg?height=48&width=48&text=AB', '0212 678 90 12', 'info@albaraka.com.tr', 'https://albaraka.com.tr', 'Katılım Bankaları'),
('Kuveyt Türk Katılım Bankası', '/placeholder.svg?height=48&width=48&text=KT', '0212 789 01 23', 'info@kuveytturk.com.tr', 'https://kuveytturk.com.tr', 'Katılım Bankaları'),

-- Kalkınma ve Yatırım Bankaları
('İller Bankası', '/placeholder.svg?height=48&width=48&text=İB', '0312 890 12 34', 'info@ilbank.gov.tr', 'https://ilbank.gov.tr', 'Kalkınma ve Yatırım Bankaları'),
('Türk Eximbank', '/placeholder.svg?height=48&width=48&text=EX', '0312 901 23 45', 'info@eximbank.gov.tr', 'https://eximbank.gov.tr', 'Kalkınma ve Yatırım Bankaları'),
('Türkiye Kalkınma ve Yatırım Bankası', '/placeholder.svg?height=48&width=48&text=TKYB', '0312 234 56 78', 'info@tkyb.com.tr', 'https://tkyb.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Türkiye Sınai Kalkınma Bankası', '/placeholder.svg?height=48&width=48&text=TSKB', '0212 345 67 89', 'info@tskb.com.tr', 'https://tskb.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Aktif Yatırım Bankası', '/placeholder.svg?height=48&width=48&text=AYB', '0212 456 78 90', 'info@aktifyatirim.com.tr', 'https://aktifyatirim.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Diler Yatırım Bankası', '/placeholder.svg?height=48&width=48&text=DYB', '0212 567 89 01', 'info@diler.com.tr', 'https://diler.com.tr', 'Kalkınma ve Yatır��m Bankaları'),
('Golden Global Yatırım Bankası', '/placeholder.svg?height=48&width=48&text=GG', '0212 678 90 12', 'info@goldenglobal.com.tr', 'https://goldenglobal.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('GSD Yatırım Bankası', '/placeholder.svg?height=48&width=48&text=GSD', '0212 789 01 23', 'info@gsd.com.tr', 'https://gsd.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('İstanbul Takas ve Saklama Bankası', '/placeholder.svg?height=48&width=48&text=İTS', '0212 890 12 34', 'info@takasbank.com.tr', 'https://takasbank.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Nurol Yatırım Bankası', '/placeholder.svg?height=48&width=48&text=NYB', '0212 901 23 45', 'info@nurolyatirim.com.tr', 'https://nurolyatirim.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('BankPozitif Kredi ve Kalkınma Bankası', '/placeholder.svg?height=48&width=48&text=BP', '0212 234 56 78', 'info@bankpozitif.com.tr', 'https://bankpozitif.com.tr', 'Kalkınma ve Yatırım Bankaları'),

-- Yabancı Şubeler
('Bank Mellat', '/placeholder.svg?height=48&width=48&text=BM', '0212 345 67 89', 'info@bankmellat.com.tr', 'https://bankmellat.com.tr', 'Yabancı Şubeler'),
('Habib Bank Limited', '/placeholder.svg?height=48&width=48&text=HBL', '0212 456 78 90', 'info@hbl.com.tr', 'https://hbl.com.tr', 'Yabancı Şubeler'),
('Intesa Sanpaolo', '/placeholder.svg?height=48&width=48&text=IS', '0212 567 89 01', 'info@intesasanpaolo.com.tr', 'https://intesasanpaolo.com.tr', 'Yabancı Şubeler'),
('JPMorgan Chase Bank', '/placeholder.svg?height=48&width=48&text=JPM', '0212 678 90 12', 'info@jpmorgan.com.tr', 'https://jpmorgan.com.tr', 'Yabancı Şubeler'),
('Société Générale', '/placeholder.svg?height=48&width=48&text=SG', '0212 789 01 23', 'info@societegenerale.com.tr', 'https://societegenerale.com.tr', 'Yabancı Şubeler'),

-- TMSF Kontrolündeki Bankalar
('Birleşik Fon Bankası', '/placeholder.svg?height=48&width=48&text=BFB', '0212 890 12 34', 'info@birlesikfon.com.tr', 'https://birlesikfon.com.tr', 'TMSF Bankaları'),
('Türk Ticaret Bankası', '/placeholder.svg?height=48&width=48&text=TTB', '0212 901 23 45', 'info@ttbank.com.tr', 'https://ttbank.com.tr', 'TMSF Bankaları');
