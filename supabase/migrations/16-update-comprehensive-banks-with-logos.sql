-- Önce mevcut bankaları temizle
DELETE FROM public.banks;

-- 1. Mevduat (Tasarruf) Bankaları - Devlet Bankaları
INSERT INTO public.banks (name, logo_url, contact_phone, contact_email, website, category) VALUES
('T.C. Ziraat Bankası A.Ş.', '/bank-icons/ziraat-bankasi.png', '0312 584 20 00', 'info@ziraatbank.com.tr', 'https://ziraatbank.com.tr', 'Devlet Bankaları'),
('Türkiye Halk Bankası A.Ş.', '/bank-icons/halk-bankasi.png', '0312 596 30 00', 'info@halkbank.com.tr', 'https://halkbank.com.tr', 'Devlet Bankaları'),
('Türkiye Vakıflar Bankası T.A.O.', '/bank-icons/vakifbank.png', '0212 251 15 00', 'info@vakifbank.com.tr', 'https://vakifbank.com.tr', 'Devlet Bankaları'),

-- 1. Mevduat (Tasarruf) Bankaları - Özel Sermayeli Bankalar
('Akbank T.A.Ş.', '/bank-icons/akbank.png', '0212 385 55 55', 'info@akbank.com.tr', 'https://akbank.com.tr', 'Özel Sermayeli Bankalar'),
('Yapı ve Kredi Bankası A.Ş.', '/bank-icons/yapi-kredi-bankasi.png', '0212 339 70 00', 'info@yapikredi.com.tr', 'https://yapikredi.com.tr', 'Özel Sermayeli Bankalar'),
('Türkiye İş Bankası A.Ş.', '/bank-icons/is-bankasi.png', '0212 316 00 00', 'info@isbank.com.tr', 'https://isbank.com.tr', 'Özel Sermayeli Bankalar'),
('QNB Finansbank A.Ş.', '/bank-icons/qnb-finansbank.png', '0212 340 00 00', 'info@qnbfinansbank.com.tr', 'https://qnbfinansbank.com.tr', 'Özel Sermayeli Bankalar'),
('Türkiye Garanti Bankası A.Ş.', '/bank-icons/garanti-bbva.png', '0212 318 18 18', 'info@garantibbva.com.tr', 'https://garantibbva.com.tr', 'Özel Sermayeli Bankalar'),
('Anadolubank A.Ş.', '/bank-icons/anadolubank.png', '0212 340 10 00', 'info@anadolubank.com.tr', 'https://anadolubank.com.tr', 'Özel Sermayeli Bankalar'),
('Fibabanka A.Ş.', '/bank-icons/fibabanka.png', '0212 381 81 00', 'info@fibabanka.com.tr', 'https://fibabanka.com.tr', 'Özel Sermayeli Bankalar'),
('Şekerbank T.A.Ş.', '/bank-icons/sekerbank.png', '0212 319 19 00', 'info@sekerbank.com.tr', 'https://sekerbank.com.tr', 'Özel Sermayeli Bankalar'),
('Türk Ekonomi Bankası A.Ş.', '/bank-icons/teb.png', '0212 251 35 35', 'info@teb.com.tr', 'https://teb.com.tr', 'Özel Sermayeli Bankalar'),
('Turkish Bank A.Ş.', '/bank-icons/turkish-bank.png', '0212 251 11 11', 'info@turkishbank.com.tr', 'https://turkishbank.com.tr', 'Özel Sermayeli Bankalar'),
('Alternatif Bank A.Ş.', '/bank-icons/alternatif-bank.png', '0212 340 28 00', 'info@alternatifbank.com.tr', 'https://alternatifbank.com.tr', 'Özel Sermayeli Bankalar'),
('Odeabank A.Ş.', '/bank-icons/odeabank.png', '0212 340 60 00', 'info@odeabank.com.tr', 'https://odeabank.com.tr', 'Özel Sermayeli Bankalar'),
('Burgan Bank A.Ş.', '/bank-icons/burgan-bank.png', '0212 371 37 00', 'info@burgan.com.tr', 'https://burgan.com.tr', 'Özel Sermayeli Bankalar'),
('ICBC Turkey Bank A.Ş.', '/bank-icons/icbc-turkey.png', '0212 385 58 58', 'info@icbc.com.tr', 'https://icbc.com.tr', 'Özel Sermayeli Bankalar'),
('ING Bank A.Ş.', '/bank-icons/ing-bank.png', '0212 335 70 00', 'info@ing.com.tr', 'https://ing.com.tr', 'Özel Sermayeli Bankalar'),
('DenizBank A.Ş.', '/bank-icons/denizbank.png', '0212 444 0 800', 'info@denizbank.com.tr', 'https://denizbank.com.tr', 'Özel Sermayeli Bankalar'),
('Citibank A.Ş.', '/bank-icons/citibank.png', '0212 319 19 00', 'info@citibank.com.tr', 'https://citibank.com.tr', 'Özel Sermayeli Bankalar'),
('Deutsche Bank A.Ş.', '/bank-icons/deutsche-bank.png', '0212 326 60 00', 'info@db.com', 'https://db.com', 'Özel Sermayeli Bankalar'),
('Rabobank A.Ş.', '/bank-icons/rabobank.png', '0212 280 08 00', 'info@rabobank.com.tr', 'https://rabobank.com.tr', 'Özel Sermayeli Bankalar'),
('MUFG Bank Turkey A.Ş.', '/bank-icons/mufg-bank.png', '0212 385 58 00', 'info@mufg.com.tr', 'https://mufg.com.tr', 'Özel Sermayeli Bankalar'),

-- 1. Mevduat (Tasarruf) Bankaları - TMSF Bankaları
('Birleşik Fon Bankası A.Ş.', '/bank-icons/birlesiik-fon-bankasi.png', '0212 251 11 00', 'info@birlesikfon.com.tr', 'https://birlesikfon.com.tr', 'TMSF Bankaları'),
('Adabank A.Ş.', '/bank-icons/adabank.png', '0212 251 12 00', 'info@adabank.com.tr', 'https://adabank.com.tr', 'TMSF Bankaları'),
('Türk Ticaret Bankası A.Ş.', '/bank-icons/turk-ticaret-bankasi.png', '0212 251 13 00', 'info@ttbank.com.tr', 'https://ttbank.com.tr', 'TMSF Bankaları'),

-- 2. Katılım (Faizsiz) Bankaları
('Ziraat Katılım Bankası A.Ş.', '/bank-icons/ziraat-katilim.png', '0312 584 21 00', 'info@ziraatkatilim.com.tr', 'https://ziraatkatilim.com.tr', 'Katılım Bankaları'),
('Vakıf Katılım Bankası A.Ş.', '/bank-icons/vakif-katilim.png', '0212 251 16 00', 'info@vakifkatilim.com.tr', 'https://vakifkatilim.com.tr', 'Katılım Bankaları'),
('Türkiye Emlak Katılım Bankası A.Ş.', '/bank-icons/emlak-katilim.png', '0212 251 17 00', 'info@emlakkatilim.com.tr', 'https://emlakkatilim.com.tr', 'Katılım Bankaları'),
('Türkiye Finans Katılım Bankası A.Ş.', '/bank-icons/turkiye-finans.png', '0212 251 18 00', 'info@turkiyefinans.com.tr', 'https://turkiyefinans.com.tr', 'Katılım Bankaları'),
('Albaraka Türk Katılım Bankası A.Ş.', '/bank-icons/albaraka-turk.png', '0212 251 19 00', 'info@albaraka.com.tr', 'https://albaraka.com.tr', 'Katılım Bankaları'),
('Kuveyt Türk Katılım Bankası A.Ş.', '/bank-icons/kuveyt-turk.png', '0212 251 20 00', 'info@kuveytturk.com.tr', 'https://kuveytturk.com.tr', 'Katılım Bankaları'),
('Dünya Katılım Bankası A.Ş.', '/bank-icons/dunya-katilim.png', '0212 251 21 00', 'info@dunyakatilim.com.tr', 'https://dunyakatilim.com.tr', 'Katılım Bankaları'),
('Hayat Finans Katılım Bankası A.Ş.', '/bank-icons/hayat-finans.png', '0212 251 22 00', 'info@hayatfinans.com.tr', 'https://hayatfinans.com.tr', 'Katılım Bankaları'),

-- 3. Kalkınma ve Yatırım Bankaları
('Türkiye Kalkınma ve Yatırım Bankası A.Ş.', '/bank-icons/kalkinma-yatirim-bankasi.png', '0312 251 23 00', 'info@tkyb.com.tr', 'https://tkyb.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Türk Eximbank', '/bank-icons/turk-eximbank.png', '0312 417 17 00', 'info@eximbank.gov.tr', 'https://eximbank.gov.tr', 'Kalkınma ve Yatırım Bankaları'),
('İller Bankası A.Ş.', '/bank-icons/iller-bankasi.png', '0312 596 40 00', 'info@ilbank.gov.tr', 'https://ilbank.gov.tr', 'Kalkınma ve Yatırım Bankaları'),
('Aktif Yatırım Bankası A.Ş.', '/bank-icons/aktif-yatirim.png', '0212 251 24 00', 'info@aktifyatirim.com.tr', 'https://aktifyatirim.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Diler Yatırım Bankası A.Ş.', '/bank-icons/diler-yatirim.png', '0212 251 25 00', 'info@diler.com.tr', 'https://diler.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Golden Global Yatırım Bankası A.Ş.', '/bank-icons/golden-global.png', '0212 251 26 00', 'info@goldenglobal.com.tr', 'https://goldenglobal.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('GSD Yatırım Bankası A.Ş.', '/bank-icons/gsd-yatirim.png', '0212 251 27 00', 'info@gsd.com.tr', 'https://gsd.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('İstanbul Takas ve Saklama Bankası A.Ş.', '/bank-icons/takasbank.png', '0212 251 28 00', 'info@takasbank.com.tr', 'https://takasbank.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Merrill Lynch Yatırım Bank A.Ş.', '/bank-icons/merrill-lynch.png', '0212 251 29 00', 'info@ml.com', 'https://ml.com', 'Kalkınma ve Yatırım Bankaları'),
('Nurol Yatırım Bankası A.Ş.', '/bank-icons/nurol-yatirim.png', '0212 251 30 00', 'info@nurolyatirim.com.tr', 'https://nurolyatirim.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('PASHA Yatırım Bankası A.Ş.', '/bank-icons/pasha-yatirim.png', '0212 251 31 00', 'info@pashayatirim.com.tr', 'https://pashayatirim.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('Standard Chartered Yatırım Bankası Türk A.Ş.', '/bank-icons/standard-chartered.png', '0212 251 32 00', 'info@sc.com', 'https://sc.com', 'Kalkınma ve Yatırım Bankaları'),
('Türkiye Sınai Kalkınma Bankası A.Ş.', '/bank-icons/tskb.png', '0212 251 33 00', 'info@tskb.com.tr', 'https://tskb.com.tr', 'Kalkınma ve Yatırım Bankaları'),
('BankPozitif Kredi ve Kalkınma Bankası A.Ş.', '/bank-icons/bankpozitif.png', '0212 251 34 00', 'info@bankpozitif.com.tr', 'https://bankpozitif.com.tr', 'Kalkınma ve Yatırım Bankaları'),

-- 4. Dijital-Yalnızca Bankalar
('Enpara Bank A.Ş.', '/bank-icons/enpara.png', '0212 251 35 00', 'info@enpara.com', 'https://enpara.com', 'Dijital Bankalar'),
('Colendi Bank A.Ş.', '/bank-icons/colendi.png', '0212 251 36 00', 'info@colendi.com', 'https://colendi.com', 'Dijital Bankalar'),

-- 5. Türkiye'de Şube Statüsünde Faaliyet Gösteren Yabancı Bankalar
('Bank Mellat', '/bank-icons/bank-mellat.png', '0212 251 37 00', 'info@bankmellat.com.tr', 'https://bankmellat.com.tr', 'Yabancı Şubeler'),
('Habib Bank Limited', '/bank-icons/habib-bank.png', '0212 251 38 00', 'info@hbl.com.tr', 'https://hbl.com.tr', 'Yabancı Şubeler'),
('Intesa Sanpaolo S.p.A.', '/bank-icons/intesa-sanpaolo.png', '0212 251 39 00', 'info@intesasanpaolo.com.tr', 'https://intesasanpaolo.com.tr', 'Yabancı Şubeler'),
('JPMorgan Chase Bank N.A.', '/bank-icons/jpmorgan-chase.png', '0212 251 40 00', 'info@jpmorgan.com.tr', 'https://jpmorgan.com.tr', 'Yabancı Şubeler'),
('Société Générale', '/bank-icons/societe-generale.png', '0212 251 41 00', 'info@societegenerale.com.tr', 'https://societegenerale.com.tr', 'Yabancı Şubeler');
