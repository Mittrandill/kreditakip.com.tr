import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, Search, HelpCircle, FileText, Shield, CreditCard, Zap, ArrowRight } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function FAQPage() {
  const categories = [
    { icon: CreditCard, title: "Genel Sorular", count: 8 },
    { icon: Shield, title: "Güvenlik", count: 6 },
    { icon: FileText, title: "OCR ve Döküm", count: 7 },
    { icon: Zap, title: "Özellikler", count: 5 },
  ]

  const faqs = [
    {
      category: "Genel Sorular",
      questions: [
        {
          q: "KrediTakip nedir ve nasıl çalışır?",
          a: "KrediTakip, kredi kartı ve banka dökümlerinizi OCR teknolojisi ile dijitalleştiren, analiz eden ve akıllı ödeme planları oluşturan bir finansal yönetim platformudur. Dökümlerinizi yükleyin, sistem otomatik olarak analiz etsin ve size özel öneriler alsın.",
        },
        {
          q: "Ücretsiz plan ile neler yapabilirim?",
          a: "Ücretsiz plan ile ayda 5 döküm analizi yapabilir, temel ödeme planları oluşturabilir ve kredi takibi yapabilirsiniz. Premium özelliklere erişim için Pro veya Enterprise planlarımızı inceleyebilirsiniz.",
        },
        {
          q: "Hangi bankaları destekliyorsunuz?",
          a: "Türkiye'deki 25+ bankayı destekliyoruz. Akbank, Garanti BBVA, İş Bankası, Yapı Kredi, Ziraat Bankası, Halkbank ve daha fazlası. Sürekli olarak yeni bankalar ekliyoruz.",
        },
        {
          q: "Mobil uygulama var mı?",
          a: "Şu anda web tabanlı platformumuz tüm cihazlarda responsive olarak çalışmaktadır. PWA desteği sayesinde mobil cihazınıza uygulama gibi yükleyebilirsiniz. Native mobil uygulamalarımız yakında yayınlanacak.",
        },
      ],
    },
    {
      category: "Güvenlik",
      questions: [
        {
          q: "Verilerim güvende mi?",
          a: "Evet, verileriniz 256-bit SSL şifreleme ile korunmaktadır. ISO 27001 sertifikalı altyapımız ve KVKK uyumlu süreçlerimiz ile maksimum güvenlik sağlıyoruz. Verileriniz hiçbir şekilde üçüncü taraflarla paylaşılmaz.",
        },
        {
          q: "Banka bilgilerime erişiyor musunuz?",
          a: "Hayır, banka hesaplarınıza hiçbir şekilde erişmiyoruz. Sadece sizin yüklediğiniz PDF, JPG veya PNG formatındaki dökümlerinizi analiz ediyoruz. Banka şifrenizi veya hesap bilgilerinizi asla istemiyoruz.",
        },
        {
          q: "Verilerimi nasıl silebilirim?",
          a: "Hesap ayarlarından 'Hesabımı Sil' seçeneği ile tüm verilerinizi kalıcı olarak silebilirsiniz. Silme işlemi 30 gün içinde tamamlanır ve verileriniz sistemden tamamen kaldırılır.",
        },
      ],
    },
    {
      category: "OCR ve Döküm",
      questions: [
        {
          q: "Hangi dosya formatlarını destekliyorsunuz?",
          a: "PDF, JPG ve PNG formatlarını destekliyoruz. Maksimum dosya boyutu 10MB'dir. Çoklu sayfa PDF'ler de desteklenmektedir.",
        },
        {
          q: "OCR doğruluk oranı nedir?",
          a: "OCR teknolojimiz %99.8 doğruluk oranına sahiptir. Yapay zeka destekli sistemimiz sürekli öğrenerek kendini geliştirmektedir. Hatalı okunan veriler manuel olarak düzeltilebilir.",
        },
        {
          q: "Döküm analizi ne kadar sürer?",
          a: "Ortalama bir döküm analizi 3 saniyeden kısa sürede tamamlanır. Büyük ve çok sayfalı dökümler biraz daha uzun sürebilir ancak genellikle 10 saniyeyi geçmez.",
        },
        {
          q: "Eski dökümlerimi yükleyebilir miyim?",
          a: "Evet, istediğiniz tarihten dökümleri yükleyebilirsiniz. Geçmiş verilerinizi analiz ederek trend analizi ve finansal öngörüler sunuyoruz.",
        },
      ],
    },
    {
      category: "Özellikler",
      questions: [
        {
          q: "Akıllı ödeme planları nasıl çalışır?",
          a: "Yapay zeka algoritması, kredi borçlarınızı, faiz oranlarınızı ve ödeme gücünüzü analiz ederek size özel optimum ödeme planları oluşturur. Hangi krediyi önce kapatmanız gerektiğini ve ne kadar tasarruf edeceğinizi gösterir.",
        },
        {
          q: "Bildirim sistemi nasıl çalışır?",
          a: "Ödeme tarihleri yaklaştığında, limit aşımı olduğunda veya faiz oranlarında değişiklik olduğunda e-posta ve uygulama içi bildirim alırsınız. Bildirim tercihlerinizi ayarlardan özelleştirebilirsiniz.",
        },
        {
          q: "Raporları dışa aktarabilir miyim?",
          a: "Evet, Pro ve Enterprise planlarında raporlarınızı PDF ve Excel formatında dışa aktarabilirsiniz. Detaylı finansal analizler ve grafikler içerir.",
        },
      ],
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
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-white/80 text-sm font-medium">Sıkça Sorulan Sorular</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Size Nasıl <span className="text-emerald-400">Yardımcı</span> Olabiliriz?
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
              Merak ettiğiniz soruların cevaplarını bulun veya destek ekibimizle iletişime geçin
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Soru ara..."
                  className="w-full pl-14 pr-6 py-4 bg-black/20 border border-white/10 rounded-full text-white placeholder:text-white/50 focus:outline-none focus:border-emerald-500/50 backdrop-blur-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Card
                  key={index}
                  className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 cursor-pointer group"
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                      <category.icon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{category.title}</h3>
                    <p className="text-white/60 text-sm">{category.count} soru</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-4xl">
            {faqs.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-white">
                  <span className="text-emerald-400">{section.category}</span>
                </h2>
                <div className="space-y-4">
                  {section.questions.map((faq, faqIndex) => (
                    <details
                      key={faqIndex}
                      className="group bg-black/20 border border-white/10 rounded-2xl backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500"
                    >
                      <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                        <h3 className="text-lg font-semibold text-white pr-4">{faq.q}</h3>
                        <ChevronDown className="w-5 h-5 text-emerald-400 flex-shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-6 pb-6">
                        <p className="text-white/70 leading-relaxed">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl border border-emerald-500/20 p-12 md:p-16 text-center backdrop-blur-xl overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Cevabını <span className="text-emerald-400">Bulamadınız mı</span>?
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Destek ekibimiz size yardımcı olmak için hazır
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/iletisim">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                    >
                      İletişime Geçin
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                  >
                    Canlı Destek
                  </Button>
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
