"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Award,
  CheckCircle,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  ArrowRight,
  Sparkles,
  CreditCard,
  Brain,
  BarChart3,
  Scan,
} from "lucide-react"
import Image from "next/image"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gray-900 border-t border-gray-800">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

      <div className="container mx-auto px-4 py-16 relative">
        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl border border-emerald-500/20 p-8 mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">KrediTakip Bülteni</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Finans dünyasındaki son gelişmeleri kaçırmayın</h3>
              <p className="text-gray-400">
                Haftalık kredi analizi raporları, tasarruf ipuçları ve platform güncellemeleri
              </p>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="E-posta adresiniz"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
              />
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-6">
              <Image src="/images/logo-white.svg" alt="KrediTakip" width={200} height={45} className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              OCR teknolojisi ve yapay zeka ile kredilerinizi profesyonel seviyede yönetin. Türkiye'nin en güvenilir
              kredi takip ve analiz platformu.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="text-2xl font-bold text-emerald-400">25K+</div>
                <div className="text-sm text-gray-400">Aktif Kullanıcı</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="text-2xl font-bold text-emerald-400">₺2.5M+</div>
                <div className="text-sm text-gray-400">Toplam Tasarruf</div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              {[
                { icon: Linkedin, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Youtube, href: "#" },
              ].map((social, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 transition-all duration-300"
                  asChild
                >
                  <Link href={social.href}>
                    <social.icon className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              Ürün
            </h3>
            <ul className="space-y-4">
              {[
                { name: "Özellikler", href: "/ozellikler" },
                { name: "Fiyatlandırma", href: "/fiyatlandirma" },
                { name: "API Dokümantasyonu", href: "#" },
                { name: "Entegrasyonlar", href: "#" },
                { name: "Güvenlik", href: "#" },
                { name: "Mobil Uygulama", href: "#" },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-400" />
              Şirket
            </h3>
            <ul className="space-y-4">
              {[
                { name: "Hakkımızda", href: "/hakkimizda" },
                { name: "İletişim", href: "/iletisim" },
                { name: "Kariyer", href: "#" },
                { name: "Blog", href: "#" },
                { name: "Basın Kiti", href: "#" },
                { name: "Yatırımcılar", href: "#" },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              Destek
            </h3>
            <ul className="space-y-4">
              {[
                { name: "Yardım Merkezi", href: "#" },
                { name: "Canlı Destek", href: "#" },
                { name: "Video Eğitimler", href: "#" },
                { name: "SSS", href: "#" },
                { name: "Durum Sayfası", href: "#" },
                { name: "Topluluk", href: "#" },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Phone,
              title: "Telefon Desteği",
              content: "+90 212 555 0123",
              subtitle: "Pazartesi-Cuma 09:00-18:00",
            },
            {
              icon: Mail,
              title: "E-posta Desteği",
              content: "destek@kreditakip.com",
              subtitle: "24 saat içinde yanıt",
            },
            {
              icon: MapPin,
              title: "Ofis Adresi",
              content: "Maslak, İstanbul",
              subtitle: "Ziyaret randevusu için arayın",
            },
          ].map((contact, index) => (
            <div
              key={index}
              className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all duration-300">
                  <contact.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{contact.title}</h4>
                  <p className="text-emerald-400 font-medium mb-1">{contact.content}</p>
                  <p className="text-sm text-gray-500">{contact.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              { icon: Shield, text: "256-bit SSL Şifreleme" },
              { icon: Award, text: "SOC 2 Type II Sertifikalı" },
              { icon: CheckCircle, text: "KVKK Uyumlu" },
              { icon: Scan, text: "ISO 27001 Sertifikalı" },
            ].map((trust, index) => (
              <div key={index} className="flex items-center space-x-3 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                  <trust.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {trust.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">© {currentYear} KrediTakip. Tüm hakları saklıdır.</div>
          <div className="flex flex-wrap gap-6 text-sm">
            {["Gizlilik Politikası", "Kullanım Şartları", "KVKK Politikası", "Çerez Politikası"].map((item, index) => (
              <Link
                key={index}
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-300"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
