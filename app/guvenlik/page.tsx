import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  Lock,
  Eye,
  Server,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Award,
  Key,
  Database,
  UserCheck,
  ArrowRight,
} from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "TLS 1.3 Şifreleme",
      description: "Tüm veri iletişimi güncel TLS 1.3 protokolü ile şifrelenir",
    },

    {
      icon: Eye,
      title: "Gizlilik Odaklı",
      description: "Verileriniz hiçbir şekilde üçüncü taraflarla paylaşılmaz veya satılmaz",
    },
    {
      icon: FileCheck,
      title: "KVKK Uyumlu",
      description: "6698 sayılı Kişisel Verilerin Korunması Kanunu'na tam uyum",
    },
    {
      icon: Key,
      title: "Supabase Auth",
      description: "Endüstri standardı kimlik doğrulama ve oturum yönetimi",
    },
    {
      icon: Database,
      title: "AES-256 Şifreleme",
      description: "Hassas veriler AES-256-GCM algoritması ile şifrelenir",
    },
  ]

  const certifications = [
    {
      icon: FileCheck,
      title: "KVKK Uyumlu",
      description: "Kişisel Verilerin Korunması Kanunu'na tam uyum",
    },
    {
      icon: Award,
      title: "Güvenli Ödeme",
      description: "PayTR PCI-DSS sertifikalı ödeme altyapısı kullanılır",
    },
    {
      icon: CheckCircle,
      title: "SSL/TLS Şifreleme",
      description: "TLS 1.3 protokolü ile veri iletimi korunur",
    },
  ]

  const dataProtection = [
    {
      title: "Veri Toplama",
      description: "Sadece gerekli verileri topluyoruz ve açık rıza alıyoruz",
      icon: UserCheck,
    },
    {
      title: "Veri Saklama",
      description: "Veriler şifreli ve güvenli sunucularda saklanır",
      icon: Database,
    },
    {
      title: "Veri İşleme",
      description: "Verileriniz sadece hizmet sunumu için işlenir",
      icon: Server,
    },
    {
      title: "Veri Silme",
      description: "İstediğiniz zaman verilerinizi tamamen silebilirsiniz",
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vh] bg-teal-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-white/80 text-sm font-medium">Güvenlik ve Gizlilik</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Verileriniz <span className="text-emerald-400">Güvende</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
              Endüstri standardı güvenlik önlemleri ile finansal verilerinizi koruyoruz
            </p>
            <Link href="/giris">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600"
              >
                Güvenle Başlayın
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Güvenlik <span className="text-emerald-400">Özellikleri</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Çok katmanlı güvenlik altyapımız ile verileriniz her zaman korunur
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group"
                >
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                      <feature.icon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/70 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Güvenlik <span className="text-teal-400">Altyapımız</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Güvenilir ve sertifikalı altyapı sağlayıcıları üzerinde çalışır
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {certifications.map((cert, index) => (
                <Card
                  key={index}
                  className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <cert.icon className="w-10 h-10 text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{cert.title}</h3>
                    <p className="text-white/70 text-sm">{cert.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Veri <span className="text-emerald-400">Koruma</span> Süreçlerimiz
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">Verilerinizin yaşam döngüsü boyunca tam koruma</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {dataProtection.map((item, index) => (
                <div key={index} className="relative">
                  <Card className="bg-black/20 border-white/10 backdrop-blur-xl h-full">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-emerald-400">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <item.icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-white/70 text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500/50 to-teal-500/50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Practices */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="bg-black/20 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Güvenlik <span className="text-emerald-400">Uygulamalarımız</span>
                  </h2>
                  <div className="space-y-4">
                    {[
                      "Rate limiting ile API endpoint koruması (DDoS önleme)",
                      "Pre-commit hooks ile API anahtarı sızıntı önleme",
                      "Supabase otomatik yedekleme (günlük)",
                      "Webhook idempotency ile çift ücretlendirme koruması",
                      "PCI-DSS uyumlu ödeme (PayTR checkout form)",
                      "TLS 1.3 ve AES-256 ile şifreli veri iletimi ve saklama",
                    ].map((practice, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/80">{practice}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-8 border border-white/10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                      <span className="text-white/80">Altyapı Uptime (Vercel)</span>
                      <span className="text-emerald-400 font-bold">99.99%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                      <span className="text-white/80">Veri Şifreleme</span>
                      <span className="text-emerald-400 font-bold">AES-256</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                      <span className="text-white/80">Supabase Backup</span>
                      <span className="text-emerald-400 font-bold">Otomatik</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                      <span className="text-white/80">SSL/TLS</span>
                      <span className="text-emerald-400 font-bold">TLS 1.3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Responsible Disclosure */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Güvenlik Açığı Bildirimi</h3>
                    <p className="text-white/70 mb-6 leading-relaxed">
                      Sistemlerimizde bir güvenlik açığı tespit ettiyseniz, lütfen bize bildirin. Sorumlu açıklama
                      politikamız gereği, bildirilen güvenlik açıklarını en kısa sürede değerlendirip çözüme
                      kavuşturuyoruz.
                    </p>
                    <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600">
                      Güvenlik Ekibiyle İletişime Geçin
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl border border-emerald-500/20 p-12 md:p-16 text-center backdrop-blur-xl overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Güvenliğiniz <span className="text-emerald-400">Önceliğimiz</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Güvenli ve şifreli altyapı ile finansal verilerinizi yönetin
                </p>
                <Link href="/giris">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                  >
                    Güvenle Başlayın
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
