"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  Shield,
  Award,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export default function Footer() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({ type: "success", message: data.message })
        setEmail("")
      } else {
        setSubmitStatus({ type: "error", message: data.error || "Bir hata oluştu" })
      }
    } catch (error) {
      setSubmitStatus({ type: "error", message: "Bağlantı hatası. Lütfen tekrar deneyin." })
    } finally {
      setIsSubmitting(false)
    }
  }
  // </CHANGE>

  return (
    <footer className="relative py-20 px-4 md:px-8 lg:px-16 border-t border-white/10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12 mb-16">
          {/* Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="flex items-center">
              <Image src="/logo-white.svg" alt="Kredi Takip" width={180} height={40} className="h-8 w-auto" />
            </Link>
            <p className="text-white/70 leading-relaxed">
              OCR teknolojisi ile kredi yönetiminin geleceğini bugün yaşayın. Finansal özgürlüğünüze giden yolda
              güvenilir partneriniz.
            </p>

            {/* Trust Indicators */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>AES-256 Şifreleme</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Award className="w-4 h-4 text-teal-400" />
                <span>SOC 2 Type 2 Sertifikalı</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>1.2M+ Analiz Edilen Döküm</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-4">
              <Link
                href="https://www.facebook.com/kreditakip.com.tr"
                className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-full flex items-center justify-center transition-all duration-300 group"
              >
                <Facebook className="w-5 h-5 text-white/60 group-hover:text-emerald-400" />
              </Link>
              <Link
                href="https://twitter.com/kreditakipcomtr"
                className="w-10 h-10 bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/30 rounded-full flex items-center justify-center transition-all duration-300 group"
              >
                <Twitter className="w-5 h-5 text-white/60 group-hover:text-teal-400" />
              </Link>
              <Link
                href="https://www.instagram.com/kreditakip.com.tr"
                className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-full flex items-center justify-center transition-all duration-300 group"
              >
                <Instagram className="w-5 h-5 text-white/60 group-hover:text-emerald-400" />
              </Link>
              <Link
                href="https://www.linkedin.com/company/kreditakipcomtr"
                className="w-10 h-10 bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/30 rounded-full flex items-center justify-center transition-all duration-300 group"
              >
                <Linkedin className="w-5 h-5 text-white/60 group-hover:text-teal-400" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-full flex items-center justify-center transition-all duration-300 group"
              >
                <Youtube className="w-5 h-5 text-white/60 group-hover:text-emerald-400" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Ürün</h3>
            <div className="space-y-4">
              <Link
                href="/ozellikler"
                className="block text-white/70 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>Özellikler</span>
              </Link>
              <Link
                href="/ocr-teknolojisi"
                className="block text-white/70 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>OCR Teknolojisi</span>
              </Link>
              <Link
                href="/guvenlik"
                className="block text-white/70 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>Güvenlik</span>
              </Link>
              <Link
                href="/fiyatlandirma"
                className="block text-white/70 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>Fiyatlandırma</span>
              </Link>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Şirket</h3>
            <div className="space-y-4">
              <Link
                href="/hakkimizda"
                className="block text-white/70 hover:text-teal-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>Hakkımızda</span>
              </Link>
              <Link
                href="/kariyer"
                className="block text-white/70 hover:text-teal-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>Kariyer</span>
              </Link>
              <Link
                href="/blog"
                className="block text-white/70 hover:text-teal-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>Blog</span>
              </Link>
              <Link
                href="/iletisim"
                className="block text-white/70 hover:text-teal-400 transition-colors duration-300 flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>İletişim</span>
              </Link>
            </div>
          </div>

          {/* Newsletter & Contact */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Bülten</h3>
            <p className="text-white/70">
              Yeni özellikler ve güncellemelerden haberdar olmak için bültenimize abone olun.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-4">
              {submitStatus && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2 text-sm ${
                    submitStatus.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {submitStatus.type === "success" ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <p>{submitStatus.message}</p>
                </div>
              )}

              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="E-posta adresiniz"
                  className="custom-input flex-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>

              <p className="text-xs text-white/50">
                Abone olarak{" "}
                <Link href="/gizlilik-politikasi" className="text-emerald-400 hover:underline">
                  Gizlilik Politikası
                </Link>
                'mız kabul etmiş olursunuz.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="text-lg font-semibold text-white">İletişim</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>info@kreditakip.com.tr</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <Phone className="w-4 h-4 text-teal-400" />
                  <span>+90 543 203 53 09</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-white/70">
                  <MapPin className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <span>Çeşme İzmir, TR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-emerald-400">1.2M+</div>
                <div className="text-white/60 text-sm">Analiz Edilen Döküm</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-teal-400">99.8%</div>
                <div className="text-white/60 text-sm">Doğruluk Oranı</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-emerald-400">25+</div>
                <div className="text-white/60 text-sm">Desteklenen Banka</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-teal-400">{"<3s"}</div>
                <div className="text-white/60 text-sm">İşlem Süresi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <p className="text-white/60 text-sm">© 2025 kreditakip.com.tr Tüm hakları saklıdır.</p>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>v1.0.0 - Son güncelleme: 1 Kasım 2025</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/gizlilik-politikasi" className="text-white/60 hover:text-white text-sm transition-colors">
                Gizlilik Politikası
              </Link>
              <Link href="/kullanim-sartlari" className="text-white/60 hover:text-white text-sm transition-colors">
                Kullanım Şartları
              </Link>
              <Link href="/cerez-politikasi" className="text-white/60 hover:text-white text-sm transition-colors">
                Çerez Politikası
              </Link>
              <Link href="/kvkk-aydinlatma" className="text-white/60 hover:text-white text-sm transition-colors">
                KVKK
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
