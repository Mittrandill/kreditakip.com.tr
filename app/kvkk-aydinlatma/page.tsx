import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Scale, Calendar, ArrowRight } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function KVKKPage() {
  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span className="text-white/80 text-sm font-medium">Kişisel Verilerin Korunması</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-emerald-400">KVKK</span> Aydınlatma Metni
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri işleme faaliyetlerimiz hakkında
                bilgilendirme.
              </p>
              <div className="flex items-center justify-center gap-2 mt-6 text-white/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Yürürlük Tarihi: 28 Kasım 2025</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-8 md:p-12">
              {/* Introduction */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ</h2>
                <p className="text-white/80 leading-relaxed">
                  Bu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kredi ve finans takibi hizmeti kapsamında kullanıcılarınızdan toplanan kişisel verilerin nasıl işlendiğini, saklandığını, korunduğunu, kimlerle paylaşıldığını ve kullanıcı haklarının neler olduğunu açıklamak amacıyla hazırlanmıştır.
                </p>
              </div>

              {/* Section 1: Veri Sorumlusu */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">1. Veri Sorumlusu</h2>
                <div className="text-white/80 space-y-2">
                  <p><strong>Veri Sorumlusu:</strong> Kredi Takip (kreditakip.com.tr)</p>
                  <p>
                    <strong>İletişim Bilgileri:</strong>
                  </p>
                  <p className="ml-4">
                    • E-posta:{" "}
                    <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">
                      info@kreditakip.com.tr
                    </a>
                  </p>
                  <p className="ml-4">
                    • Tel:{" "}
                    <a href="tel:+905432035309" className="text-emerald-400 hover:underline">
                      0 543 203 53 09
                    </a>
                  </p>
                  <p><strong>Adres:</strong> Çeşme / İzmir, Türkiye</p>
                </div>
              </div>

              {/* Section 2: İşlenen Kişisel Veriler */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">2. İşlenen Kişisel Veriler & Toplama Yöntemleri</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Aşağıda listelenen veri tipleri, elektronik ortamda (web sitesi, mobil uygulama, e-posta, form, dosya yükleme gibi) ya da fiziken/manuel olarak tarafınızca toplanabilir:
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-3">
                    <p className="font-semibold text-white mb-2">Kimlik ve iletişim bilgileri:</p>
                    <p>ad, soyad, e-posta adresi, telefon numarası, vb.</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="font-semibold text-white mb-2">Finansal veriler:</p>
                    <p>Kullanıcının yüklediği kredi/banka/borç dökümanları (örneğin PDF), banka bilgilerinin şifrelenmiş hâli, ödeme planları, kredi/banka hesap bilgileri, kredi/borç durumu, borç geçmişi vs.</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="font-semibold text-white mb-2">Teknik ve kullanım verileri:</p>
                    <p>IP adresi, cihaz bilgileri, tarayıcı bilgileri, log kayıtları, kullanım geçmişi, erişim zamanı, lokasyon (varsa), sistem ve güvenlik logları.</p>
                  </div>

                  <p className="mt-4">
                    <strong>Toplama Yöntemi:</strong> Veriler, web sitesi veya uygulama aracılığıyla kullanıcıların kendilerinin girdiği formlar ile; yüklenen dosyalar, otomatik sistem logları ve destek / iletişim süreçleriyle toplanmaktadır.
                  </p>
                </div>
              </div>

              {/* Section 3: İşleme Amaçları ve Hukuki Sebepleri */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">3. İşleme Amaçları ve Hukuki Sebepleri</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>Toplanan kişisel veriler, aşağıdaki amaçlarla ve hukuki sebeplere dayanarak işlenmektedir:</p>

                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border border-white/20 rounded-lg overflow-hidden">
                      <thead className="bg-emerald-900/30">
                        <tr>
                          <th className="border border-white/20 px-4 py-3 text-left text-white">Amaç</th>
                          <th className="border border-white/20 px-4 py-3 text-left text-white">Hukuki Sebep</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white/5">
                          <td className="border border-white/20 px-4 py-3">Hizmetin sunulması ve yürütülmesi; kullanıcıların kredi/borç takibini yapabilmesi</td>
                          <td className="border border-white/20 px-4 py-3">KVKK m. 5/2 (c) — Sözleşmenin kurulması ve ifası</td>
                        </tr>
                        <tr>
                          <td className="border border-white/20 px-4 py-3">Kullanıcıya destek sağlanması, iletişim kurulması, hizmet süreçlerinin yönetimi</td>
                          <td className="border border-white/20 px-4 py-3">KVKK m. 5/2 (e) — Bir hakkın tesis edilmesi, kullanılması veya korunması</td>
                        </tr>
                        <tr className="bg-white/5">
                          <td className="border border-white/20 px-4 py-3">Uygulama güvenliğinin sağlanması, teknik ve idari altyapının yönetilmesi</td>
                          <td className="border border-white/20 px-4 py-3">KVKK m. 5/2 (f) — Meşru menfaat</td>
                        </tr>
                        <tr>
                          <td className="border border-white/20 px-4 py-3">Hukuki yükümlülüklerin yerine getirilmesi (örneğin yasal talepler, kayıt düzenleme vb.)</td>
                          <td className="border border-white/20 px-4 py-3">KVKK m. 5/2 (ç) / ilgili yasal düzenlemeler</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 4: Verilerin Aktarımı */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">4. Verilerin Aktarımı ve Yurt Dışı Veri Transferi</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p className="font-semibold text-white">
                    Kullanıcı verileri, yurt dışına aktarılmamaktadır.
                  </p>
                  <p>
                    Teknik altyapı sağlayıcılarımız (sunucu, veri depolama, işlem hizmeti vs.) Türkiye merkezli ya da KVKK uyumlu, güvenliği sağlanmış hizmet sağlayıcılardır. Verilerin aktarımı SSL/TLS gibi güvenli protokollerle şifrelenmiştir.
                  </p>
                  <p>
                    Veriler yalnızca gerekli durumlarda, amaca uygun ve ölçülü olarak, mevzuatın izin verdiği şekilde ilgili üçüncü taraflarla (örneğin denetim, yasal yükümlülük, mali düzenleme gereklilikleri vb.) paylaşılabilir.
                  </p>
                </div>
              </div>

              {/* Section 5: Veri Güvenliği */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">5. Veri Güvenliği ve Saklama Süresi</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Verilerin güvenliği için idari, teknik ve fiziksel tedbirler uygulanmaktadır. Kullanıcıların finansal ve hassas verileri — bankacılık bilgileri, kredi dökümanları gibi — şifreli biçimde saklanmakta, erişim kontrolleri ve yetkilendirmelerle korunmaktadır.
                  </p>
                  <p>
                    Veriler, işleme amaçlarının sürdüğü süre boyunca ve mevzuatta öngörülen saklama süreleri çerçevesinde muhafaza edilir; amaç ortadan kalktığında veya talep olması halinde silinir / anonimleştirilir.
                  </p>
                </div>
              </div>

              {/* Section 6: İlgili Kişinin Hakları */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">6. İlgili Kişinin Hakları</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>KVKK'nın 11. maddesi uyarınca</strong>, kullanıcılarınız aşağıdaki haklara sahiptir:
                  </p>

                  <ul className="list-disc pl-6 space-y-2">
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                    <li>İşlenmişse bilgi talep etme,</li>
                    <li>Verilerin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme,</li>
                    <li>Verilerin silinmesini veya anonim hâle getirilmesini isteme,</li>
                    <li>İşlemenin kısıtlanmasını isteme,</li>
                    <li>İşlemenin durdurulmasını ve verilerin aktarılmasını isteme,</li>
                    <li>Otomatik sistemlerle analiz/değerlendirme nedeniyle aleyhinize sonuç oluşması hâlinde itiraz etme,</li>
                    <li>Hak ihlali durumunda ilgili denetim kurumuna şikayette bulunma.</li>
                  </ul>

                  <p className="mt-4">
                    Taleplerinizi kimliğinizi doğrulayarak e-posta veya telefon yoluyla aşağıdaki iletişim bilgilerine göndererek iletebilirsiniz; başvurunuz <strong>30 gün içinde</strong> yazılı olarak yanıtlanacaktır.
                  </p>

                  <p className="mt-3">
                    <strong>İletişim:</strong>{" "}
                    <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">
                      info@kreditakip.com.tr
                    </a>
                    {" "}— Tel:{" "}
                    <a href="tel:+905432035309" className="text-emerald-400 hover:underline">
                      0 543 203 53 09
                    </a>
                  </p>
                </div>
              </div>

              {/* Section 7: Çerez */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">7. Çerez (Cookie) ve Benzeri Teknolojiler</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Web sitemiz ve uygulamalarımız, ziyaretçi deneyimini iyileştirmek, güvenlik ve analiz amaçlı çerez veya benzeri izleme teknolojileri kullanabilir. Bu kapsamda hangi tür çerezlerin kullanıldığı, amaçları ve kullanıcıların nasıl kontrol edebileceği ayrı{" "}
                    <Link href="/cerez-politikasi" className="text-emerald-400 hover:underline font-semibold">
                      Çerez Politikası
                    </Link>
                    {" "}sayfasında detaylı olarak açıklanmıştır.
                  </p>
                </div>
              </div>

              {/* Section 8: Değişiklikler */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">8. Değişiklik ve Güncellemeler</h2>
                <div className="text-white/80 leading-relaxed space-y-2">
                  <p>
                    Bu Aydınlatma Metni, kanun, mevzuat ya da hizmet süreçlerimizde meydana gelecek değişiklikler nedeniyle güncellenebilir. Güncellenen yeni metin, web sitesinde yayınlandığı anda yürürlüğe girer; önemli değişikliklerde kullanıcılar ayrıca bilgilendirilir.
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">KVKK Başvuru ve İletişim</h3>
                <div className="text-white/80 space-y-2">
                  <p>Kişisel verilerinizle ilgili sorularınız ve talepleriniz için:</p>
                  <p>
                    <strong>E-posta:</strong>{" "}
                    <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">
                      info@kreditakip.com.tr
                    </a>
                  </p>
                  <p>
                    <strong>Telefon:</strong>{" "}
                    <a href="tel:+905432035309" className="text-emerald-400 hover:underline">
                      0 543 203 53 09
                    </a>
                  </p>
                  <p><strong>Adres:</strong> Çeşme / İzmir, Türkiye</p>
                </div>
              </div>
            </div>

            {/* Related Links */}
            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Gizlilik Politikası</h3>
                  <p className="text-white/70 text-sm mb-4">Kişisel verilerinizin korunması hakkında</p>
                  <Link href="/gizlilik-politikasi">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                    >
                      İncele <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Kullanım Şartları</h3>
                  <p className="text-white/70 text-sm mb-4">Uygulama kullanım kuralları ve sorumluluklar</p>
                  <Link href="/kullanim-sartlari">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                    >
                      İncele <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Çerez Politikası</h3>
                  <p className="text-white/70 text-sm mb-4">Çerez kullanımı ve yönetimi hakkında</p>
                  <Link href="/cerez-politikasi">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                    >
                      İncele <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
