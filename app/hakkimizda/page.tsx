import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Target,
  Eye,
  Heart,
  MapPin,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Linkedin,
  Twitter,
  Mail,
  Building,
  Clock,
} from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function AboutPage() {
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
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-white/80 text-sm font-medium">Hikayemiz</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Finansal <span className="text-emerald-400">Özgürlüğün</span>
                  <br />
                  Öncüleri
                </h1>
                <p className="text-xl text-white/70 mb-8 leading-relaxed">
                  2024'te kurulan KrediTakip, OCR teknolojisi ile kredi yönetiminde yeni bir dönem başlatıyor. Finansal
                  verilerinizi dijitalleştiren modern platformumuzla, kullanıcılarımıza güvenli ve kolay kredi takibi
                  deneyimi sunuyoruz.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/giris">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600"
                    >
                      Bize Katılın
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/iletisim">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                    >
                      İletişime Geçin
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-400 mb-2">1000+</div>
                      <div className="text-white/60 text-sm">Analiz Edilen Döküm</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-teal-400 mb-2">2024</div>
                      <div className="text-white/60 text-sm">Kuruluş Yılı</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-400 mb-2">15+</div>
                      <div className="text-white/60 text-sm">Banka Desteği</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-teal-400 mb-2">99.5%</div>
                      <div className="text-white/60 text-sm">Doğruluk Oranı</div>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500/20 rounded-full animate-bounce" />
                <div
                  className="absolute -bottom-4 -left-4 w-6 h-6 bg-teal-500/20 rounded-full animate-bounce"
                  style={{ animationDelay: "1s" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Değerlerimiz ve <span className="text-emerald-400">Vizyonumuz</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Finansal teknoloji alanında öncü olmak ve kullanıcılarımızın hayatını kolaylaştırmak için çalışıyoruz
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Mission */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <Target className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Misyonumuz</h3>
                  <p className="text-white/70 leading-relaxed">
                    Türkiye'deki her bireyin finansal verilerini kolayca yönetebilmesi ve akıllı kararlar alabilmesi
                    için teknoloji odaklı çözümler sunmak.
                  </p>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:from-teal-500/40 group-hover:to-teal-500/20 transition-all duration-500">
                    <Eye className="w-10 h-10 text-teal-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Vizyonumuz</h3>
                  <p className="text-white/70 leading-relaxed">
                    Finansal teknoloji alanında Türkiye'nin lider platformu olmak ve global pazarda tanınan bir marka
                    haline gelmek.
                  </p>
                </CardContent>
              </Card>

              {/* Values */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <Heart className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Değerlerimiz</h3>
                  <p className="text-white/70 leading-relaxed">
                    Güvenilirlik, şeffaflık, yenilikçilik ve kullanıcı odaklılık temel değerlerimizdir. Her kararımızda
                    bu ilkeleri gözetiyoruz.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Company Timeline */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Yolculuğumuz ve <span className="text-teal-400">Kilometre Taşları</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                2019'dan bugüne kadar kat ettiğimiz yol ve elde ettiğimiz başarılar
              </p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-emerald-500/50 to-teal-500/50 rounded-full hidden lg:block" />

              <div className="space-y-16">
                {/* 2024 Q1 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="lg:text-right">
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4 lg:justify-end">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        <span className="text-2xl font-bold text-emerald-400">2024 Q1</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Kuruluş ve Geliştirme</h3>
                      <p className="text-white/70">
                        KrediTakip'in temelleri atıldı. OCR teknolojisi ile kredi yönetimi vizyonu hayata geçirilmeye
                        başlandı.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div className="lg:hidden" />
                </div>

                {/* 2024 Q2 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-teal-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div>
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-6 h-6 text-teal-400" />
                        <span className="text-2xl font-bold text-teal-400">2024 Q2</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Beta Lansmanı</h3>
                      <p className="text-white/70">
                        Beta versiyonu piyasaya sürüldü. İlk kullanıcılarımızdan değerli geri bildirimler aldık ve
                        ürünümüzü geliştirdik.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2024 Q3 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="lg:text-right">
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4 lg:justify-end">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        <span className="text-2xl font-bold text-emerald-400">2024 Q3</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Resmi Lansman</h3>
                      <p className="text-white/70">
                        Platform resmi olarak kullanıma açıldı. İlk banka entegrasyonlarımızı tamamladık ve kullanıcı
                        tabanımızı genişlettik.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div className="lg:hidden" />
                </div>

                {/* 2024 Q4 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-teal-500 rounded-full border-4 border-brand-dark animate-pulse" />
                  </div>
                  <div>
                    <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-6 h-6 text-teal-400" />
                        <span className="text-2xl font-bold text-teal-400">2024 Q4</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Büyüme ve Yenilikler</h3>
                      <p className="text-white/70">
                        Kullanıcı sayımız hızla artıyor. Yeni özellikler ve banka ortaklıkları eklemeye devam ediyoruz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Uzman <span className="text-emerald-400">Ekibimiz</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Finansal teknoloji alanında deneyimli profesyonellerden oluşan ekibimiz
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Team Member 1 */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <Users className="w-12 h-12 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Kurucu Ekip</h3>
                  <p className="text-emerald-400 font-medium mb-4">Yönetim</p>
                  <p className="text-white/70 text-sm mb-6">
                    Fintech ve teknoloji alanında deneyimli profesyonellerden oluşan kurucu ekibimiz.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href="https://linkedin.com/company/kreditakipcomtr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="https://x.com/kreditakipcomtr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="mailto:info@kreditakip.com.tr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-white/60" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Team Member 2 */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-teal-500/40 group-hover:to-teal-500/20 transition-all duration-500">
                    <Zap className="w-12 h-12 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Geliştirme Ekibi</h3>
                  <p className="text-teal-400 font-medium mb-4">Teknoloji</p>
                  <p className="text-white/70 text-sm mb-6">
                    Modern teknolojiler ve AI konusunda uzman yazılım geliştirme ekibimiz.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href="https://linkedin.com/company/kreditakipcomtr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="https://x.com/kreditakipcomtr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="mailto:info@kreditakip.com.tr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-white/60" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Team Member 3 */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <TrendingUp className="w-12 h-12 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ürün Ekibi</h3>
                  <p className="text-emerald-400 font-medium mb-4">Ürün & Tasarım</p>
                  <p className="text-white/70 text-sm mb-6">
                    Kullanıcı deneyimi ve ürün geliştirme konusunda uzman ekibimiz.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href="https://linkedin.com/company/kreditakipcomtr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="https://x.com/kreditakipcomtr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="mailto:info@kreditakip.com.tr"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-white/60" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-white/70 mb-6">Ekibimize katılmak ister misiniz? Açık pozisyonlarımızı inceleyin.</p>
              <Link href="/kariyer">
                <Button
                  variant="outline"
                  className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                >
                  Kariyer Fırsatları
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Awards & Certifications */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Güvenlik ve <span className="text-teal-400">Sertifikalar</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">Güvenlik ve veri koruma standartlarına uygunluk</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <Shield className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">SSL Sertifikası</h3>
                  <p className="text-white/60 text-sm">256-bit Şifreleme</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-teal-500/40 group-hover:to-teal-500/20 transition-all duration-500">
                    <Shield className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">KVKK Uyumlu</h3>
                  <p className="text-white/60 text-sm">Veri Koruma Kanunu</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <Globe className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">PCI DSS</h3>
                  <p className="text-white/60 text-sm">Ödeme Güvenliği Standardı</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Office Locations */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ofis <span className="text-emerald-400">Lokasyonu</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">İzmir'den Türkiye'ye hizmet veriyoruz</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Çeşme - Merkez Ofis</h3>
                      <div className="space-y-2 text-white/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">Çeşme, İzmir, TR</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">Pazartesi - Cuma: 09:00 - 18:00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">Uzaktan Çalışma Destekli</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Company Stats */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="bg-black/20 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Rakamlarla <span className="text-emerald-400">KrediTakip</span>
                </h2>
                <p className="text-white/70">Başarılarımızı gösteren önemli istatistikler</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">1000+</div>
                  <div className="text-white/60">Analiz Edilen Döküm</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">5000+</div>
                  <div className="text-white/60">İşlenen Döküm</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">15+</div>
                  <div className="text-white/60">Banka Desteği</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">10+</div>
                  <div className="text-white/60">Ekip Üyesi</div>
                </div>
              </div>

              <div className="mt-12 grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 mb-2">99.5%</div>
                  <div className="text-white/60 text-sm">OCR Doğruluk Oranı</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-400 mb-2">{"<5s"}</div>
                  <div className="text-white/60 text-sm">Ortalama İşlem Süresi</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 mb-2">99.9%</div>
                  <div className="text-white/60 text-sm">Sistem Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-black/20 border border-white/10 rounded-3xl p-12 md:p-16 text-center backdrop-blur-xl overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Bizimle <span className="text-emerald-400">Çalışmak</span> İster misiniz?
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Finansal teknoloji alanında fark yaratmak ve Türkiye'nin dijital dönüşümüne katkıda bulunmak için
                  ekibimize katılın
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/kariyer">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                    >
                      Kariyer Fırsatları
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/iletisim">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                    >
                      İletişime Geçin
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
