import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, ArrowRight } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function TermsOfServicePage() {
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
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-white/80 text-sm font-medium">Yasal Belgeler</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-emerald-400">Kullanım</span> Şartları
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Kredi Takip uygulamasının kullanımına ilişkin kuralları düzenleyen şartlar ve koşullar.
              </p>
              <div className="flex items-center justify-center gap-2 mt-6 text-white/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Yürürlük Tarihi: 15 Ocak 2024</span>
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
                <p className="text-white/90 leading-relaxed">
                  Bu Şartlar, Kredi Takip uygulamasının kullanımına ilişkin kuralları düzenler.
                  <strong> Uygulamaya erişen tüm kullanıcılar bu şartları kabul etmiş sayılır.</strong>
                </p>
              </div>

              {/* Section 1: Hizmet Tanımı */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">1. Hizmet Tanımı</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Kredi Takip, kullanıcıların yüklediği kredi dökümanlarını işleyerek dijital planlara dönüştürür ve
                    kullanıcıya takibi kolaylaştırır.
                  </p>
                  <p>
                    Ayrıca, kullanıcının tercihiyle, internet bankacılığı şifreleri şifrelenmiş şekilde saklanabilir.
                  </p>
                  <p>
                    <strong>Sunulan Hizmetler:</strong>
                  </p>
                  <p>• OCR teknolojisi ile döküm analizi</p>
                  <p>• Akıllı ödeme planı oluşturma</p>
                  <p>• Finansal analiz ve raporlama</p>
                  <p>• Güvenli veri saklama</p>
                </div>
              </div>

              {/* Section 2: Sorumluluk Reddi */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">2. Sorumluluk Reddi</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>
                      Uygulama, kullanıcıların yüklediği içeriklerin doğruluğundan veya güncelliğinden sorumlu değildir.
                    </strong>
                  </p>
                  <p>
                    <strong>
                      Uygulama, herhangi bir banka, finans kurumu veya kamu kuruluşu ile doğrudan bağlantılı değildir.
                    </strong>
                  </p>
                  <p>
                    <strong>
                      Otomasyon çıktıları yalnızca kullanıcı bilgilendirme amaçlıdır; resmi belge niteliği taşımaz.
                    </strong>
                  </p>
                  <p className="text-yellow-200">
                    ⚠️ Önemli: Finansal kararlarınızı alırken mutlaka uzman görüşü alın ve resmi belgelerinizi kontrol
                    edin.
                  </p>
                </div>
              </div>

              {/* Section 3: Kullanıcının Yükümlülükleri */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">3. Kullanıcının Yükümlülükleri</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>Veri Sorumluluğu:</strong>
                  </p>
                  <p>• Sisteme yüklenen içerikler (PDF vb.) kullanıcının sorumluluğundadır</p>
                  <p>
                    <strong>• Üçüncü kişilere ait verilerin izinsiz yüklenmesi hukuken yasaktır</strong>
                  </p>
                  <p>• Yükleyen kişi tüm hukuki sonuçları üstlenir</p>

                  <p>
                    <strong>Hesap Güvenliği:</strong>
                  </p>
                  <p>• Kullanıcı hesabının güvenliği kullanıcıya aittir</p>
                  <p>• Güçlü şifre kullanımı zorunludur</p>
                  <p>
                    <strong>• Yetkisiz erişim riski oluşması durumunda derhal bildirim yapılmalıdır</strong>
                  </p>
                </div>
              </div>

              {/* Section 4: Hesabın Kapatılması */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">4. Hesabın Kapatılması</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>Kullanıcı Tarafından:</strong> Kullanıcı dilerse hesabını istediği zaman silebilir.
                  </p>
                  <p>
                    <strong>Platform Tarafından:</strong> Kullanım koşullarına aykırı hareket eden kullanıcıların hesabı
                    uyarı yapılmaksızın askıya alınabilir veya kapatılabilir.
                  </p>

                  <p>
                    <strong>Hesap Kapatma Sebepleri:</strong>
                  </p>
                  <p>• Sahte bilgi kullanımı</p>
                  <p>• Üçüncü kişi verilerinin izinsiz yüklenmesi</p>
                  <p>• Sistem güvenliğini tehdit edici faaliyetler</p>
                  <p>• Yasal olmayan kullanım</p>
                </div>
              </div>

              {/* Section 5: Uyuşmazlık */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">5. Uyuşmazlık</h2>
                <div className="text-white/80 leading-relaxed space-y-2">
                  <p>
                    Taraflar arasında çıkabilecek uyuşmazlıklarda{" "}
                    <strong>İstanbul Merkez Mahkemeleri ve İcra Daireleri</strong> yetkilidir.
                  </p>
                  <p>• Türk Hukuku uygulanır</p>
                  <p>• Öncelikle dostane çözüm aranır</p>
                  <p>• Arabuluculuk tercih edilir</p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">Sorularınız için İletişim</h3>
                <div className="text-white/80 space-y-2">
                  <p>Kullanım şartları hakkında sorularınız varsa bizimle iletişime geçebilirsiniz:</p>
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
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
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
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                    >
                      İncele <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">KVKK Aydınlatma</h3>
                  <p className="text-white/70 text-sm mb-4">Kişisel verilerin işlenmesi hakkında</p>
                  <Link href="/kvkk-aydinlatma">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
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
