"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import {
  ArrowRight,
  Users,
  BarChart3,
  Scan,
  Brain,
  Shield,
  CheckCircle,
  Play,
  TrendingUp,
  FileText,
  Clock,
  Rocket,
  CreditCard,
  Star,
  DollarSign,
  Target,
  Zap,
  Sparkles,
  Building2,
  Headphones,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      setCount(Math.floor(progress * end))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold text-white">
      {count.toLocaleString()}
      {suffix}
    </div>
  )
}

// Floating Credit Card Component
function FloatingCreditCard({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-80 h-48 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
        <div className="p-6 h-full flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div className="w-12 h-8 bg-white/30 rounded backdrop-blur-sm" />
            <div className="text-right">
              <div className="text-xs opacity-80">KrediTakip</div>
              <div className="text-sm font-semibold">Premium</div>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-wider mb-2">•••• •••• •••• 1234</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs opacity-80">Kart Sahibi</div>
                <div className="text-sm font-semibold">AHMET YILMAZ</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-80">Son Kullanma</div>
                <div className="text-sm font-semibold">12/28</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const features = [
    {
      icon: Scan,
      title: "OCR Teknolojisi",
      description: "PDF ödeme planlarınızı saniyeler içinde analiz edin. Tüm banka formatları desteklenir.",
      color: "from-emerald-500 to-teal-500",
      stats: "99.9% Doğruluk",
      benefits: ["Otomatik veri çıkarma", "Manuel giriş yok", "Hata oranı %0.1"],
    },
    {
      icon: Brain,
      title: "Yapay Zeka Analizi",
      description: "AI destekli risk analizi ve refinansman önerileri ile tasarruf edin.",
      color: "from-purple-500 to-pink-500",
      stats: "Ortalama %30 Tasarruf",
      benefits: ["Kişisel öneriler", "Risk skorlama", "Otomatik uyarılar"],
    },
    {
      icon: BarChart3,
      title: "Gelişmiş Raporlama",
      description: "Detaylı grafikler ve analizlerle kredi durumunuzu görselleştirin.",
      color: "from-blue-500 to-cyan-500",
      stats: "Gerçek Zamanlı",
      benefits: ["İnteraktif grafikler", "PDF/Excel export", "Özelleştirilebilir"],
    },
    {
      icon: Shield,
      title: "Banka Seviyesi Güvenlik",
      description: "256-bit şifreleme ile verileriniz maksimum güvenlik altında.",
      color: "from-orange-500 to-red-500",
      stats: "SOC 2 Sertifikalı",
      benefits: ["End-to-end şifreleme", "Güvenlik denetimleri", "KVKK uyumlu"],
    },
  ]

  const stats = [
    {
      label: "Aktif Kullanıcı",
      value: 25000,
      suffix: "+",
      icon: Users,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Analiz Edilen Kredi",
      value: 100000,
      suffix: "+",
      icon: CreditCard,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Toplam Tasarruf",
      value: 2500000,
      suffix: "₺",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Doğruluk Oranı",
      value: 99.9,
      suffix: "%",
      icon: Target,
      color: "from-orange-500 to-red-500",
    },
  ]

  const testimonials = [
    {
      name: "Ahmet Yılmaz",
      role: "Girişimci",
      company: "Tech Startup",
      content: "OCR teknolojisi sayesinde 50+ kredi belgemin analizini dakikalar içinde tamamladım. Müthiş!",
      avatar: "AY",
      rating: 5,
      savings: "₺4,200/ay tasarruf",
    },
    {
      name: "Elif Kaya",
      role: "Finans Uzmanı",
      company: "Kaya Holding",
      content: "AI destekli risk analizi sayesinde %30 daha düşük faizli kredi buldum.",
      avatar: "EK",
      rating: 5,
      savings: "₺6,800/ay tasarruf",
    },
    {
      name: "Mehmet Demir",
      role: "İnşaat Müteahhidi",
      company: "Demir İnşaat",
      content: "Tüm projelerimin kredi takibini tek yerden yapabiliyorum. Artık hiçbir ödeme kaçmıyor.",
      avatar: "MD",
      rating: 5,
      savings: "₺12,500/ay tasarruf",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div
        className="fixed inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16,185,129,0.15), transparent 40%)`,
        }}
      />

      {/* Floating geometric shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse delay-2000" />
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-8 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 text-base px-6 py-2">
                <Sparkles className="mr-2 h-4 w-4" />
                Türkiye'nin #1 Kredi Yönetim Platformu
              </Badge>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="block text-white">Kredilerinizi</span>
                <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Akıllıca Yönetin
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                OCR teknolojisi ve yapay zeka ile PDF ödeme planlarınızı saniyeler içinde analiz edin.
                <span className="font-semibold text-emerald-400"> Ortalama aylık ₺3,500 tasarruf</span> sağlayın.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4 h-auto"
                  onClick={() => router.push("/giris")}
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  14 Gün Ücretsiz Dene
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-white-300 hover:bg-gray-800 hover:border-emerald-500 text-lg px-8 py-4 h-auto"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Demo İzleyin
                </Button>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Kredi kartı gerekmez
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  30 gün para iade garantisi
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />2 dakikada kurulum
                </div>
              </div>
            </div>

            {/* Right Content - Floating Credit Cards */}
            <div className="relative hidden lg:block">
              <FloatingCreditCard className="absolute top-0 left-0 animate-float" />
              <FloatingCreditCard className="absolute top-20 left-20 animate-float-delayed opacity-80" />
              <FloatingCreditCard className="absolute top-40 left-10 animate-float-slow opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="nasil-calisir" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Zap className="mr-2 h-4 w-4" />
              Nasıl Çalışır
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              3 Basit Adımda{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Kredi Yönetimi
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Dakikalar içinde kredilerinizi profesyonel seviyede yönetmeye başlayın
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "PDF Yükleyin",
                description: "Kredi ödeme planınızı platforma yükleyin",
                icon: FileText,
                color: "from-emerald-500 to-teal-500",
              },
              {
                step: "02",
                title: "AI Analizi",
                description: "Yapay zeka otomatik olarak analiz eder",
                icon: Brain,
                color: "from-purple-500 to-pink-500",
              },
              {
                step: "03",
                title: "Akıllı Öneriler",
                description: "Tasarruf önerilerinizi alın ve uygulayın",
                icon: TrendingUp,
                color: "from-blue-500 to-cyan-500",
              },
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div
                    className={`w-20 h-20 mx-auto bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {step.step}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border-4 border-gray-700 shadow-lg">
                    <step.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Sparkles className="mr-2 h-4 w-4" />
              Premium Özellikler
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Kredi Yönetiminde{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Yeni Nesil Teknoloji
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Finansal geleceğinizi güvence altına alacak gelişmiş araçlar ve analizler
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all duration-300"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{feature.stats}</Badge>
                  </div>
                  <CardTitle className="text-2xl text-white group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 text-lg leading-relaxed mb-6">
                    {feature.description}
                  </CardDescription>

                  <div className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-gray-400">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Müşteri Yorumları</h2>
            <p className="text-xl text-gray-300">25,000+ memnun kullanıcımızın deneyimleri</p>
            <div className="flex justify-center items-center gap-2 mt-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-400 ml-2">4.9/5 ortalama puan</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                      <div className="text-xs text-gray-500">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {testimonial.savings}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Türkiye'nin Önde Gelen Şirketleri Tarafından Güveniliyor
            </h3>
            <p className="text-gray-300">500+ şirket, 25,000+ kullanıcı, ₺2.5M+ tasarruf</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "500+", label: "Şirket", icon: Building2 },
              { value: "25K+", label: "Kullanıcı", icon: Users },
              { value: "₺2.5M+", label: "Tasarruf", icon: TrendingUp },
              { value: "99.9%", label: "Uptime", icon: Shield },
            ].map((stat, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 text-center p-6">
                <stat.icon className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg px-6 py-2 animate-pulse">
              <DollarSign className="mr-2 h-5 w-5" />
              Sınırlı Süre: İlk 1000 kullanıcıya %50 indirim!
            </Badge>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Finansal Geleceğinizi
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Devrim Niteliğinde Değiştirin
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Bugün başlayın ve kredilerinizi profesyonel seviyede yönetmenin avantajlarını yaşayın.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4 h-auto"
                onClick={() => router.push("/giris")}
              >
                <Rocket className="mr-2 h-5 w-5" />
                14 Gün Ücretsiz Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-emerald-500 text-lg px-8 py-4 h-auto"
                onClick={() => router.push("/iletisim")}
              >
                <Headphones className="mr-2 h-5 w-5" />
                Demo Talep Et
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Kredi kartı gerekmez
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                30 gün para iade garantisi
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Anında kurulum
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-emerald-400" />
                7/24 destek
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(12deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(8deg); }
          50% { transform: translateY(-15px) rotate(8deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(15deg); }
          50% { transform: translateY(-10px) rotate(15deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
