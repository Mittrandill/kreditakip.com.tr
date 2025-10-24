import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Users, Heart, Zap, TrendingUp, Award, Coffee, Laptop, Globe, ArrowRight } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function CareerPage() {
  const openPositions = [
    {
      title: "Senior Full Stack Developer",
      department: "Mühendislik",
      location: "İstanbul / Uzaktan",
      type: "Tam Zamanlı",
      description: "React, Node.js ve AWS deneyimi olan senior developer arıyoruz.",
    },
    {
      title: "Product Manager",
      department: "Ürün",
      location: "İstanbul",
      type: "Tam Zamanlı",
      description: "Fintech deneyimi olan ve kullanıcı odaklı düşünen product manager.",
    },
    {
      title: "UI/UX Designer",
      department: "Tasarım",
      location: "İstanbul / Uzaktan",
      type: "Tam Zamanlı",
      description: "Kullanıcı deneyimi tasarımında uzman, yaratıcı designer.",
    },
    {
      title: "Data Scientist",
      department: "Veri Bilimi",
      location: "İstanbul",
      type: "Tam Zamanlı",
      description: "Machine learning ve finansal veri analizi deneyimi olan data scientist.",
    },
    {
      title: "DevOps Engineer",
      department: "Mühendislik",
      location: "İstanbul / Uzaktan",
      type: "Tam Zamanlı",
      description: "AWS, Kubernetes ve CI/CD konularında deneyimli DevOps engineer.",
    },
    {
      title: "Customer Success Manager",
      department: "Müşteri İlişkileri",
      location: "İstanbul",
      type: "Tam Zamanlı",
      description: "B2B SaaS deneyimi olan ve müşteri odaklı customer success manager.",
    },
  ]

  const benefits = [
    {
      icon: Heart,
      title: "Sağlık Sigortası",
      description: "Kapsamlı özel sağlık sigortası",
    },
    {
      icon: Laptop,
      title: "Uzaktan Çalışma",
      description: "Hibrit veya tam uzaktan çalışma seçeneği",
    },
    {
      icon: TrendingUp,
      title: "Kariyer Gelişimi",
      description: "Eğitim ve gelişim programları",
    },
    {
      icon: Coffee,
      title: "Esnek Saatler",
      description: "Esnek çalışma saatleri",
    },
    {
      icon: Award,
      title: "Performans Bonusu",
      description: "Yıllık performans primi",
    },
    {
      icon: Globe,
      title: "Global Ekip",
      description: "Uluslararası ekiple çalışma fırsatı",
    },
  ]

  const values = [
    {
      icon: Users,
      title: "Takım Ruhu",
      description: "Birlikte başarıyı kutlarız",
    },
    {
      icon: Zap,
      title: "Yenilikçilik",
      description: "Sürekli öğrenme ve gelişim",
    },
    {
      icon: Heart,
      title: "Kullanıcı Odaklılık",
      description: "Kullanıcılarımız her şeyden önce gelir",
    },
    {
      icon: TrendingUp,
      title: "Büyüme",
      description: "Bireysel ve kurumsal gelişim",
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
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Kariyer Fırsatları</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Geleceği <span className="text-emerald-400">Birlikte</span> İnşa Edelim
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
              Türkiye'nin yeni nesil fintech platformunda kariyer fırsatlarını keşfedin
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600"
            >
              Açık Pozisyonları Gör
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Neden <span className="text-emerald-400">KrediTakip</span>?
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Yenilikçi bir ekiple çalışın ve finansal teknoloji alanında fark yaratın
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card
                  key={index}
                  className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                      <value.icon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                    <p className="text-white/70 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Çalışan <span className="text-teal-400">Avantajları</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Ekip üyelerimize sunduğumuz kapsamlı yan haklar ve imkanlar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                        <p className="text-white/70 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Açık <span className="text-emerald-400">Pozisyonlar</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Ekibimizi genişletiyoruz. Açık pozisyonlar yakında burada yayınlanacak.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Açık Pozisyonlar Yakında</h3>
                  <p className="text-white/70 mb-8 leading-relaxed">
                    Ekibimizi büyütmeye devam ediyoruz. Yeni pozisyonlar için bizi takip edin veya spontan başvuru
                    yapın.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/iletisim">
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
                        Spontan Başvuru Yap
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="https://linkedin.com/company/kreditakipcomtr" target="_blank">
                      <Button
                        variant="outline"
                        className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                      >
                        LinkedIn'de Takip Et
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Başvuru <span className="text-teal-400">Süreci</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">Basit ve şeffaf bir işe alım süreci</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Başvuru", description: "Online başvuru formunu doldurun" },
                { step: "2", title: "İnceleme", description: "CV'niz incelenir ve değerlendirilir" },
                { step: "3", title: "Görüşme", description: "Ekip ile teknik ve kültürel uyum görüşmeleri" },
                { step: "4", title: "Teklif", description: "Uygun adaylara iş teklifi sunulur" },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-emerald-400">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-white/70 text-sm">{item.description}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500/50 to-teal-500/50" />
                  )}
                </div>
              ))}
            </div>
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
                  Aradığınız Pozisyonu <span className="text-emerald-400">Bulamadınız mı</span>?
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Spontan başvuru yapın, sizinle iletişime geçelim
                </p>
                <Link href="/iletisim">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                  >
                    İletişime Geçin
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
