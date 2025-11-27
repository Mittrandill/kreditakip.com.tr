PAYTR ENTEGRASYON DOKÜMANTASYONU
Bu doküman PayTR "Kart Saklama (CAPI)" ve "Direkt API (Adım 1 ve 2)" entegrasyon süreçlerini kapsar.

BÖLÜM 1: DİREKT API ENTEGRASYONU - 1. ADIM (Token & Form)
Bu adımda ödeme formu için gerekli veriler ve güvenlik token'ı oluşturulur.
1. Token Oluşturma Mantığı
Token şu verilerin birleşimiyle oluşturulur: merchant_id + user_ip + merchant_oid + email + payment_amount + payment_type + installment_count + currency + test_mode + non_3d
Algoritma: HMAC SHA256 (Salt: merchant_key)
Encoding: Base64
2. Ödeme Formu Parametreleri (POST -> https://www.paytr.com/odeme)
Parametre	Tipi	Zorunlu	Açıklama
merchant_id	integer	Evet	Mağaza No.
paytr_token	string	Evet	Hesaplanan Token.
user_ip	string	Evet	Müşteri IP adresi.
merchant_oid	string	Evet	Benzersiz Sipariş No.
email	string	Evet	Müşteri E-posta.
payment_type	string	Evet	card veya card_points.
payment_amount	integer	Evet	Tutar (100 ile çarpılmış hali. 34.56 TL -> 3456).
installment_count	int	Evet	Taksit sayısı.
currency	string	-	TL, USD, EUR vb.
test_mode	int	-	0 veya 1.
non_3d	int	-	0 veya 1.
request_exp_date	int	-	İstek zaman aşımı (Timestamp). Gönderilmezse +30 dk.
cc_owner	string	Evet	Kart Sahibi (Max 50 char).
card_number	string	Evet	Kart Numarası (16 hane).
expiry_month	string	Evet	Ay (Örn: 05).
expiry_year	string	Evet	Yıl (Örn: 24).
cvv	string	Evet	Güvenlik kodu.
merchant_ok_url	string	Evet	Başarılı dönüş sayfası.
merchant_fail_url	string	Evet	Hatalı dönüş sayfası.
user_name	string	Evet	Müşteri Ad Soyad.
user_address	string	Evet	Adres.
user_phone	string	Evet	Telefon.
user_basket	string	Evet	Sepet içeriği (JSON formatında string).
sync_mode	int	-	1 gönderilirse yanıt direkt JSON döner (3D'siz işlemlerde).
Sync Mode Yanıtları
failed: Hata.
wait_callback: Bildirim bekleyin.
success: Başarılı.
BÖLÜM 2: DİREKT API ENTEGRASYONU - 2. ADIM (Bildirim URL)
PayTR sistemi, ödeme sonucunu (başarılı veya başarısız) mağazanın belirlediği "Bildirim URL"sine POST eder. Mağaza bu bildirimi işleyip OK yanıtı dönmelidir.
1. Bildirim URL'e Gelen POST Parametreleri
Parametre	Açıklama
merchant_oid	Sipariş numarası.
status	success veya failed.
total_amount	Çekilen tutar (Başarısız ise 0).
hash	Güvenlik doğrulaması için PayTR'dan gelen hash. (Doğrulanmalı!)
failed_reason_code	Hata kodu (Sadece başarısız işlemde).
failed_reason_msg	Hata mesajı (Sadece başarısız işlemde).
payment_type	Ödeme tipi (card, eft).
currency	Para birimi.
payment_amount	Siparişin orijinal tutarı.
2. Hash Doğrulama ve Yanıt Verme
Gelen verilerle (notification hash) kendi oluşturacağınız hash'i kıyaslayın.
Eğer hash'ler eşleşiyorsa ve işlem başarılıysa veritabanınızı güncelleyin.
ÖNEMLİ: Ekrana sadece OK yazdırın. HTML etiketi, boşluk veya başka bir metin olmamalıdır.
PHP Örnek: echo "OK";
3. Önemli Uyarılar
Session Yok: Bildirim PayTR sunucusundan gelir, bu yüzden kullanıcı oturumu ($_SESSION vb.) kullanılamaz. İşlemler merchant_oid üzerinden yapılmalıdır.
SSL/HTTPS: Sitenizde SSL varsa Bildirim URL https olmalıdır. SSL yoksa https kullanılmamalıdır.
Çoklu Bildirim: Ağ sorunları nedeniyle aynı işlem için birden fazla bildirim gelebilir. merchant_oid kontrolü yapılmalıdır.
4. Hata Kodları (Failed Reason Code)
1: Kimlik doğrulama yapılmadı (Telefon girilmedi).
2: Kimlik doğrulama başarısız (SMS şifresi hatalı).
3: Güvenlik kontrolü onayı verilmedi (Fraud şüphesi).
6: Kullanıcı ödeme sayfasından vazgeçti/ayrıldı.
8: Taksit yapılamıyor.
9: İşlem yetkisi yok (Mağaza yetkisi).
10: 3D Secure zorunlu.
11: Fraud tespiti.
99: Genel teknik hata.

BÖLÜM 3: PAYTR KART SAKLAMA ENTEGRASYONU (CAPI)
Bu modül, kullanıcıların kredi kartlarını kaydetmesini, listelemesini, silmesini ve kayıtlı kartlarla (Recurring) ödeme yapmasını sağlar.
1. Kullanıcının Kartını Kaydetme (Ödeme Sırasında)
Ödeme işlemi esnasında (/odeme servisi) kullanıcının kartını kaydetmek için POST içeriğine aşağıdaki parametreler eklenmelidir:
İlk kez kayıt: Sadece store_card parametresi gönderilir.
Mevcut kullanıcının yeni kartı: utoken ve store_card parametreleri birlikte gönderilir.
Dönüş Değeri: Ödeme bildirimi sonucunda utoken (User Token) değeri döner. Bu değer veritabanında kullanıcı ile eşleştirilmelidir.
2. Kullanıcının Kayıtlı Kart Listesini Alma (CAPI LIST)
Kullanıcıya kayıtlı kartlarını göstermek için kullanılır.
Endpoint: https://www.paytr.com/odeme/capi/list
Method: POST
İstek Parametreleri
Parametre	Tipi	Zorunlu	Açıklama
merchant_id	integer	Evet	PayTR Mağaza Numarası.
utoken	string	Evet	Kullanıcıya özel token (Ödeme bildiriminden elde edilen).
paytr_token	string	Evet	İstek güvenliği için oluşturulan hash değeri.
Yanıt (Response) Değerleri (JSON)
Parametre	Tipi	Açıklama
status	string	Hata durumunda error döner. Başarılıysa bu alan dönmeyebilir.
err_msg	string	Hata durumunda hatanın nedeni.
ctoken	string	Kartın token değeri (Ödeme ve silme için gerekli).
last_4	string	Kartın son 4 hanesi.
require_cvv	string	0 veya 1. 1 dönerse kullanıcıdan CVV istenmelidir.
month	string	Son kullanma ayı (Örn: 05).
year	string	Son kullanma yılı (Örn: 28).
c_bank	string	Banka adı. Kayıtlı BIN değilse veya yurtdışı ise boş döner.
c_name	string	Kart sahibinin adı soyadı.
c_brand	string	Kart programı (Bonus, World vb.).
c_type	string	credit veya debit.
businessCard	string	y (Ticari) veya n (Bireysel).
schema	string	VISA, MASTERCARD, TROY vb. Bilinmiyorsa OTHER.
3. Kullanıcı Kartını Silme (CAPI DELETE)
Kullanıcının kayıtlı bir kartını silmek için kullanılır.
Endpoint: https://www.paytr.com/odeme/capi/delete
Method: POST
İstek Parametreleri
Parametre	Tipi	Zorunlu	Açıklama
merchant_id	integer	Evet	Mağaza Numarası.
paytr_token	string	Evet	Güvenlik hash değeri.
utoken	string	Evet	Kullanıcı token'ı.
ctoken	string	Evet	Silinecek kartın token'ı.
Yanıt (Response)
Parametre	Tipi	Değerler
status	string	success veya error
err_msg	string	Hata durumunda açıklama (Örn: Kart yok).
4. Kayıtlı Kart ile Tekrarlayan Ödeme (RECURRING PAYMENT)
Kullanıcı etkileşimi olmadan (Non3D) kayıtlı kart ile ödeme almak için kullanılır.
Endpoint: https://www.paytr.com/odeme
Method: POST
Ön Koşul: Mağazada "Non3D" yetkisi açık olmalıdır.
İstek Parametreleri
Parametre	Tipi	Zorunlu	Açıklama / Kısıtlar
merchant_id	integer	Evet	Mağaza Numarası.
paytr_token	string	Evet	Güvenlik hash'i.
user_ip	string	Evet	Müşteri IP'si (Lokalde dış IP gönderilmeli). Max 39 char.
merchant_oid	string	Evet	Benzersiz sipariş ID. Max 64 char, Alfanumerik.
email	string	Evet	Müşteri e-posta. Max 100 char.
payment_type	string	Evet	card veya card_points.
payment_amount	double	Evet	Tutar (Örn: 10.99 için 1099 gönderilir).
installment_count	int	Evet	Taksit sayısı (0 tek çekim).
card_type	string	-	Taksitli işlemlerde kart tipi (bonus, world vb.).
currency	string	-	TL, EUR, USD. Boş ise TL.
client_lang	string	-	tr veya en.
test_mode	int	-	0 (Canlı) veya 1 (Test).
non_3d	int	-	1 gönderilmelidir.
non3d_test_failed	int	-	Test işleminde başarısız senaryo için 1.
merchant_ok_url	string	Evet	Başarılı yönlendirme URL'i (Kullanıcı görmez, redirect yok).
merchant_fail_url	string	Evet	Başarısız yönlendirme URL'i.
utoken	string	Evet	Kullanıcı Token.
ctoken	string	Evet	Kart Token.
recurring	int	-	0 veya 1. (API yetkisi için talep edilmeli).
Recurring Yanıtları (JSON)
Status	Msg	Try Again	Açıklama
failed	Hata mesajı	false	Kart banka tarafından kapatılmış vb. tekrar deneme.
failed	İşlem devam ediyor	true	Tekrar denenebilir.
wait_callback	-	-	Bildirim bekleniyor.
success	Ödeme Başarılı	-	İşlem başarılı.