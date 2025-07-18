import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Target,
  Eye,
  Heart,
  Award,
  MapPin,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Star,
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
                  2019'dan beri Türkiye'de kredi yönetimi alanında devrim yaratıyoruz. OCR teknolojisi ile finansal
                  verilerinizi dijitalleştiren ilk platform olarak, 1.2 milyondan fazla kullanıcıya hizmet veriyoruz.
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
                      className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
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
                      <div className="text-4xl font-bold text-emerald-400 mb-2">1.2M+</div>
                      <div className="text-white/60 text-sm">Aktif Kullanıcı</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-teal-400 mb-2">5+</div>
                      <div className="text-white/60 text-sm">Yıllık Deneyim</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-400 mb-2">25+</div>
                      <div className="text-white/60 text-sm">Banka Ortağı</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-teal-400 mb-2">99.8%</div>
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
                {/* 2019 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="lg:text-right">
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4 lg:justify-end">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        <span className="text-2xl font-bold text-emerald-400">2019</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Kuruluş</h3>
                      <p className="text-white/70">
                        KrediTakip'in temelleri atıldı. OCR teknolojisi ile kredi yönetimi vizyonu doğdu.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div className="lg:hidden" />
                </div>

                {/* 2020 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-teal-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div>
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-6 h-6 text-teal-400" />
                        <span className="text-2xl font-bold text-teal-400">2020</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">İlk Ürün Lansmanı</h3>
                      <p className="text-white/70">
                        Beta versiyonu piyasaya sürüldü. İlk 1000 kullanıcıya ulaştık ve değerli geri bildirimler aldık.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2021 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="lg:text-right">
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4 lg:justify-end">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        <span className="text-2xl font-bold text-emerald-400">2021</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Büyük Büyüme</h3>
                      <p className="text-white/70">
                        50,000 aktif kullanıcıya ulaştık. İlk banka ortaklıklarımızı kurduk ve AI teknolojimizi
                        geliştirdik.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div className="lg:hidden" />
                </div>

                {/* 2022 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-teal-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div>
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-6 h-6 text-teal-400" />
                        <span className="text-2xl font-bold text-teal-400">2022</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Seri A Yatırımı</h3>
                      <p className="text-white/70">
                        500,000 kullanıcıya ulaştık. Önemli bir yatırım aldık ve ekibimizi genişlettik.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2023 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="lg:text-right">
                    <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4 lg:justify-end">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        <span className="text-2xl font-bold text-emerald-400">2023</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Pazar Lideri</h3>
                      <p className="text-white/70">
                        1 milyon kullanıcıyı geçtik. Türkiye'nin en büyük kredi yönetim platformu olduk.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-brand-dark" />
                  </div>
                  <div className="lg:hidden" />
                </div>

                {/* 2024 */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="hidden lg:flex justify-center">
                    <div className="w-4 h-4 bg-teal-500 rounded-full border-4 border-brand-dark animate-pulse" />
                  </div>
                  <div>
                    <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-3xl p-8 backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-6 h-6 text-teal-400" />
                        <span className="text-2xl font-bold text-teal-400">2024</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Global Genişleme</h3>
                      <p className="text-white/70">
                        1.2 milyon kullanıcı ve global pazara açılma planları. Yeni özellikler ve ortaklıklar.
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
                  <h3 className="text-xl font-bold text-white mb-2">Ahmet Yılmaz</h3>
                  <p className="text-emerald-400 font-medium mb-4">Kurucu & CEO</p>
                  <p className="text-white/70 text-sm mb-6">
                    15 yıllık fintech deneyimi. Önceden Goldman Sachs ve McKinsey'de çalıştı.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href="#"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="#"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="#"
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
                  <h3 className="text-xl font-bold text-white mb-2">Elif Kaya</h3>
                  <p className="text-teal-400 font-medium mb-4">CTO</p>
                  <p className="text-white/70 text-sm mb-6">
                    AI ve makine öğrenmesi uzmanı. MIT mezunu, 12 yıllık teknoloji deneyimi.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href="#"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="#"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="#"
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
                  <h3 className="text-xl font-bold text-white mb-2">Mehmet Özkan</h3>
                  <p className="text-emerald-400 font-medium mb-4">CPO</p>
                  <p className="text-white/70 text-sm mb-6">
                    Ürün geliştirme ve kullanıcı deneyimi uzmanı. Google ve Spotify'da çalıştı.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href="#"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="#"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-white/60" />
                    </Link>
                    <Link
                      href="#"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-white/60" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-white/70 mb-6">Ekibimize katılmak ister misiniz? Açık pozisyonlarımızı inceleyin.</p>
              <Button 
                variant="outline"
                className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                >
                Kariyer Fırsatları
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Awards & Certifications */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ödüller ve <span className="text-teal-400">Sertifikalar</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Sektördeki başarılarımız ve aldığımız sertifikalar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <Award className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Fintech Ödülü 2023</h3>
                  <p className="text-white/60 text-sm">En İnovatif Fintech Ürünü</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-teal-500/40 group-hover:to-teal-500/20 transition-all duration-500">
                    <Shield className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">ISO 27001</h3>
                  <p className="text-white/60 text-sm">Bilgi Güvenliği Sertifikası</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                    <Star className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Startup of the Year</h3>
                  <p className="text-white/60 text-sm">TechCrunch Turkey 2022</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-teal-500/40 group-hover:to-teal-500/20 transition-all duration-500">
                    <Globe className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">KVKK Uyumlu</h3>
                  <p className="text-white/60 text-sm">Veri Koruma Sertifikası</p>
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
                Ofis <span className="text-emerald-400">Lokasyonları</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Türkiye'nin farklı şehirlerinde hizmet veriyoruz
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Istanbul Office */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">İstanbul - Merkez Ofis</h3>
                      <div className="space-y-2 text-white/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">Maslak Mah. Büyükdere Cad. No: 123, Kat: 15</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">Pazartesi - Cuma: 09:00 - 18:00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">45 Çalışan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ankara Office */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Ankara - Ar-Ge Merkezi</h3>
                      <div className="space-y-2 text-white/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-400" />
                          <span className="text-sm">Çankaya Mah. Atatürk Bulvarı No: 456, Kat: 8</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-400" />
                          <span className="text-sm">Pazartesi - Cuma: 09:00 - 18:00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal-400" />
                          <span className="text-sm">25 Çalışan</span>
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
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">1.2M+</div>
                  <div className="text-white/60">Aktif Kullanıcı</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">5M+</div>
                  <div className="text-white/60">İşlenen Döküm</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">25+</div>
                  <div className="text-white/60">Banka Ortağı</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">70+</div>
                  <div className="text-white/60">Ekip Üyesi</div>
                </div>
              </div>

              <div className="mt-12 grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 mb-2">99.8%</div>
                  <div className="text-white/60 text-sm">OCR Doğruluk Oranı</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-400 mb-2">{"<3s"}</div>
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
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                  >
                    Açık Pozisyonlar
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Link href="/iletisim">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
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
