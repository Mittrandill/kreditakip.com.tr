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
                <span className="text-sm">Yürürlük Tarihi: 15 Ocak 2024</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-8 md:p-12">
              {/* Veri Sorumlusu */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Veri Sorumlusu</h2>
                <div className="text-white/80 space-y-2">
                  <p>
                    <strong>Kredi Takip</strong>
                  </p>
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

              {/* Section 1: Hangi Verileri İşliyoruz */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">1. Hangi Verileri İşliyoruz?</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>Kimlik Verileri:</strong> Ad, soyad, e-posta adresi, telefon numarası
                  </p>
                  <p>
                    <strong>Finansal Veriler:</strong> Kredi dökümanları (PDF), şifrelenmiş bankacılık verileri,
                    kullanıcı giriş geçmişi
                  </p>
                  <p>
                    <strong>Teknik Veriler:</strong> IP Adresi, cihaz bilgisi, lokasyon, log kayıtları
                  </p>
                </div>
              </div>

              {/* Section 2: İşleme Amaçlarımız */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">2. İşleme Amaçlarımız</h2>
                <div className="text-white/80 leading-relaxed space-y-2">
                  <p>1. Hizmetin sunulması ve destek verilmesi</p>
                  <p>2. Kullanıcının kredi takibini yapabilmesi</p>
                  <p>3. Hukuki yükümlülüklerin yerine getirilmesi</p>
                  <p>4. Uygulamanın güvenliğini sağlama</p>
                </div>
              </div>

              {/* Section 3: Hukuki Sebep */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">3. Hukuki Sebep</h2>
                <div className="text-white/80 leading-relaxed space-y-2">
                  <p>Kişisel verileriniz aşağıdaki hukuki sebeplere dayanarak işlenmektedir:</p>
                  <p>• KVKK m.5/2(c): Sözleşmenin kurulması ve ifası</p>
                  <p>• KVKK m.5/2(e): Bir hakkın tesisi, kullanılması veya korunması</p>
                  <p>• KVKK m.5/2(f): Meşru menfaat</p>
                </div>
              </div>

              {/* Section 4: Verilerin Aktarımı */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">4. Verilerin Aktarımı</h2>
                <div className="text-white/80 leading-relaxed space-y-2">
                  <p>
                    <strong>Yurt dışına veri aktarımı yapılmaz.</strong> Teknik hizmet alınan altyapılar Türkiye
                    merkezlidir veya KVKK uygunluğu belgelenmiş sağlayıcılardır.
                  </p>
                  <p>• Türkiye Sunucuları: Vercel, Supabase</p>
                  <p>• KVKK Uyumlu: Sertifikalı sağlayıcılar</p>
                  <p>• Güvenli Aktarım: SSL/TLS şifreleme</p>
                </div>
              </div>

              {/* Section 5: Haklarınız */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">5. Haklarınız</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>KVKK m.11 uyarınca</strong> aşağıdaki haklara sahipsiniz:
                  </p>
                  <p>• Bilgi talep etme</p>
                  <p>• Düzeltme</p>
                  <p>• Silme</p>
                  <p>• İşlemeye itiraz etme</p>
                  <p>• İşlemeyi kısıtlama</p>
                  <p>• Kurula şikayette bulunma</p>

                  <p>
                    <strong>Haklarınızı Nasıl Kullanabilirsiniz?</strong>
                  </p>
                  <p>1. Kimlik bilgilerinizi belirtin</p>
                  <p>2. Talebinizi açık şekilde yazın</p>
                  <p>3. 30 gün içinde yanıt alın</p>
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
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
