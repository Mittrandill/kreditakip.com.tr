import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cookie, Calendar, ArrowRight } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function CookiePolicyPage() {
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
                <Cookie className="w-4 h-4 text-emerald-400" />
                <span className="text-white/80 text-sm font-medium">Çerez Yönetimi</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-emerald-400">Çerez</span> Politikası
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Kredi Takip'in kullanıcı deneyimini iyileştirmek için kullandığı çerezler hakkında bilgi.
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
                  Bu politika, Kredi Takip'in kullanıcı deneyimini iyileştirmek için kullandığı çerezler hakkında bilgi
                  verir.
                  <strong> Sitemizi kullanarak çerez kullanımını kabul etmiş olursunuz.</strong>
                </p>
              </div>

              {/* Section 1: Kullanılan Çerez Türleri */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">1. Kullanılan Çerez Türleri</h2>
                <div className="text-white/80 leading-relaxed space-y-4">
                  <div>
                    <p>
                      <strong>Zorunlu Çerezler:</strong>
                    </p>
                    <p>Giriş işlemleri ve oturum yönetimi için gereklidir. Bu çerezler olmadan uygulama çalışmaz.</p>
                    <p>• Oturum Çerezleri: Kullanıcı girişi ve kimlik doğrulama</p>
                    <p>• Güvenlik Çerezleri: CSRF koruması ve güvenlik</p>
                  </div>

                  <div>
                    <p>
                      <strong>İstatistiksel Çerezler:</strong>
                    </p>
                    <p>Uygulama trafiği ve kullanım analizleri için kullanılır. Tüm veriler anonimdir.</p>
                    <p>• Sayfa Görüntüleme: Hangi sayfaların ziyaret edildiği</p>
                    <p>• Kullanım Süresi: Uygulamada geçirilen süre</p>
                  </div>

                  <div>
                    <p>
                      <strong>Tercih Çerezleri:</strong>
                    </p>
                    <p>Kullanıcının tema, dil gibi seçimlerini hatırlar ve kişiselleştirilmiş deneyim sunar.</p>
                    <p>• Tema Tercihi: Koyu/açık tema seçimi</p>
                    <p>• Dil Ayarları: Tercih edilen dil</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Çerez Ayarlarını Yönetme */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">2. Çerez Ayarlarını Yönetme</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.{" "}
                    <strong>Ancak bu durumda bazı işlevler tam çalışmayabilir.</strong>
                  </p>

                  <p>
                    <strong>Popüler Tarayıcılar:</strong>
                  </p>
                  <p>• Chrome: Ayarlar → Gizlilik → Çerezler</p>
                  <p>• Firefox: Seçenekler → Gizlilik → Çerezler</p>
                  <p>• Safari: Tercihler → Gizlilik → Çerezler</p>

                  <p className="text-yellow-200">
                    ⚠️ Önemli Uyarı: Zorunlu çerezleri devre dışı bırakırsanız giriş yapamayabilir, oturumunuz
                    kapanabilir ve bazı özellikler çalışmayabilir.
                  </p>
                </div>
              </div>

              {/* Section 3: Çerezler Yoluyla Toplanan Veriler */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">3. Çerezler Yoluyla Toplanan Veriler</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    IP adresi, tarayıcı bilgisi, oturum süresi, cihaz türü gibi teknik veriler{" "}
                    <strong>anonim şekilde</strong> toplanır.
                  </p>

                  <p>
                    <strong>Toplanan Teknik Veriler:</strong>
                  </p>
                  <p>• IP adresi (anonim)</p>
                  <p>• Tarayıcı türü ve sürümü</p>
                  <p>• İşletim sistemi</p>
                  <p>• Ekran çözünürlüğü</p>
                  <p>• Ziyaret edilen sayfalar</p>
                  <p>• Oturum süresi</p>

                  <p>
                    <strong>Gizlilik Garantileri:</strong>
                  </p>
                  <p>• Kişisel kimlik bilgisi toplanmaz</p>
                  <p>• Veriler şifrelenir</p>
                  <p>• Üçüncü tarafla paylaşılmaz</p>
                  <p>• Sadece istatistik amaçlı</p>
                  <p>• KVKK uyumlu</p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">Çerezler Hakkında Sorularınız</h3>
                <div className="text-white/80 space-y-2">
                  <p>Çerez politikamız hakkında sorularınız varsa bizimle iletişime geçebilirsiniz:</p>
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
                  <h3 className="text-lg font-bold text-white mb-3">Kullanım Şartları</h3>
                  <p className="text-white/70 text-sm mb-4">Uygulama kullanım kuralları ve sorumluluklar</p>
                  <Link href="/kullanim-sartlari">
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
