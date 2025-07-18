import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Calendar, ArrowRight } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function PrivacyPolicyPage() {
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
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-white/80 text-sm font-medium">Gizlilik ve Güvenlik</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-emerald-400">Gizlilik</span> Politikası
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Kullanıcılarımızın gizliliğini ve verilerinin güvenliğini birinci önceliğimiz kabul ediyoruz.
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
              {/* Section 1: Toplanan Veriler */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">1. Toplanan Veriler</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>Kişisel Bilgiler:</strong> Ad, soyad, e-posta, telefon (gönüllü olarak girilen bilgiler)
                  </p>
                  <p>
                    <strong>Kredi Dökümanları:</strong> PDF formatındaki kredi ekstreleri
                  </p>
                  <p>
                    <strong>Şifrelenmiş Bankacılık Verileri:</strong> Görülemeyen, çözümlenemeyen biçimde saklanan
                    veriler
                  </p>
                  <p>
                    <strong>Teknik Veriler:</strong> Cihaz, IP, tarayıcı, lokasyon gibi teknik bilgiler
                  </p>
                </div>
              </div>

              {/* Section 2: Verilerin Kullanım Amacı */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">2. Verilerin Kullanım Amacı</h2>
                <div className="text-white/80 leading-relaxed space-y-2">
                  <p>• Hizmetin ifası ve teknik destek sağlanması</p>
                  <p>• Kullanıcının kredi takibini kolaylaştırma</p>
                  <p>• Güvenlik, istatistik ve sistem iyileştirme amaçları</p>
                </div>
              </div>

              {/* Section 3: Üçüncü Taraflarla Paylaşım */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">3. Üçüncü Taraflarla Paylaşım</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    <strong>
                      Kredi Takip, verilerinizi hiçbir koşulda reklam, analiz veya benzeri ticari amaçlarla üçüncü
                      kişilerle paylaşmaz.
                    </strong>
                  </p>
                  <p>Ancak aşağıdaki durumlarda sınırlı paylaşım yapılabilir:</p>
                  <p>• Yasal zorunluluklar</p>
                  <p>• Mahkeme/BTK/EMNİYET gibi resmi merciler tarafından talep edilmesi halinde</p>
                  <p className="text-sm">
                    Bu durumda bilgiler yalnızca gerekli olan kısmıyla sınırlı olarak paylaşılır.
                  </p>
                </div>
              </div>

              {/* Section 4: Güvenlik */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">4. Güvenlik</h2>
                <div className="text-white/80 leading-relaxed space-y-2">
                  <p>
                    <strong>Bankacılık şifreleri hiçbir şekilde görüntülenemez, şifresiz hali saklanmaz.</strong>
                  </p>
                  <p>
                    Tüm veriler <strong>AES-256, SHA-512 + salt</strong> gibi endüstri standardı şifreleme algoritmaları
                    ile korunur.
                  </p>
                  <p>
                    Yetkisiz erişim, değiştirme veya ifşa riskine karşı tüm fiziksel ve dijital güvenlik önlemleri
                    alınır.
                  </p>
                </div>
              </div>

              {/* Section 5: Haklarınız */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">5. Haklarınız</h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
                  <p>• Verilerinize erişme hakkı</p>
                  <p>• Düzeltme hakkı</p>
                  <p>• Silme hakkı</p>
                  <p>• İşlemeyi kısıtlama hakkı</p>
                  <p>
                    Başvuru için:{" "}
                    <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">
                      info@kreditakip.com.tr
                    </a>
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">İletişim Bilgileri</h3>
                <div className="text-white/80 space-y-2">
                  <p>
                    <strong>Şirket:</strong> Kredi Takip
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
            </div>

            {/* Related Links */}
            <div className="mt-12 grid md:grid-cols-3 gap-6">
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

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">KVKK Aydınlatma</h3>
                  <p className="text-white/70 text-sm mb-4">Kişisel verilerin korunması hakkında</p>
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
